import {
  entries,
  EntriesNodeDefinition,
  ErrorNodeDefinition,
  fields,
  FieldsNodeDefinition,
  formatError,
  getType,
  isErrorNodeDefinition,
  isNodeDefinition,
  key,
  Muster,
  NodeDefinition,
  query,
  root,
  valueOf,
} from '@dws/muster';
import { Subscription } from '@dws/muster-observable';
import { Operation, Scenario, scenarioRunner } from '@dws/muster-test-utils';
import { registerJestMatchers } from '@dws/muster/test';
import { mount, ReactWrapper, shallow, ShallowWrapper } from 'enzyme';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import React, { ComponentClass, StatelessComponent } from 'react';
import { ContainerComponentFactory } from '../container-types';

registerJestMatchers();

export interface MockSubscriber {
  subscription: Subscription;
  next: jest.Mock<void>;
}

export interface ReactProps {
  [name: string]: any;
}

export interface MusterReactScenario {
  description: string;
  before?: () => any | Promise<any>;
  after?: () => any | Promise<any>;
  graph: (() => Muster);
  context?: { [key: string]: any };
  props?: { [key: string]: any };
  shallow?: boolean;
  container: ContainerComponentFactory;
  component?: ComponentClass<ReactProps> | StatelessComponent<ReactProps> | string;
  expected?: Omit<MusterReactExpectedResult, 'value'>;
  assert?: (results: MusterReactScenarioResults) => void | Promise<void>;
  operations?:
    | Array<MusterReactOperation>
    | ((getState: () => MusterReactScenarioState) => Array<MusterReactOperation>);
}

export interface MusterReactExpectedResult {
  value?: any;
  props?: ReactProps | Array<ReactProps>;
  snapshot?: boolean;
  graph?: object;
}

export interface MusterReactOperation {
  description: string;
  input?: NodeDefinition | ((results: MusterReactScenarioInputState) => any | Promise<any>);
  skip?: boolean;
  only?: boolean;
  before?: () => any | Promise<any>;
  after?: () => any | Promise<any>;
  expected?: MusterReactExpectedResult;
  assert?: (results: MusterReactScenarioResults) => void | Promise<void>;
  operations?:
    | Array<MusterReactOperation>
    | ((results: () => MusterReactScenarioOutput) => Array<MusterReactOperation>);
}

export interface MusterReactScenarioState {
  graph: Muster;
  props: ReactProps;
  view: ReactWrapper | ShallowWrapper;
  shallow: boolean;
  render: jest.Mock<ReactProps>;
}

type MusterReactScenarioInput = MusterReactOperation['input'];

export interface MusterReactScenarioOutput {
  value: Array<NodeDefinition> | NodeDefinition | any;
  view: ReactWrapper | ShallowWrapper;
  shallow: boolean;
  props: Array<ReactProps>;
  render: jest.Mock<ReactProps>;
}

export interface MusterReactScenarioResults {
  value: Array<NodeDefinition> | NodeDefinition | any;
  view: ReactWrapper | ShallowWrapper;
  props: ReactProps;
  renderedProps: Array<ReactProps>;
}

export interface MusterReactScenarioInputState {
  view: ReactWrapper | ShallowWrapper;
  props: ReactProps;
}

export interface MusterReactScenarioBuilder {
  (scenario: MusterReactScenario | (() => MusterReactScenario)): void;
  only(scenario: MusterReactScenario | (() => MusterReactScenario)): void;
  skip(scenario: MusterReactScenario | (() => MusterReactScenario)): void;
}

type MusterReactScenarioDefinition = Scenario<
  MusterReactScenarioState,
  MusterReactScenarioInput,
  MusterReactScenarioOutput,
  MusterReactExpectedResult
>;

type MusterReactOperationDefinition = Operation<
  MusterReactScenarioInput,
  MusterReactScenarioOutput,
  MusterReactExpectedResult
>;

export default createMusterScenarioBuilder();

function createMusterScenarioBuilder(): MusterReactScenarioBuilder {
  const scenarioBuilder = createRunner();
  const factory = run.bind(null, scenarioBuilder);
  factory.only = run.bind(null, scenarioBuilder.only);
  factory.skip = run.bind(null, scenarioBuilder.skip);
  return factory;

  function run(
    runner: (scenario: MusterReactScenarioDefinition) => void,
    scenario: MusterReactScenario | (() => MusterReactScenario),
  ): void {
    runner(parseScenario(typeof scenario === 'function' ? scenario() : scenario));
  }
}

export const operation = Object.assign(
  (definition: MusterReactOperation): MusterReactOperation => definition,
  {
    only(definition: MusterReactOperation): MusterReactOperation {
      return { ...definition, only: true };
    },
    skip(definition: MusterReactOperation): MusterReactOperation {
      return { ...definition, skip: true };
    },
  },
);

