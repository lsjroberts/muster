import { Subscription } from '@dws/muster-observable';
import { Operation, Scenario, scenarioRunner } from '@dws/muster-test-utils';
import muster from '..';
import { ContextValuesDefinitions, Muster } from '../muster';
import { error, ErrorNodeDefinition, isErrorNodeDefinition } from '../nodes/graph/error';
import { NodeDefinition } from '../types/graph';
import { formatError } from '../utils/format-error';
import { registerJestMatchers } from './register-jest-matchers';

registerJestMatchers();

export interface MockSubscriber {
  subscription: Subscription;
  next: jest.Mock<NodeDefinition>;
}

export interface MusterScenario {
  description: string;
  before?: () => any | Promise<any>;
  after?: () => any | Promise<any>;
  graph?: (() => Muster);
  operations: Array<MusterOperation> | ((app: () => Muster) => Array<MusterOperation>);
}

export interface MusterOperation {
  description: string;
  skip?: boolean;
  only?: boolean;
  before?: () => any | Promise<any>;
  after?: () => any | Promise<any>;
  input?: NodeDefinition;
  context?: ContextValuesDefinitions;
  expected?: NodeDefinition | Array<NodeDefinition>;
  assert?: (results: Array<NodeDefinition>) => void | Promise<void>;
  operations?:
    | Array<MusterOperation>
    | ((
        subscriber: () => MockSubscriber,
        results: () => Array<NodeDefinition>,
      ) => Array<MusterOperation>);
}

type MusterScenarioState = Muster;

interface MusterScenarioInput {
  node: NodeDefinition;
  context?: ContextValuesDefinitions;
  await: boolean;
}

interface MusterScenarioOutput {
  values: Array<NodeDefinition>;
  subscriber: MockSubscriber;
}

export interface MusterScenarioBuilder {
  (scenario: MusterScenario | (() => MusterScenario)): void;

  only(scenario: MusterScenario | (() => MusterScenario)): void;

  skip(scenario: MusterScenario | (() => MusterScenario)): void;
}

type MusterScenarioDefinition = Scenario<
  MusterScenarioState,
  MusterScenarioInput,
  MusterScenarioOutput,
  NodeDefinition | Array<NodeDefinition>
>;

type MusterOperationDefinition = Operation<
  MusterScenarioInput,
  MusterScenarioOutput,
  NodeDefinition | Array<NodeDefinition>
>;

export default createMusterScenarioBuilder();

function createMusterScenarioBuilder(): MusterScenarioBuilder {
  const scenarioBuilder = createRunner();
  const factory = run.bind(null, scenarioBuilder);
  factory.only = run.bind(null, scenarioBuilder.only);
  factory.skip = run.bind(null, scenarioBuilder.skip);
  return factory;

  function run(
    runner: (scenario: MusterScenarioDefinition) => void,
    scenario: MusterScenario | (() => MusterScenario),
  ): void {
    runner(parseScenario(typeof scenario === 'function' ? scenario() : scenario));
  }
}

export const operation = Object.assign(
  // tslint:disable-next-line:ter-prefer-arrow-callback
  function operation(definition: MusterOperation): MusterOperation {
    return definition;
  },
  {
    only: (definition: MusterOperation): MusterOperation => {
      return {
        only: true,
        ...operation(definition),
      };
    },
    skip: (definition: MusterOperation): MusterOperation => {
      return {
        skip: true,
        ...operation(definition),
      };
    },
  },
);

