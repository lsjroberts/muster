import {
  formatError,
  getInvalidTypeError,
  ifPending,
  isErrorNodeDefinition,
  isScopeNodeDefinition,
  isValueNodeDefinition,
  NodeDefinition,
  NodeLike,
  ref,
  root,
  scope,
  ScopeNodeProperties,
  toNode,
  value,
  ValueNodeType,
} from '@dws/muster';
import { BehaviorSubject } from '@dws/muster-observable';
const hoistNonReactStatics = require('hoist-non-react-statics');
import flow from 'lodash/flow';
import identity from 'lodash/identity';
import omit from 'lodash/omit';
import uniqueId from 'lodash/uniqueId';
import * as PropTypes from 'prop-types';
import { Component, ComponentClass, createElement, StatelessComponent } from 'react';
import { polyfill } from 'react-lifecycles-compat';
import {
  ContainerComponent,
  ContainerComponentFactory,
  ExternalComponentProps,
  InjectedProps,
  MusterReactProps,
  MusterReactState,
  Props,
  RenderErrorCallback,
  RenderLoadingCallback,
  ResolvedProps,
  ScopeTransformer,
} from '../container-types';
import { GLOBAL_ROOT_NODE } from '../nodes/global-root';
import { INJECTED_CONTEXT_NAME } from '../nodes/injected';
import { REACT_PROP_CONTEXT_NAME } from '../nodes/prop';
import { InjectedMatcher, isInjectedMatcher } from '../types/injected';
import { tree } from '../types/tree';
import { buildPropsInjector, buildTopLevelPropsInjector } from './build-props-injector';
import { buildQuery } from './build-query';
import { buildSettersAndCallersQuery } from './build-setters-and-callers-query';
import { buildTreeValidator } from './build-tree-validator';
import { createDisposeEmitter } from './create-dispose-emitter';
import getDisplayName from './get-display-name';
import getMuster from './get-muster';
import { renderPlatformErrors } from './render-platform-errors';
import { sanitizeProps } from './sanitize-props';
import { getInjectedProps, toRequirementsTree } from './to-requirements-tree';

const INJECTED_PROPS_NAME = '$inject';
const PENDING_TOKEN = Symbol('pending');

export interface ContainerFactoryConfiguration<PF, P extends Props<PF>, RF, R extends Props<RF>> {
  events?: ScopeNodeProperties['redispatch'];
  graph?: NodeLike;
  props: P | InjectedMatcher;
  queryPrefix?: Array<NodeLike>;
  relaxPropsValidation?: boolean;
  renderError?: RenderErrorCallback<PF, P> | true;
  renderLoading?: RenderLoadingCallback<PF, P> | true;
  require?: R;
}