function parseScenario(scenario: MusterReactScenario): MusterReactScenarioDefinition {
  const { description, before, after, operations } = scenario;
  return {
    description,
    init(): MusterReactScenarioState {
      const app = scenario.graph();
      const state: MusterReactScenarioState = {
        graph: app,
        props: {},
        render: jest.fn<ReactProps>((props: ReactProps) => (state.props = props)),
        view: undefined as any,
        shallow: Boolean(scenario.shallow),
      };
      const spyOnProps = (InnerComponent: StatelessComponent | ComponentClass | string) => (
        props: ReactProps,
      ): JSX.Element => React.createElement(InnerComponent, state.render(props));
      const SpyContainer = scenario.container(spyOnProps(scenario.component || (() => null)));
      const element = React.createElement(SpyContainer, scenario.props);
      const context = {
        muster: app,
        ...scenario.context,
      };
      const renderedView = scenario.shallow
        ? shallow(element, { context })
        : mount(element, { context });
      state.view = renderedView;
      return state;
    },
    before,
    after,
    operations:
      typeof operations === 'function'
        ? (getState: () => MusterReactScenarioState) => [
            createInitialRenderOperation(scenario, parseScenarioOperations(operations(getState))),
          ]
        : [
            createInitialRenderOperation(
              scenario,
              operations ? parseScenarioOperations(operations) : [],
            ),
          ],
  };
}

function createInitialRenderOperation(
  scenario: MusterReactScenario,
  operations: Array<MusterReactOperationDefinition>,
): MusterReactOperationDefinition {
  return {
    description: 'WHEN the component is rendered',
    input: undefined,
    expected: scenario.expected,
    assert: scenario.assert && parseOperationAssert(scenario.assert),
    operations,
  };
}

function parseScenarioOperations(
  operations: Array<MusterReactOperation>,
): Array<MusterReactOperationDefinition>;
function parseScenarioOperations(
  operations: (getState: () => MusterReactScenarioState) => Array<MusterReactOperation>,
): (getState: () => MusterReactScenarioState) => Array<MusterReactOperationDefinition>;
function parseScenarioOperations(
  operations:
    | Array<MusterReactOperation>
    | ((getState: () => MusterReactScenarioState) => Array<MusterReactOperation>),
):
  | Array<MusterReactOperationDefinition>
  | ((getState: () => MusterReactScenarioState) => Array<MusterReactOperationDefinition>) {
  if (typeof operations === 'function') {
    return (getState) => parseOperations(operations(getState));
  }
  return parseOperations(operations);
}

function parseChildOperations(
  operations:
    | Array<MusterReactOperation>
    | ((results: () => MusterReactScenarioOutput) => Array<MusterReactOperation>),
):
  | Array<MusterReactOperationDefinition>
  | ((results: () => MusterReactScenarioOutput) => Array<MusterReactOperationDefinition>) {
  if (typeof operations === 'function') {
    return (results) => parseOperations(operations(results));
  }
  return parseOperations(operations);
}

function parseOperations(
  operations: Array<MusterReactOperation>,
): Array<MusterReactOperationDefinition> {
  return operations.map((operation) => {
    const { operations: childOperations } = operation;
    return {
      description: operation.description,
      skip: operation.skip,
      only: operation.only,
      before: async () => {
        jest.clearAllMocks();
        if (operation.before) {
          await operation.before();
        }
      },
      after: operation.after,
      input: operation.input,
      expected: operation.expected,
      assert: operation.assert && parseOperationAssert(operation.assert),
      operations: childOperations
        ? parseChildOperations(
            typeof childOperations === 'function'
              ? (getResults: () => MusterReactScenarioOutput) => childOperations(getResults)
              : childOperations,
          )
        : undefined,
    };
  });
}

function parseOperationAssert(
  fn: (results: MusterReactScenarioResults) => void | Promise<void>,
): ((results: MusterReactScenarioOutput) => void | Promise<void>) {
  return (results: MusterReactScenarioOutput) =>
    fn({
      value: results.value,
      view: getViewRootWrapper(results.view.update(), { shallow: results.shallow }),
      props: results.props[results.props.length - 1],
      renderedProps: results.render.mock.calls.map(([props]: [ReactProps]) => props),
    });
}

