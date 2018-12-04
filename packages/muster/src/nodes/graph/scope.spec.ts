import muster, {
  action,
  call,
  computed,
  context,
  createCaller,
  dispatch,
  entries,
  error,
  fromPromise,
  MusterEvent,
  on,
  query,
  ref,
  relative,
  root,
  set,
  value,
  variable,
  withContext,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { scope, ScopeNodeDefinition } from './scope';

describe('scope', () => {
  runScenario({
    description: 'GIVEN a scope node with no context variables',
    graph: () => muster(scope(value('foo'))),
    operations: [
      operation({
        description: 'SHOULD resolve to the scope root',
        input: root(),
        expected: value('foo'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a scope node with context variables',
    graph: () =>
      muster(
        scope(context('foo'), {
          foo: value('bar'),
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD pass the context to the scope root',
        input: root(),
        expected: value('bar'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested scope node with injected context references',
    graph: () =>
      muster({
        foo: value('yay'),
        deeply: {
          nested: scope(
            {
              foo: value('uh-oh'),
              item: context('bar'),
              invalid: context('baz'),
            },
            {
              bar: ref('foo'),
            },
          ),
        },
      }),
    operations: [
      operation({
        description: 'SHOULD resolve injected context variables correctly',
        input: ref('deeply', 'nested', 'item'),
        expected: value('yay'),
      }),
      operation({
        description: 'SHOULD NOT resolve undeclared context variables',
        input: ref('deeply', 'nested', 'invalid'),
        expected: withErrorPath(error('Missing context dependency: "baz"'), {
          path: ['deeply', 'nested', 'invalid'],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested scope node with injected context params',
    graph: () =>
      muster({
        deeply: {
          nested: withContext(
            {
              one: value('yay'),
              two: value('uh-oh'),
            },
            scope(
              {
                foo: value('uh-oh'),
                item: context('foo'),
                invalid: context('one'),
              },
              {
                foo: context('one'),
              },
            ),
          ),
        },
      }),
    operations: [
      operation({
        description: 'SHOULD resolve context variables passed into the scope',
        input: ref('deeply', 'nested', 'item'),
        expected: value('yay'),
      }),
      operation({
        description: 'SHOULD NOT have access to context variables declared outside the scope',
        input: ref('deeply', 'nested', 'invalid'),
        expected: withErrorPath(error('Missing context dependency: "one"'), {
          path: ['deeply', 'nested', 'invalid'],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested scope node that contains root references',
    graph: () =>
      muster({
        deeply: {
          foo: value('uh-oh'),
          nested: scope({
            foo: value('yay'),
            item: ref('foo'),
          }),
        },
      }),
    operations: [
      operation({
        description: 'SHOULD resolve internal references against the scope root',
        input: ref('deeply', 'nested', 'item'),
        expected: value('yay'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested scope node that relays external events',
    graph: () =>
      muster(
        scope(on((event: MusterEvent) => value({ lastEvent: event }), value(undefined)), {}, true),
      ),
    operations: [
      operation({
        description: 'GIVEN a subscription to the root node',
        input: root(),
        expected: value(undefined),
        operations: (subscriber: () => MockSubscriber) => [
          {
            description: 'AND an event is dispatched',
            before: () => jest.clearAllMocks(),
            input: dispatch({ type: 'event:foo', payload: 'foo' }),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({ lastEvent: { type: 'event:foo', payload: 'foo' } }),
              );
            },
          },
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested scope node that remaps external events',
    graph: () =>
      muster(
        scope(
          on((event: MusterEvent) => value({ lastEvent: event }), value(undefined)),
          {},
          (event: MusterEvent): MusterEvent | undefined => {
            switch (event.type) {
              case 'event:passthrough':
                return event;
              case 'event:remap':
                return { type: 'event:inner', payload: event.payload.toUpperCase() };
              default:
                return undefined;
            }
          },
        ),
      ),
    operations: [
      operation({
        description: 'GIVEN a subscription to the root node',
        input: root(),
        expected: value(undefined),
        operations: (subscriber: () => MockSubscriber) => [
          {
            description: 'AND a passthrough event is dispatched',
            before: () => jest.clearAllMocks(),
            input: dispatch({ type: 'event:passthrough', payload: 'foo' }),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({ lastEvent: { type: 'event:passthrough', payload: 'foo' } }),
              );
            },
          },
          {
            description: 'AND a remapped event is dispatched',
            before: () => jest.clearAllMocks(),
            input: dispatch({ type: 'event:remap', payload: 'bar' }),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({ lastEvent: { type: 'event:inner', payload: 'BAR' } }),
              );
            },
          },
          {
            description: 'AND an unrelated event is dispatched',
            before: () => jest.clearAllMocks(),
            input: dispatch({ type: 'event:unrelated', payload: 'baz' }),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(0);
            },
          },
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a scope which links to the graph',
    graph: () =>
      muster({
        items: [1, 2, 3],
        scoped: scope(
          {
            linkedItems: context('items'),
          },
          {
            items: ref('items'),
          },
        ),
      }),
    operations: [
      operation({
        description: 'WHEN requesting linkedItems from scope',
        input: query(ref('scoped', 'linkedItems'), entries()),
        expected: value([1, 2, 3]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a scope',
    graph: () =>
      muster({
        scoped: scope({
          firstName: 'Bob',
          lastName: 'Smith',
          fullName: computed(
            [ref(relative('firstName')), ref(relative('lastName'))],
            (firstName: string, lastName: string) => `${firstName} ${lastName}`,
          ),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN requesting a scoped fullName',
        input: ref('scoped', 'fullName'),
        expected: value('Bob Smith'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a nested scope',
    graph: () =>
      muster({
        nested: {
          scoped: scope({
            firstName: 'Bob',
            lastName: 'Smith',
            fullName: computed(
              [ref(relative('firstName')), ref(relative('lastName'))],
              (firstName: string, lastName: string) => `${firstName} ${lastName}`,
            ),
          }),
        },
      }),
    operations: [
      operation({
        description: 'WHEN requesting a scoped fullName',
        input: ref('nested', 'scoped', 'fullName'),
        expected: value('Bob Smith'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a nested scope with nested leaves',
    graph: () =>
      muster({
        nested: {
          scoped: scope({
            nested: {
              firstName: 'Bob',
              lastName: 'Smith',
              fullName: computed(
                [ref(relative('firstName')), ref(relative('lastName'))],
                (firstName: string, lastName: string) => `${firstName} ${lastName}`,
              ),
            },
          }),
        },
      }),
    operations: [
      operation({
        description: 'WHEN requesting a scoped fullName',
        input: ref('nested', 'scoped', 'nested', 'fullName'),
        expected: value('Bob Smith'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a scope with an action',
    graph: () =>
      muster({
        navigation: scope({
          state: variable('initial'),
          updateState: action(function*(val) {
            yield set('state', val);
            return val;
          }),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the state is requested',
        input: ref('navigation', 'state'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the state gets updated',
            before() {
              jest.clearAllMocks();
            },
            input: call(ref('navigation', 'updateState'), ['updated']),
            expected: value('updated'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a scope node containing stateful nodes',
    graph: () => muster(scope(variable('initial'))),
    operations: [
      operation({
        description: 'AND a subscription is created to the stateful node',
        input: root(),
        expected: value('initial'),
        operations: (rootSubscriber) => [
          operation({
            description: 'AND the stateful node is updated',
            input: set(root(), value('updated')),
            expected: value('updated'),
            operations: (updateSubscriber) => [
              operation({
                description: 'AND the stateful node is retrieved after closing the subscriptions',
                before() {
                  rootSubscriber().subscription.unsubscribe();
                  updateSubscriber().subscription.unsubscribe();
                },
                input: root(),
                expected: value('updated'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  describe('Test disposing a scope', () => {
    let testScope: ScopeNodeDefinition;
    runScenario({
      description: 'GIVEN a muster graph containing a scope',
      before() {
        testScope = scope({
          name: variable('initial'),
        });
      },
      graph: () =>
        muster({
          testScope,
        }),
      operations: [
        operation({
          description: 'WHEN the name is requested',
          input: ref('testScope', 'name'),
          expected: value('initial'),
        }),
        operation({
          description: 'WHEN the name is set',
          input: set(ref('testScope', 'name'), 'updated'),
          expected: value('updated'),
          operations: (subscriber1) => [
            operation({
              description: 'AND the name is re-requested',
              before() {
                subscriber1().subscription.unsubscribe();
              },
              input: ref('testScope', 'name'),
              expected: value('updated'),
              operations: (subscriber2) => [
                operation({
                  description: 'AND the name is re-requested after disposing scope',
                  before() {
                    subscriber2().subscription.unsubscribe();
                    testScope.dispose();
                  },
                  input: ref('testScope', 'name'),
                  expected: value('initial'),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('Test disposing a nested scope', () => {
    let testScope: ScopeNodeDefinition;
    runScenario({
      description: 'GIVEN a muster graph containing a scope',
      before() {
        testScope = scope({
          nested: scope({
            name: variable('initial'),
          }),
        });
      },
      graph: () =>
        muster({
          testScope,
        }),
      operations: [
        operation({
          description: 'WHEN the name is requested',
          input: ref('testScope', 'nested', 'name'),
          expected: value('initial'),
        }),
        operation({
          description: 'WHEN the name is set',
          input: set(ref('testScope', 'nested', 'name'), 'updated'),
          expected: value('updated'),
          operations: (subscriber1) => [
            operation({
              description: 'AND the name is re-requested',
              before() {
                subscriber1().subscription.unsubscribe();
              },
              input: ref('testScope', 'nested', 'name'),
              expected: value('updated'),
              operations: (subscriber2) => [
                operation({
                  description: 'AND the name is re-requested after disposing scope',
                  before() {
                    subscriber2().subscription.unsubscribe();
                    testScope.dispose();
                  },
                  input: ref('testScope', 'nested', 'name'),
                  expected: value('initial'),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a scope with an action that yields a fromPromise', () => {
    describe('WHEN the scope is disposed before promise resolves', () => {
      let pendingPromises: Array<() => void>;
      let disposeListeners: Array<() => void>;
      let scopeWithAction: ScopeNodeDefinition;

      function resolvePendingPromises() {
        pendingPromises.forEach((resolve) => resolve());
      }

      function disposeEmitter(listener: () => void) {
        disposeListeners.push(listener);
        return () => {
          const index = disposeListeners.indexOf(listener);
          if (index === -1) return;
          disposeListeners.splice(index, 1);
        };
      }

      function notifyDisposeListeners() {
        disposeListeners.forEach((listener) => listener());
      }

      beforeEach(() => {
        pendingPromises = [];
        disposeListeners = [];
        scopeWithAction = scope({
          getValue: action(function*() {
            const value = yield fromPromise(() => {
              return new Promise((resolve) => pendingPromises.push(resolve)).then(
                () => 'Some value',
              );
            });
            yield set('message', value);
          }),
          message: variable('initial'),
        });
      });

      it('SHOULD not throw any errors', (done) => {
        const app = muster(scopeWithAction);
        const subscription = app
          .resolve(
            query(root(), {
              getValue: createCaller('getValue', { disposeEmitter }),
              message: true,
            }),
          )
          .subscribe(async (queryResult) => {
            // Wait for the `subscription` to be set
            await Promise.resolve();
            // Call the `getValue`
            queryResult.getValue();

            // Begin the disposal phase
            notifyDisposeListeners();
            subscription.unsubscribe();
            scopeWithAction.dispose();

            // Simulate `fetch` completion
            resolvePendingPromises();
            done();
          });
      });
    });
  });
});