function createRunner() {
  return scenarioRunner<Muster, MusterScenarioInput, MusterScenarioOutput, Array<NodeDefinition>>({
    async run(input: MusterScenarioInput, app: () => Muster) {
      let firstResultResolver: (value: any) => void;
      const firstResult = new Promise<NodeDefinition>((resolve, reject) => {
        firstResultResolver = resolve;
      });
      const mockObserver = jest.fn<NodeDefinition>((value: any) => firstResultResolver(value));
      const stream = app().resolve(input.node, { context: input.context, raw: true });
      const subscription = stream.subscribe(mockObserver);
      const subscriber = { next: mockObserver, subscription };
      if (input.await) {
        await firstResult;
      }
      return {
        values: subscriber.next.mock.calls.map(([value]: [NodeDefinition]) => value),
        subscriber,
      };
    },
    assert(actual: MusterScenarioOutput, expected: NodeDefinition | Array<NodeDefinition>) {
      const expectedResults = Array.isArray(expected) ? expected : [expected];
      const actualResults = actual
        ? actual.subscriber.next.mock.calls.map(([value]: [NodeDefinition]) => value)
        : [];
      const isExpectingError = expectedResults.some(isErrorNodeDefinition);
      if (!isExpectingError && actualResults.some(isErrorNodeDefinition)) {
        const errorNodeDefinition = actualResults.find(
          isErrorNodeDefinition,
        ) as ErrorNodeDefinition;
        throw formatError(errorNodeDefinition);
      }
      if (Array.isArray(expected) || actualResults.length > 1) {
        expect(actualResults).toEqual(expectedResults);
      } else if (!actual) {
        expect(undefined).toEqual(expectedResults[0]);
      } else {
        expect(actual.subscriber.next).toHaveBeenCalledTimes(1);
        expect(actualResults[0]).toEqual(expectedResults[0]);
      }
    },
    assertNotError(actual: MusterScenarioOutput) {
      const actualResults = actual
        ? actual.subscriber.next.mock.calls.map(([value]: [NodeDefinition]) => value)
        : [];
      if (actualResults.some(isErrorNodeDefinition)) {
        const errorNodeDefinition = actualResults.find(
          isErrorNodeDefinition,
        ) as ErrorNodeDefinition;
        throw formatError(errorNodeDefinition);
      }
    },
  });
}

function parseScenario(scenario: MusterScenario): MusterScenarioDefinition {
  const { description, graph, before, after, operations } = scenario;
  return {
    description,
    init: graph || (() => muster(error('No graph specified'))),
    before,
    after,
    operations: parseScenarioOperations(operations),
  };
}

function parseScenarioOperations(
  operations: Array<MusterOperation> | ((app: () => Muster) => Array<MusterOperation>),
): Array<MusterOperationDefinition> | ((app: () => Muster) => Array<MusterOperationDefinition>) {
  if (typeof operations === 'function') {
    return (app) => parseOperations(operations(app));
  }
  return parseOperations(operations);
}

function parseChildOperations(
  operations:
    | Array<MusterOperation>
    | ((results: () => MusterScenarioOutput) => Array<MusterOperation>),
):
  | Array<MusterOperationDefinition>
  | ((results: () => MusterScenarioOutput) => Array<MusterOperationDefinition>) {
  if (typeof operations === 'function') {
    return (results) => parseOperations(operations(results));
  }
  return parseOperations(operations);
}

function parseOperations(operations: Array<MusterOperation>): Array<MusterOperationDefinition> {
  return operations.map((operation) => {
    const { assert, operations: childOperations } = operation;
    return {
      description: operation.description,
      skip: operation.skip,
      only: operation.only,
      before: operation.before,
      after: operation.after,
      ...(operation.input
        ? {
            input: {
              node: operation.input,
              context: operation.context ? operation.context : undefined,
              await: Boolean(operation.expected),
            },
          }
        : {}),
      expected: operation.expected,
      assert: assert
        ? (results: MusterScenarioOutput) => assert(results && results.values)
        : undefined,
      operations: childOperations
        ? parseChildOperations(
            typeof childOperations === 'function'
              ? (results: () => MusterScenarioOutput) =>
                  childOperations(
                    () => results() && results().subscriber,
                    () => results() && results().values,
                  )
              : childOperations,
          )
        : undefined,
    };
  });
}