function createRunner() {
  return scenarioRunner<
    MusterReactScenarioState,
    MusterReactScenarioInput,
    MusterReactScenarioOutput,
    MusterReactExpectedResult
  >({
    run: async (
      input: MusterReactScenarioInput,
      getState: () => MusterReactScenarioState,
    ): Promise<MusterReactScenarioOutput> => {
      const state = getState();
      if (isNodeDefinition(input)) {
        let firstResultResolver: (value: NodeDefinition) => void;
        const firstResult = new Promise<NodeDefinition>((resolve) => {
          firstResultResolver = resolve;
        });
        const mockObserver = jest.fn<void>((value: NodeDefinition) => firstResultResolver(value));
        const stream = state.graph.resolve(input, { raw: true });
        const subscription = stream.subscribe(mockObserver);
        const subscriber = Object.assign(mockObserver, { subscription });
        await firstResult;
        getViewRootWrapper(state.view.update(), { shallow: state.shallow });
        return {
          view: state.view,
          value: subscriber.mock.calls.map(([value]: [NodeDefinition]) => value),
          props: state.render.mock.calls.map(([props]: [ReactProps]) => props),
          shallow: state.shallow,
          render: state.render,
        };
      }
      if (typeof input === 'function') {
        const render = state.render;
        if (state.shallow) {
          state.render = jest.fn(<T>(value: T): T => value);
        }
        const result = await input({
          view: getViewRootWrapper(state.view.update(), { shallow: state.shallow }),
          props: state.props,
        });
        if (state.shallow) {
          state.render = render;
        }
        getViewRootWrapper(state.view.update(), { shallow: state.shallow });
        return {
          view: state.view,
          value: result || undefined,
          props: state.render.mock.calls.map(([props]: [ReactProps]) => props),
          shallow: state.shallow,
          render: state.render,
        };
      }
      if (typeof input === 'undefined') {
        getViewRootWrapper(state.view.update(), { shallow: state.shallow });
        return {
          view: state.view,
          value: undefined,
          props: state.render.mock.calls.map(([props]: [ReactProps]) => props),
          shallow: state.shallow,
          render: state.render,
        };
      }
      throw new Error(`Invalid operation input: ${getType(input)}`);
    },
    assert: async (
      actual: MusterReactScenarioOutput,
      expected: MusterReactExpectedResult,
      state: MusterReactScenarioState,
    ) => {
      const actualResults =
        actual.value && !Array.isArray(actual.value) ? [actual.value] : actual.value || [];
      const expectedResults =
        expected.value && !Array.isArray(expected.value) ? [expected.value] : expected.value || [];
      if (
        actualResults.some(isErrorNodeDefinition) &&
        !expectedResults.some(isErrorNodeDefinition)
      ) {
        throw formatError(actualResults.find(isErrorNodeDefinition) as ErrorNodeDefinition);
      }
      if (expected.value) {
        assertValues(actual.value, expected.value);
      }
      if (expected.props) {
        assertProps(actual.props, expected.props);
      }
      if (expected.graph) {
        await assertGraph(state.graph, expected.graph);
      }
      if (expected.snapshot) {
        assertSnapshot(getViewRootWrapper(actual.view, { shallow: actual.shallow }));
      }

      function assertValues<T>(actual: Array<T> | T | undefined, expected: T | Array<T>): void {
        expect(
          !Array.isArray(expected) && Array.isArray(actual) && actual.length <= 1
            ? actual[0]
            : actual,
        ).toEqual(expected);
      }

      function assertProps(
        actual: Array<ReactProps>,
        expected: ReactProps | Array<ReactProps>,
      ): void {
        return assertValues(actual.map((props) => omit(props, ['$$inject'])), expected);
      }

      function assertGraph(actual: Muster, expected: object): Promise<void> {
        return actual
          .resolve(query(root(), parseQueryFields(expected)), { raw: true })
          .then((result: NodeDefinition) => {
            if (isErrorNodeDefinition(result)) {
              throw formatError(result);
            }
            expect(valueOf(result)).toEqual(expected);
          });

        function parseQueryFields(value: object): FieldsNodeDefinition | EntriesNodeDefinition {
          if (Array.isArray(value)) {
            const firstItem = value[0];
            const isPrimitiveList =
              !firstItem || typeof firstItem !== 'object' || isNodeDefinition(firstItem);
            return isPrimitiveList ? entries() : entries(parseQueryFields(firstItem));
          }
          return fields(
            mapValues(value as { [key: string]: any }, (child: any, childKey: string) => {
              const isLeaf = (child && typeof child !== 'object') || isNodeDefinition(child);
              return isLeaf ? key(childKey) : key(childKey, parseQueryFields(child));
            }),
          );
        }
      }

      function assertSnapshot(view: ReactWrapper | ShallowWrapper): void {
        expect(view).toMatchSnapshot();
      }
    },
    assertNotError(actual: MusterReactScenarioOutput) {
      const actualResults =
        actual.value && !Array.isArray(actual.value) ? [actual.value] : actual.value || [];
      if (actualResults.some(isErrorNodeDefinition)) {
        const errorNodeDefinition = actualResults.find(
          isErrorNodeDefinition,
        ) as ErrorNodeDefinition;
        throw formatError(errorNodeDefinition);
      }
    },
  });
}

function getViewRootWrapper(
  view: ReactWrapper | ShallowWrapper,
  options: { shallow: boolean },
): ReactWrapper | ShallowWrapper {
  return options.shallow
    ? (view as ShallowWrapper).dive().dive()
    : (view as ReactWrapper)
        .children()
        .children()
        .children();
}
