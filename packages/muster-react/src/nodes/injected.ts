import {
  createNodeDefinition,
  createNodeType,
  error,
  getInvalidTypeError,
  graphTypes,
  isNodeDefinition,
  NodeDefinition,
  NodeExecutionContext,
  pending,
  StatefulGraphNode,
  StatefulNodeType,
  toValue,
  types,
  ValueNode,
  ValueNodeType,
} from '@dws/muster';
import { isObservable, ObservableLike, Subscription } from '@dws/muster-observable';
// tslint:disable-next-line:import-name-case-insensitive
import lodashGet from 'lodash/get';

export const INJECTED_CONTEXT_NAME = '$$injected';

/**
 * An instance of the [[injected]] node.
 * See the [[injected]] documentation to find out more.
 */
export interface InjectedNode
  extends StatefulGraphNode<
      'injected',
      InjectedNodeProperties,
      InjectedNodeState,
      InjectedNodeData
    > {}

/**
 * A definition of the [[injected]] node.
 * See the [[injected]] documentation to find out more.
 */
export interface InjectedNodeDefinition
  extends NodeDefinition<'injected', InjectedNodeProperties, InjectedNodeState, InjectedNodeData> {}

export interface InjectedNodeProperties {
  path: Array<string>;
}

export interface InjectedNodeState {
  currentValue: NodeDefinition;
}

export interface InjectedNodeData {
  subscription: Subscription;
}

/**
 * The implementation of the [[injected]] node.
 * See the [[injected]] documentation to learn more.
 */
export const InjectedNodeType: StatefulNodeType<
  'injected',
  InjectedNodeProperties,
  InjectedNodeState
> = createNodeType<'injected', InjectedNodeProperties, InjectedNodeState>('injected', {
  state: {
    currentValue: graphTypes.nodeDefinition,
  },
  shape: {
    path: types.arrayOf(types.string),
  },
  getInitialState(): InjectedNodeState {
    return {
      currentValue: pending(),
    };
  },
  operations: {
    evaluate: {
      run(
        node: InjectedNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: InjectedNodeState,
      ): NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(
        this: NodeExecutionContext<InjectedNodeState, InjectedNodeData>,
        node: InjectedNode,
      ): void {
        // Verify the path
        const { path } = node.definition.properties;
        // Check if the right context value is set
        if (!(INJECTED_CONTEXT_NAME in node.context.values)) {
          this.setState({
            currentValue: error('Injected node can only be used within a container'),
          });
          return;
        }
        // Verify the injected context value
        const injectedNode = node.context.values[INJECTED_CONTEXT_NAME];
        if (!ValueNodeType.is(injectedNode)) {
          this.setState({
            currentValue: error(
              getInvalidTypeError(
                'Invalid type of requirements stream supplied with the context.',
                {
                  expected: ['value(Observable<any>)'],
                  received: injectedNode,
                },
              ),
            ),
          });
          return;
        }
        // Verify the injected props stream
        const injectedPropsStream = (injectedNode as ValueNode<ObservableLike<any>>).definition
          .properties.value;
        if (!isObservable(injectedPropsStream)) {
          this.setState({
            currentValue: error(
              getInvalidTypeError('Requirements context value has invalid type.', {
                expected: ['Observable<any>'],
                received: injectedPropsStream,
              }),
            ),
          });
          return;
        }
        const { subscription: previousSubscription } = this.getData();
        this.setData({
          subscription: injectedPropsStream.subscribe((v) => {
            this.setState({
              currentValue: toValue(lodashGet(v, path)),
            });
          }),
        });
        previousSubscription && previousSubscription.unsubscribe();
      },
      onUnsubscribe(this: NodeExecutionContext<InjectedNodeState, InjectedNodeData>): void {
        const { subscription } = this.getData();
        subscription && subscription.unsubscribe();
      },
    },
  },
});

/**
 * Creates a new instance of the [[injected]] node, which is used when accessing a value of the injected property
 * from within the local container graph.
 *
 *
 * @example **Access injected property form local graph**
 * ```js
 * import { computed, container, injected, types } from '@dws/muster-react';
 *
 * container({
 *   require: {
 *     firstName: true,
 *   },
 *   graph: {
 *     greeting: computed(
 *       [injected('firstName')],
 *       (firstName) => `Hello, ${firstName}`,
 *     ),
 *   },
 *   props: {
 *     greeting: true,
 *   }
 * });
 * ```
 * This example shows how to use the [[injected]] node to access the value of an injected property from within
 * the local container graph.
 */
export function injected(...path: Array<string>): InjectedNodeDefinition {
  if (!path || path.length === 0) {
    throw new Error('Path to the injected property must not be empty.');
  }
  return createNodeDefinition(InjectedNodeType, {
    path,
  });
}

export function isInjectedNodeDefinition(value: any): value is InjectedNodeDefinition {
  return isNodeDefinition(value) && value.type === InjectedNodeType;
}