export default function createContainerFactory<PF, P extends Props<PF>, RF, R extends Props<RF>>(
  configuration: ContainerFactoryConfiguration<PF, P, RF, R>,
  transform: ScopeTransformer = identity,
): ContainerComponentFactory<PF, P, RF, R> {
  const containerPrefix = uniqueId('component_');
  const componentGraph = configuration.graph;
  const requirementsTree = configuration.require ? sanitizeProps(configuration.require) : undefined;
  const propsTree = isInjectedMatcher(configuration.props)
    ? tree({})
    : sanitizeProps(configuration.props);
  const requirementsValidator = requirementsTree ? buildTreeValidator(requirementsTree) : () => [];
  const propsValidator = buildTreeValidator(propsTree);

  function getContainerRoot(
    injectedPropsStream: BehaviorSubject<InjectedProps<R> | undefined>,
    componentPropsStream: BehaviorSubject<MusterReactProps<RF, R>>,
  ): NodeDefinition {
    if (componentGraph) {
      return scope(
        toNode(componentGraph),
        {
          [INJECTED_CONTEXT_NAME]: value(injectedPropsStream),
          [REACT_PROP_CONTEXT_NAME]: value(componentPropsStream),
          [GLOBAL_ROOT_NODE]: root(),
        },
        configuration.events,
      );
    }
    return configuration.queryPrefix ? ref(...configuration.queryPrefix) : root();
  }

  return <E extends ExternalComponentProps = ExternalComponentProps>(
    component: ComponentClass<ResolvedProps<PF, P>> | StatelessComponent<ResolvedProps<PF, P>>,
  ): ContainerComponent<RF, R, E> => {
    const componentName = getDisplayName(component);
    const propsInjector = isInjectedMatcher(configuration.props)
      ? buildTopLevelPropsInjector(configuration.props, requirementsTree)
      : buildPropsInjector(propsTree, requirementsTree);

    function validateInjectedProps(props: any) {
      if (!requirementsTree) return;
      if (!(INJECTED_PROPS_NAME in props)) {
        throw new Error(
          `Component "${componentName}" is declaring injected props but none were injected from the parent container`,
        );
      }
    }

    class ContainerComponentImpl extends Component<
      MusterReactProps<RF, R> & E,
      MusterReactState<RF, R>
    > {
      static getRequirements() {
        return requirementsTree ? toRequirementsTree(containerPrefix, requirementsTree) : {};
      }

      static inject(props: any, path: Array<string> = []) {
        return {
          [INJECTED_PROPS_NAME]: requirementsTree
            ? getInjectedProps(containerPrefix, requirementsTree, props, path)
            : {},
        };
      }

      static contextTypes = {
        muster: PropTypes.object,
      };

      static propTypes = {
        [INJECTED_PROPS_NAME]: PropTypes.any,
        muster: PropTypes.any,
      };

      constructor(props: MusterReactProps<RF, R> & E, context?: any) {
        super(props, context);
        validateInjectedProps(props);
        const muster = getMuster(componentName, props, context);
        const injectedPropsStream = new BehaviorSubject(props[INJECTED_PROPS_NAME]);
        const reactPropsStream = new BehaviorSubject(omit(props, [INJECTED_PROPS_NAME]));
        const disposeEmitter = createDisposeEmitter();
        const containerRoot = getContainerRoot(injectedPropsStream, reactPropsStream);
        const dataQuery = buildQuery(disposeEmitter, propsTree, containerRoot);
        const settersAndCallersQuery = buildSettersAndCallersQuery(
          disposeEmitter,
          propsTree,
          containerRoot,
        );
        this.state = {
          containerRoot,
          data: {},
          dataLoaded: !dataQuery,
          dataQuery,
          disposeEmitter,
          errors: [],
          injectedPropsStream,
          muster,
          reactPropsStream,
          settersAndCallersLoaded: !settersAndCallersQuery,
          settersAndCallersQuery,
        };
      }

      componentDidMount() {
        this.createSubscription();
      }

      componentWillUnmount() {
        flow(
          disposePendingCallsAndSets,
          disposeDataSubscription,
          disposeSettersAndCallersSubscription,
          disposeContainerRoot,
        )(this.state);
      }

      private createSubscription() {
        const {
          dataQuery,
          dataSubscription,
          settersAndCallersLoaded,
          muster,
          settersAndCallersQuery,
          settersAndCallersSubscription,
        } = this.state;
        if (!settersAndCallersSubscription && settersAndCallersQuery && !settersAndCallersLoaded) {
          let isSync = true;
          let isCompleted = false;
          const subscription = muster
            .resolve(settersAndCallersQuery, { raw: true })
            .subscribe((result) => {
              isCompleted = true;
              if (!isSync) {
                this.setState(disposeSettersAndCallersSubscription(this.state));
              }
              this.processSettersAndCallersQueryResponse(result);
            });
          isSync = false;
          if (isCompleted) {
            subscription.unsubscribe();
          }
          this.setState({
            settersAndCallersLoaded: true,
            settersAndCallersSubscription: isCompleted ? undefined : subscription,
          });
        }
        if (!dataSubscription && dataQuery) {
          this.setState({
            dataSubscription: muster!
              .resolve(ifPending(value(PENDING_TOKEN), dataQuery), { raw: true })
              .subscribe(this.processDataQueryResponse),
          });
        }
      }

      static getDerivedStateFromProps(
        nextProps: MusterReactProps<PF, P>,
        prevState: MusterReactState<PF, P>,
      ) {
        validateInjectedProps(nextProps);
        return updatePropsStreams(nextProps)(prevState);
      }

      processDataQueryResponse = (response: NodeDefinition) => {
        this.processQueryResponse(response, {
          dataLoaded: true,
        });
      };

      processSettersAndCallersQueryResponse = (response: NodeDefinition) => {
        this.processQueryResponse(response, {
          settersAndCallersLoaded: true,
        });
      };

      private processQueryResponse(response: NodeDefinition, props: any) {
        if (isErrorNodeDefinition(response)) {
          this.setState({
            ...props,
            data: {},
            errors: [formatError(response)],
          });
        } else if (isValueNodeDefinition(response)) {
          if (response.properties.value === PENDING_TOKEN) {
            this.setState({
              dataLoaded: false,
            });
          } else {
            this.setState({
              ...props,
              data: response.properties.value,
              errors: [],
            });
          }
        } else {
          this.setState({
            ...props,
            data: undefined,
            errors: [
              getInvalidTypeError('Invalid response received from Muster.', {
                expected: [ValueNodeType],
                received: response,
              }),
            ],
          });
        }
      }

      render() {
        const { data, dataLoaded } = this.state;
        let errors = this.state.errors;
        // Check if the data was loaded correctly
        if (dataLoaded && errors.length === 0) {
          const propsErrors = propsValidator(this.state.data);
          if (configuration.relaxPropsValidation) {
            propsErrors.forEach((error) => console.warn(`[${componentName}]:`, error));
          } else {
            errors = [...errors, ...propsErrors];
          }
        }
        // Check if injected props are correct
        const injectedProps = this.props[INJECTED_PROPS_NAME];
        // Get external props
        const externalProps = omit(this.props, [INJECTED_PROPS_NAME]);
        let combinedProps = data;
        if (requirementsTree) {
          const requirementsErrors = requirementsValidator(injectedProps);
          if (requirementsErrors.length === 0 || configuration.relaxPropsValidation) {
            // Inject required properties
            combinedProps = propsInjector(data, injectedProps);
            requirementsErrors.forEach((error) => console.error(`[${componentName}]:`, error));
          } else {
            errors = [...errors, ...requirementsErrors];
          }
        }
        // Combine the combined props with the external props
        const combinedData = {
          ...(externalProps as any), // TODO: Get rid of this `as any` when we upgrade to Typescript 2.9
          ...transform(combinedProps, externalProps, this.state),
        };
        if (errors.length > 0 && configuration.renderError !== true) {
          return ContainerComponentImpl.renderErrors(
            configuration.renderError,
            combinedData,
            errors,
            this.state.muster.debug,
          );
        }
        if (!dataLoaded && configuration.renderLoading !== true) {
          return ContainerComponentImpl.renderLoading(configuration.renderLoading, combinedData);
        }
        return createElement(component as any, combinedData);
      }

      static renderErrors(
        renderErrorFunc: RenderErrorCallback<PF, P> | undefined,
        combinedProps: any,
        errors: Array<Error>,
        debug: boolean,
      ) {
        if (renderErrorFunc) {
          return renderErrorFunc(errors, combinedProps);
        }
        return debug ? renderPlatformErrors(componentName, errors) : null;
      }

      static renderLoading(
        renderLoadingFunc: RenderLoadingCallback<PF, P> | undefined,
        combinedProps: any,
      ) {
        return renderLoadingFunc ? renderLoadingFunc(combinedProps) : null;
      }
    }

    // HACK: 'hoist-non-react-statics' does not follow a correct export pattern:
    // module.export.default = function hoistNonReactStatics...
    // but the .d.ts file pretends like it is
    // enable react-lifecycles-compat
    return (hoistNonReactStatics as any)(polyfill(ContainerComponentImpl), component, {
      inject: true,
      getRequirements: true,
    });
  };
}

