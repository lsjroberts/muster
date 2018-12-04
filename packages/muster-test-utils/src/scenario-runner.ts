export interface Scenario<S, I, O, E = O> {
  description: string;
  init?: (() => S);
  before?: () => void | Promise<void>;
  after?: () => void | Promise<void>;
  operations: Array<Operation<I, O, E>> | ((state: () => S) => Array<Operation<I, O, E>>);
}

export interface Operation<I, O, E = O> {
  description: string;
  skip?: boolean;
  only?: boolean;
  before?: () => void | Promise<void>;
  after?: () => void | Promise<void>;
  input?: I;
  expected?: E;
  assert?: (results?: O) => void | Promise<any>;
  operations?: Array<Operation<I, O, E>> | ((results: () => O) => Array<Operation<I, O, E>>);
}

export interface ScenarioAdapter<S, I, O, E = O> {
  run(input: I, state: () => S): O | Promise<O>;
  assert?(actual: O, expected: E, state: S): void;
  assertNotError(actual: O): void;
}

export interface ScenarioBuilder<S, I, O, E = O> {
  (scenario: Scenario<S, I, O, E> | (() => Scenario<S, I, O, E>)): void;
  only(scenario: Scenario<S, I, O, E> | (() => Scenario<S, I, O, E>)): void;
  skip(scenario: Scenario<S, I, O, E> | (() => Scenario<S, I, O, E>)): void;
}

export default function scenarioRunner<S, I, O, E = O>(
  adapter: ScenarioAdapter<S, I, O, E>,
): ScenarioBuilder<S, I, O, E> {
  const factory = run.bind(null, describe);
  factory.skip = run.bind(null, describe.skip);
  factory.only = run.bind(null, describe.only);
  return factory;

  function run(
    describe: jest.Describe,
    scenario: Scenario<S, I, O, E> | (() => Scenario<S, I, O, E>),
  ): void {
    const { description, before, after, init, operations } =
      typeof scenario === 'function' ? scenario() : scenario;

    describe(description, () => {
      let scenarioState: S;
      beforeEach(async () => {
        if (before) {
          await before();
        }
        if (init) {
          scenarioState = init();
        }
      });

      if (after) {
        afterEach(async () => {
          await after();
        });
      }
      const getState = () => scenarioState;

      (typeof operations === 'function' ? operations(getState) : operations).forEach((operation) =>
        processOperation(adapter, getState, operation),
      );
    });
  }
}

function processOperation<S, I, O, E = O>(
  adapter: ScenarioAdapter<S, I, O, E>,
  getState: () => S,
  operation: Operation<I, O, E>,
) {
  const { only, skip, description, expected, before, after, assert, input, operations } = operation;
  const hasInput = 'input' in operation;
  (skip ? describe.skip : only ? describe.only : describe)(description, () => {
    let results: O;
    beforeEach(async () => {
      if (before) {
        await before();
      }
      if (hasInput) {
        results = await adapter.run(input as I, getState);
      }
    });

    if (after) {
      afterEach(async () => {
        await after();
      });
    }

    if (hasInput && expected) {
      it('SHOULD return the correct values', async () => {
        adapter.assert
          ? await adapter.assert(results, expected, getState())
          : expect(results).toEqual(expected);
      });
    }

    if (assert) {
      it('SHOULD pass assertions', async () => {
        await assert(hasInput ? results : undefined);
      });
    }

    if (hasInput && !expected && !assert) {
      it('SHOULD not resolve to an error', async () => {
        await adapter.assertNotError(results);
      });
    }

    if (before && !hasInput && !expected && !assert) {
      it('SHOULD process operation', () => {});
    }

    (typeof operations === 'function' ? operations(() => results) : operations || []).forEach(
      (childOperation) => processOperation(adapter, getState, childOperation),
    );
  });
}
