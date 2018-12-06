import { ObservableLike, Observer } from '@dws/muster-observable';
import muster, {
  action,
  add,
  call,
  computed,
  dispatch,
  eq,
  error,
  fn,
  fromPromise,
  fromStream,
  ifElse,
  nil,
  NodeDefinition,
  ref,
  reset,
  resetVariablesInScope,
  scope,
  series,
  set,
  update,
  value,
  variable,
  withErrorPath,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';

describe('series', () => {
  runScenario({
    description: 'GIVEN a graph with some values on branches',
    graph: () =>
      muster({
        foo: 'FOO',
        bar: 'BAR',
        baz: 'BAZ',
      }),
    operations: [
      operation({
        description: 'SHOULD resolve to the last in the series',
        input: series([ref('foo'), ref('bar'), ref('baz')]),
        expected: value('BAZ'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a variable node',
    graph: () =>
      muster({
        foo: variable(100),
        plusTen: fn((n) => add(10, n)),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the variable',
        input: ref('foo'),
        operations: (subscriber: () => MockSubscriber) => [
          {
            description: 'AND a series of updates to the variable',
            before() {
              jest.clearAllMocks();
            },
            input: series([
              update('foo', ref('plusTen')),
              update('foo', ref('plusTen')),
              update('foo', ref('plusTen')),
              update('foo', ref('plusTen')),
            ]),
            expected: value(140),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
            },
          },
        ],
      }),
    ],
  });

  describe('Error short-circuiting', () => {
    runScenario({
      description: 'GIVEN a graph with a variable node',
      graph: () =>
        muster({
          foo: variable(123),
        }),
      operations: [
        operation({
          description: 'AND a subscription to foo',
          input: ref('foo'),
          operations: (subscriber: () => MockSubscriber) => [
            {
              description: 'WHEN a series with an error is resolved',
              before() {
                jest.clearAllMocks();
              },
              input: series([
                set(ref('foo'), value('ABC')),
                error('Invalid'),
                set(ref('foo'), value('456')),
              ]),
              expected: withErrorPath(error('Invalid'), { path: [] }),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenLastCalledWith(value('ABC'));
              },
            },
          ],
        }),
      ],
    });
  });

  describe('Async updates', () => {
    let fooResolvers: Array<(result: any) => void>;
    let fooStream: ObservableLike<NodeDefinition>;
    let fooNext: Observer<NodeDefinition>['next'];

    runScenario({
      description: 'GIVEN an empty graph',
      graph: () => muster(nil()),
      operations: [
        operation({
          description: 'AND a series of async operations is evaluated',
          input: series([
            fromPromise(() => Promise.resolve().then(() => value('foo'))),
            fromPromise(() => Promise.resolve().then(() => value('bar'))),
            fromPromise(() => Promise.resolve().then(() => value('baz'))),
          ]),
          expected: value('baz'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph with a variable node',
      before() {
        fooResolvers = [];
        fooStream = {
          subscribe(next: Observer<NodeDefinition>['next']) {
            fooNext = next;
            return { unsubscribe() {} };
          },
        };
      },
      graph: () =>
        muster({
          foo: variable(100),
          bar: variable(100),
        }),
      operations: [
        operation({
          description: 'AND a subscription to foo+bar',
          input: computed(
            [ref('foo'), ref('bar')],
            (foo: any, bar: any) => `FOO=${foo};BAR=${bar}`,
          ),
          expected: value('FOO=100;BAR=100'),
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'AND a series of updates to the variable',
              before() {
                jest.clearAllMocks();
              },
              input: series([
                update(
                  'foo',
                  fromPromise(
                    () =>
                      new Promise((resolve) => {
                        fooResolvers.push(resolve);
                      }),
                  ),
                ),
                update(
                  'foo',
                  fromPromise(
                    () =>
                      new Promise((resolve) => {
                        fooResolvers.push(resolve);
                      }),
                  ),
                ),
                set(ref('bar'), value(500)),
                update('bar', fn((n) => add(1000, n))),
                update('foo', fromStream(() => fooStream)),
              ]),
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
              operations: (seriesSubscriber: () => MockSubscriber) => [
                operation({
                  description: 'AND the first promise resolves',
                  before() {
                    jest.clearAllMocks();
                    fooResolvers[0](fn((n) => add(n, 10)));
                  },
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenLastCalledWith(value('FOO=110;BAR=100'));
                  },
                  operations: [
                    operation({
                      description: 'AND the second promise resolves',
                      before() {
                        jest.clearAllMocks();
                        fooResolvers[1](fn((n) => add(n, 20)));
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenLastCalledWith(
                          value('FOO=130;BAR=1500'),
                        );
                      },
                      operations: [
                        operation({
                          description: 'AND the stream emits',
                          before() {
                            jest.clearAllMocks();
                            fooNext(fn((n) => add(n, 10000)));
                          },
                          assert() {
                            expect(subscriber().next).toHaveBeenCalledTimes(1);
                            expect(subscriber().next).toHaveBeenLastCalledWith(
                              value('FOO=10130;BAR=1500'),
                            );
                          },
                          operations: [
                            operation({
                              description: 'AND the stream emits a second time',
                              before() {
                                jest.clearAllMocks();
                                fooNext(fn((n) => add(n, 1)));
                              },
                              assert() {
                                expect(subscriber().next).not.toHaveBeenCalled();
                              },
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        default: variable('foo'),
        derived: ifElse({
          if: eq(ref('default'), 'foo'),
          then: variable(undefined),
          else: variable('not foo'),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the series modifies the variable used in the output',
        input: series([set('default', 'bar'), set('derived', 'baz'), ref('derived')]),
        expected: value('baz'),
      }),
      operation({
        description: 'WHEN the series resets the output before doing sets',
        input: series([
          reset('derived'),
          set('default', 'bar'),
          set('derived', 'baz'),
          ref('derived'),
        ]),
        expected: value('baz'),
      }),
    ],
  });

  let callback: jest.Mock<void>;
  runScenario({
    description: 'GIVEN a muster graph containing a variable and an action in a scope',
    before() {
      callback = jest.fn();
    },
    graph: () =>
      muster(
        scope({
          amount: computed([ref('selectedOrder', 'amount')], (amount) => variable(amount)),
          selectedOrder: {
            amount: 1,
          },
          action: action(function*() {
            const [amount, previousAmount] = yield [ref('amount'), ref('selectedOrder', 'amount')];
            if (amount !== previousAmount) {
              callback();
            }
          }),
        }),
      ),
    operations: [
      operation({
        description: 'WHEN the action is called without changing the amount',
        input: call('action'),
        assert() {
          expect(callback).not.toHaveBeenCalled();
        },
      }),
      operation({
        description: 'WHEN the amount is set',
        input: set('amount', 2),
        operations: [
          operation({
            description: 'AND then the action is called',
            input: call('action'),
            assert() {
              expect(callback).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN the amount is set and then the action is called (in a series)',
        input: series([set('amount', 2), call('action')]),
        assert() {
          expect(callback).toHaveBeenCalledTimes(1);
        },
      }),
      operation({
        description: 'WHEN the amount is requested',
        input: ref('amount'),
        expected: value(1),
        operations: [
          operation({
            description: 'WHEN the amount is set and then the action is called (in a series)',
            input: series([set('amount', 2), call('action')]),
            assert() {
              expect(callback).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      }),
      operation({
        description:
          'WHEN the amount is set to the same value and then the action is called (in a series)',
        input: series([set('amount', 1), call('action')]),
        assert() {
          expect(callback).not.toHaveBeenCalled();
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing scoped variables',
    graph: () =>
      muster({
        users: scope({
          reset: fn(() => dispatch(resetVariablesInScope())),
          name: variable('initial'),
          getName: action(() => ref('name')),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the name is set and then the action called',
        input: series([set(ref('users', 'name'), 'updated'), call(ref('users', 'getName'))]),
        expected: value('updated'),
        operations: (subscriber1) => [
          operation({
            description: 'AND the name gets retrieved after closing the first subscription',
            before() {
              subscriber1().subscription.unsubscribe();
            },
            input: ref('users', 'name'),
            expected: value('updated'),
            operations: (subscriber2) => [
              operation({
                description: 'AND the name scope gets reset',
                before() {
                  subscriber2().subscription.unsubscribe();
                },
                input: call(ref('users', 'reset')),
                operations: (subscriber3) => [
                  operation({
                    description: 'AND the name gets requested',
                    before() {
                      subscriber3().subscription.unsubscribe();
                    },
                    input: ref('users', 'name'),
                    expected: value('initial'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // TODO: Investigate returning a non-identical scope from a computed node
  runScenario.skip(() => {
    return {
      description: 'GIVEN a muster graph containing a scope created by a computed node',
      graph: () =>
        muster({
          users: computed([value('foo')], () =>
            scope({
              reset: fn(() => dispatch(resetVariablesInScope())),
              name: variable('initial'),
              getName: action(() => ref('name')),
            }),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the name is set and then the action called',
          input: series([set(ref('users', 'name'), 'updated'), call(ref('users', 'getName'))]),
          expected: value('updated'),
          operations: (subscriber1) => [
            operation({
              description: 'AND the name gets retrieved after closing the first subscription',
              before() {
                subscriber1().subscription.unsubscribe();
              },
              input: ref('users', 'name'),
              expected: value('updated'),
              operations: (subscriber2) => [
                operation({
                  description: 'AND the name scope gets reset',
                  before() {
                    subscriber2().subscription.unsubscribe();
                  },
                  input: call(ref('users', 'reset')),
                  operations: (subscriber3) => [
                    operation({
                      description: 'AND the name gets requested',
                      before() {
                        subscriber3().subscription.unsubscribe();
                      },
                      input: ref('users', 'name'),
                      expected: value('initial'),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    };
  });

  // TODO: Investigate returning a non-identical scope from a computed node
  runScenario.skip({
    description: 'GIVEN a muster graph containing scoped variables within by a computed node',
    graph: () =>
      muster({
        users: computed([value('foo')], () =>
          scope({
            reset: fn(() => dispatch(resetVariablesInScope())),
            name: variable('initial'),
            getName: action(() => ref('name')),
          }),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the name is set and then the action called',
        input: series([set(ref('users', 'name'), 'updated'), call(ref('users', 'getName'))]),
        expected: value('updated'),
        operations: (subscriber1) => [
          operation({
            description: 'AND the name gets retrieved after closing the first subscription',
            before() {
              subscriber1().subscription.unsubscribe();
            },
            input: ref('users', 'name'),
            expected: value('updated'),
            operations: (subscriber2) => [
              operation({
                description: 'AND the name scope gets reset',
                before() {
                  subscriber2().subscription.unsubscribe();
                },
                input: call(ref('users', 'reset')),
                operations: (subscriber3) => [
                  operation({
                    description: 'AND the name gets requested',
                    before() {
                      subscriber3().subscription.unsubscribe();
                    },
                    input: ref('users', 'name'),
                    expected: value('initial'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