function disposeContainerRoot<PF, P extends Props<PF>>(
  state: MusterReactState<PF, P>,
): MusterReactState<PF, P> {
  if (isScopeNodeDefinition(state.containerRoot)) {
    state.containerRoot.dispose();
  }
  return state;
}

function disposePendingCallsAndSets<PF, P extends Props<PF>>(
  state: MusterReactState<PF, P>,
): MusterReactState<PF, P> {
  state.disposeEmitter.dispose();
  return state;
}

function disposeDataSubscription<PF, P extends Props<PF>>(
  state: MusterReactState<PF, P>,
): MusterReactState<PF, P> {
  if (state.dataSubscription) {
    state.dataSubscription.unsubscribe();
    state.dataSubscription = undefined;
  }
  return state;
}

function disposeSettersAndCallersSubscription<PF, P extends Props<PF>>(
  state: MusterReactState<PF, P>,
): MusterReactState<PF, P> {
  if (state.settersAndCallersSubscription) {
    state.settersAndCallersSubscription.unsubscribe();
    state.settersAndCallersSubscription = undefined;
  }
  return state;
}

function updatePropsStreams<PF, P extends Props<PF>>(props: MusterReactProps<PF, P>) {
  return (state: MusterReactState<PF, P>): MusterReactState<PF, P> => {
    state.reactPropsStream.next(omit(props, [INJECTED_PROPS_NAME]));
    state.injectedPropsStream.next(props[INJECTED_PROPS_NAME]);
    return state;
  };
}
