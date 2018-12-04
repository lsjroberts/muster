import muster, {
  action,
  add,
  array,
  call,
  combineLatest,
  computed,
  dispatch,
  entries,
  error,
  first,
  fn,
  fromPromise,
  getInvalidTypeError,
  ifPending,
  isPending,
  key,
  last,
  match,
  nth,
  query,
  ref,
  resetVariablesInScope,
  root,
  scope,
  set,
  tree,
  types,
  update,
  value,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { variable } from './variable';

describe('variable', () => {
  runScenario({
    description: 'GIVEN a variable node with an initialValue of 123',
    graph: () => muster(variable(value(123))),
    operations: [
      operation({
        description: 'SHOULD resolve to the value node upon ‘get’',
        input: ref(),
        expected: value(123),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a top-level variable node, with an initial value',
    graph: () => muster(variable(value(123))),
    operations: [
      operation({
        description: 'AND the top-level value is set to a different value',
        input: set(ref(), value(456)),
        expected: value(456),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: root(),
            expected: value(456),
          }),
        ],
      }),
      {
        description: 'AND a subscription is created for the top-level value',
        input: ref(),
        expected: value(123),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            description: 'WHEN setting the top-level value to 123 again',
            before: () => {
              jest.clearAllMocks();
            },
            input: set(ref(), value(123)),
            expected: value(123),
            assert: () => {
              expect(topSub().next).not.toHaveBeenCalled();
            },
          }),
          operation({
            description: 'WHEN setting the top-level value to 456',
            before: () => {
              jest.clearAllMocks();
            },
            input: set(ref(), value(456)),
            expected: value(456),
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value(456));
            },
          }),
        ],
      },
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing two empty variables in the same branch',
    graph: () =>
      muster({
        first: variable(''),
        second: variable(''),
      }),
    operations: [
      operation({
        description: 'WHEN the first variable is set',
        input: set('first', 'updated first'),
        expected: value('updated first'),
        operations: [
          operation({
            description: 'AND the second variable is set',
            input: set('second', 'updated second'),
            expected: value('updated second'),
            operations: [
              operation({
                description: 'AND the first variable is requested',
                input: ref('first'),
                expected: value('updated first'),
                operations: [
                  operation({
                    description: 'AND the second variable is requested',
                    input: ref('second'),
                    expected: value('updated second'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing two variables in the same branch',
    graph: () =>
      muster({
        first: variable('initial first'),
        second: variable('initial second'),
      }),
    operations: [
      operation({
        description: 'WHEN the both variable are retrieved',
        input: combineLatest([ref('first'), ref('second')]),
        expected: array([value('initial first'), value('initial second')]),
        operations: (subscriber) => [
          operation({
            description: 'AND the first variable is set',
            before() {
              jest.clearAllMocks();
            },
            input: set('first', 'updated first'),
            expected: value('updated first'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                array([value('updated first'), value('initial second')]),
              );
            },
            operations: [
              operation({
                description: 'AND the second variable is set',
                before() {
                  jest.clearAllMocks();
                },
                input: set('second', 'updated second'),
                expected: value('updated second'),
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(
                    array([value('updated first'), value('updated second')]),
                  );
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing two variables in the same branch',
    graph: () =>
      muster({
        first: variable('initial first'),
        second: variable('initial second'),
      }),
    operations: [
      operation({
        description: 'WHEN the first variable is set',
        input: set('first', 'updated first'),
        expected: value('updated first'),
        operations: [
          operation({
            description: 'AND the second variable is set',
            input: set('second', 'updated second'),
            expected: value('updated second'),
            operations: [
              operation({
                description: 'AND the first variable is requested',
                input: ref('first'),
                expected: value('updated first'),
                operations: [
                  operation({
                    description: 'AND the second variable is requested',
                    input: ref('second'),
                    expected: value('updated second'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing two variables in the same branch',
    graph: () =>
      muster({
        first: variable('initial first'),
        second: variable('initial second'),
      }),
    operations: [
      operation({
        description: 'WHEN the first variable is set',
        input: set('first', 'updated first'),
        expected: value('updated first'),
        operations: (firstSetSubscriber) => [
          operation({
            description: 'AND the second variable is set',
            before() {
              firstSetSubscriber().subscription.unsubscribe();
            },
            input: set('second', 'updated second'),
            expected: value('updated second'),
            operations: (secondSetSubscriber) => [
              operation({
                description: 'AND the first variable is requested',
                before() {
                  secondSetSubscriber().subscription.unsubscribe();
                },
                input: ref('first'),
                expected: value('updated first'),
                operations: [
                  operation({
                    description: 'AND the second variable is requested',
                    input: ref('second'),
                    expected: value('updated second'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a top-level variable node, with an initial value',
    graph: () => muster(variable(value(123))),
    operations: [
      operation({
        description: 'AND the top-level value is set to a different value',
        input: set(ref(), value(456)),
        expected: value(456),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: root(),
            expected: value(456),
            operations: [
              operation({
                description: 'AND the variable is reset',
                input: dispatch(resetVariablesInScope()),
                operations: [
                  operation({
                    description: 'AND the variable is retrieved',
                    input: root(),
                    expected: value(123),
                  }),
                ],
              }),
            ],
          }),
          operation({
            description: 'AND the variable is reset',
            input: dispatch(resetVariablesInScope()),
            operations: [
              operation({
                description: 'AND the variable is retrieved',
                input: root(),
                expected: value(123),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested variable node, with an initial value',
    graph: () =>
      muster({
        foo: variable(value(123)),
        bar: ref('foo'),
      }),
    operations: [
      operation({
        description: 'AND the top-level value is set to a different value via a ref',
        input: set(ref('bar'), value(456)),
        expected: value(456),
        operations: [
          operation({
            description: 'AND the value is retrieved from the target variable',
            input: ref('foo'),
            expected: value(456),
          }),
          operation({
            description: 'AND the value is retrieved via the ref',
            input: ref('bar'),
            expected: value(456),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a set of variables within a collection',
    graph: () =>
      muster({
        items: [variable(undefined), variable(undefined), variable(undefined)],
        first: ref('items', first()),
        second: ref('items', nth(1)),
        third: ref('items', last()),
      }),
    operations: [
      operation({
        description: 'AND one of the variables is updated directly',
        input: set(ref('items', first()), value('updated')),
        expected: value('updated'),
        operations: [
          operation({
            description: 'AND the value is retrieved from the target variable',
            input: ref('items', first()),
            expected: value('updated'),
          }),
          operation({
            description: 'AND the value is retrieved via a different but equivalent transform',
            input: ref('items', nth(0)),
            expected: value('updated'),
          }),
          operation({
            description: 'AND the value is retrieved via a different but equivalent transform',
            input: ref('items', nth(0)),
            expected: value('updated'),
          }),
          operation({
            description: 'AND one of the other values is retrieved',
            input: ref('items', nth(1)),
            expected: value(undefined),
          }),
          operation({
            description: 'AND the value is retrieved via the ref',
            input: ref('first'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a query',
            input: query(ref('items'), entries()),
            expected: value(['updated', undefined, undefined]),
          }),
        ],
      }),
      operation({
        description: 'AND one of the variables is updated via the ref',
        input: set(ref('first'), value('updated')),
        expected: value('updated'),
        operations: [
          operation({
            description: 'AND the value is retrieved from the target variable',
            input: ref('items', first()),
            expected: value('updated'),
          }),
          operation({
            description: 'AND the value is retrieved via a different but equivalent transform',
            input: ref('items', nth(0)),
            expected: value('updated'),
          }),
          operation({
            description: 'AND one of the other values is retrieved',
            input: ref('items', nth(1)),
            expected: value(undefined),
          }),
          operation({
            description: 'AND the value is retrieved via the ref',
            input: ref('first'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a query',
            input: query(ref('items'), entries()),
            expected: value(['updated', undefined, undefined]),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a set of nested variables within a collection',
    graph: () =>
      muster({
        items: [
          { inner: variable(undefined), other: variable(undefined) },
          { inner: variable(undefined), other: variable(undefined) },
          { inner: variable(undefined), other: variable(undefined) },
        ],
        first: ref('items', first()),
        second: ref('items', nth(1)),
        third: ref('items', last()),
      }),
    operations: [
      operation({
        description: 'AND the first variable is updated',
        input: set(ref('items', first(), 'inner'), 'updated'),
        expected: value('updated'),
        operations: [
          operation({
            description: 'AND the value is retrieved from the target variable',
            input: ref('items', first(), 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND the value is retrieved via a different but equivalent transform',
            input: ref('items', nth(0), 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND one of the other values is retrieved',
            input: ref('items', nth(1), 'inner'),
            expected: value(undefined),
          }),
          operation({
            description: 'AND the value is retrieved via the ref',
            input: ref('first', 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a query',
            input: query(
              ref('items'),
              entries({
                innerResult: key('inner'),
              }),
            ),
            expected: value([
              { innerResult: 'updated' },
              { innerResult: undefined },
              { innerResult: undefined },
            ]),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a complex query',
            input: query(
              ref('items'),
              entries({
                innerRes: key('inner'),
                otherRes: key('other'),
              }),
            ),
            expected: value([
              { innerRes: 'updated', otherRes: undefined },
              { innerRes: undefined, otherRes: undefined },
              { innerRes: undefined, otherRes: undefined },
            ]),
          }),
        ],
      }),
      operation({
        description: 'AND the last variable is updated',
        input: set(ref('items', last(), 'inner'), 'updated'),
        expected: value('updated'),
        operations: [
          operation({
            description: 'AND the value is retrieved from the target variable',
            input: ref('items', last(), 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND the value is retrieved via a different but equivalent transform',
            input: ref('items', nth(2), 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND one of the other values is retrieved',
            input: ref('items', nth(1), 'inner'),
            expected: value(undefined),
          }),
          operation({
            description: 'AND the value is retrieved via the ref',
            input: ref('third', 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a query',
            input: query(
              ref('items'),
              entries({
                innerResult: key('inner'),
              }),
            ),
            expected: value([
              { innerResult: undefined },
              { innerResult: undefined },
              { innerResult: 'updated' },
            ]),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a complex query',
            input: query(
              ref('items'),
              entries({
                innerRes: key('inner'),
                otherRes: key('other'),
              }),
            ),
            expected: value([
              { innerRes: undefined, otherRes: undefined },
              { innerRes: undefined, otherRes: undefined },
              { innerRes: 'updated', otherRes: undefined },
            ]),
          }),
        ],
      }),
      operation({
        description: 'AND one of the variables is updated via the ref',
        input: set(ref('first', 'inner'), value('updated')),
        expected: value('updated'),
        operations: [
          operation({
            description: 'AND the value is retrieved from the target variable',
            input: ref('items', first(), 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND the value is retrieved via the ref',
            input: ref('first', 'inner'),
            expected: value('updated'),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a query',
            input: query(
              ref('items'),
              entries({
                innerResult: key('inner'),
              }),
            ),
            expected: value([
              { innerResult: 'updated' },
              { innerResult: undefined },
              { innerResult: undefined },
            ]),
          }),
          operation({
            description: 'AND all the collection values are retrieved via a complex query',
            input: query(
              ref('items'),
              entries({
                innerResult: key('inner'),
                otherResult: key('other'),
              }),
            ),
            expected: value([
              { innerResult: 'updated', otherResult: undefined },
              { innerResult: undefined, otherResult: undefined },
              { innerResult: undefined, otherResult: undefined },
            ]),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a variable node on a branch, with a value as its initialValue',
    graph: () =>
      muster({
        foo: variable(value('FOO')),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the variable node',
        input: ref('foo'),
        expected: value('FOO'),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            description: 'WHEN setting the variable to BAR',
            input: set(ref('foo'), value('BAR')),
            expected: value('BAR'),
            before() {
              jest.clearAllMocks();
            },
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value('BAR'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a variable node on a branch, with a branch as its initialValue',
    graph: () =>
      muster({
        foo: variable(
          tree({
            bar: value('FOO.BAR'),
          }),
        ),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the variable node',
        input: ref('foo', 'bar'),
        expected: value('FOO.BAR'),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            description: 'WHEN setting the variable to a branch with a different value',
            input: set(ref('foo'), tree({ bar: value('BAZ') })),
            before() {
              jest.clearAllMocks();
            },
            expected: tree({ bar: value('BAZ') }),
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value('BAZ'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a variable node, which we will increment',
    graph: () =>
      muster({
        foo: variable(value(123)),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the variable node',
        input: ref('foo'),
        expected: value(123),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            before() {
              jest.clearAllMocks();
            },
            description: 'WHEN incrementing the variable value',
            input: update('foo', fn((current) => add(value(1), current))),
            expected: value(124),
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value(124));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a scoped variable node, which we will increment',
    graph: () =>
      muster({
        nested: scope({
          foo: variable(value(123)),
        }),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the variable node',
        input: ref('nested', 'foo'),
        expected: value(123),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            before() {
              jest.clearAllMocks();
            },
            description: 'WHEN incrementing the variable value',
            input: update(ref('nested', 'foo'), fn((current) => add(value(1), current))),
            expected: value(124),
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value(124));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a scoped variable node within a computed node, which we will increment',
    graph: () =>
      muster({
        nested: computed([value(123)], (initialValue) =>
          scope({
            foo: variable(value(initialValue)),
          }),
        ),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the variable node',
        input: ref('nested', 'foo'),
        expected: value(123),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            before() {
              jest.clearAllMocks();
            },
            description: 'WHEN incrementing the variable value',
            input: update(ref('nested', 'foo'), fn((current) => add(value(1), current))),
            expected: value(124),
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value(124));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a variable node, which a computed node depends on',
    graph: () =>
      muster({
        foo: variable(value(123)),
        bar: ref('foo'),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the variable node',
        input: ref('bar'),
        expected: value(123),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            description: 'WHEN incrementing the variable value',
            before: () => jest.clearAllMocks(),
            input: set(ref('foo'), value(124)),
            expected: value(124),
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value(124));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a global variable node',
    graph: () =>
      muster({
        currentValue: variable('foo'),
      }),
    operations: [
      operation({
        description: 'AND a subscription is created to the variable',
        input: ref('currentValue'),
        expected: value('foo'),
        operations: (subscription1) => [
          operation({
            description: 'AND the variable is updated',
            input: set(ref('currentValue'), 'bar'),
            operations: [
              operation({
                description: 'AND the subscription is unsubscribed',
                before: () => {
                  subscription1().subscription.unsubscribe();
                },
                operations: [
                  operation({
                    description: 'AND a subscription is created to the variable',
                    input: ref('currentValue'),
                    expected: value('bar'),
                    operations: (subscription2) => [
                      operation({
                        description: 'AND the subscription is unsubscribed',
                        before: () => {
                          subscription2().subscription.unsubscribe();
                        },
                        operations: [
                          operation({
                            description: 'AND a subscription is created to the variable',
                            input: ref('currentValue'),
                            expected: value('bar'),
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

  runScenario({
    description: 'GIVEN a variable node',
    graph: () =>
      muster({
        myVariable: variable(value('test')),
      }),
    operations: [
      operation({
        description: 'WHEN myVariable gets requested',
        input: ref('myVariable'),
        expected: value('test'),
        operations: (subscription) => [
          operation({
            description: 'AND the myVariable gets set to the same value',
            before() {
              jest.clearAllMocks();
            },
            input: set(ref('myVariable'), value('test')),
            expected: value('test'),
            after() {
              expect(subscription().next).not.toHaveBeenCalled();
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a scoped node',
    graph: () =>
      muster({
        myVariable: variable(value('test')),
      }),
    operations: [
      operation({
        description: 'WHEN myVariable gets requested',
        input: ref('myVariable'),
        expected: value('test'),
        operations: (subscription) => [
          operation({
            description: 'AND the myVariable gets set to the same value',
            before() {
              jest.clearAllMocks();
            },
            input: set(ref('myVariable'), value('test')),
            expected: value('test'),
            after() {
              expect(subscription().next).not.toHaveBeenCalled();
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a variable and an action used for setting that variable',
    graph: () =>
      muster({
        greeting: variable('Hello'),
        appendGreeting: action(function*(val) {
          const greeting = yield ref('greeting');
          yield set('greeting', `${greeting}${val}`);
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the greeting gets requested',
        input: ref('greeting'),
        expected: value('Hello'),
        operations: (subscriber) => [
          operation({
            description: 'AND the appendGreeting gets called',
            before() {
              jest.clearAllMocks();
            },
            input: call('appendGreeting', [' world']),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('Hello world'));
            },
            operations: [
              operation({
                description: 'AND the greeting gets re-subscribed',
                before() {
                  subscriber().subscription.unsubscribe();
                },
                input: ref('greeting'),
                expected: value('Hello world'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  describe('Async behaviour', () => {
    let promisesToResolve: Array<() => void>;
    const resolvePromises = () => {
      promisesToResolve.forEach((resolve) => resolve());
    };
    runScenario({
      before() {
        promisesToResolve = [];
      },
      description:
        'GIVEN a muster graph containing a variable that causes other field to do async re-load',
      graph: () =>
        muster({
          name: variable('first'),
          combined: computed([ref('name')], (name) => ref(name)),
          [match(types.string, 'name')]: fromPromise(({ name }) =>
            new Promise((resolve) => {
              promisesToResolve.push(resolve);
            }).then(() => value(`computed ${name}`)),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the initial query is made',
          input: ifPending(
            value('PENDING'),
            query(root(), {
              name: key('name'),
              combined: key('combined'),
              isLoading: isPending(key('combined')),
            }),
          ),
          expected: value('PENDING'),
          operations: (querySubscriber) => [
            operation({
              description: 'AND then the promise is resolved',
              before() {
                jest.clearAllMocks();
                resolvePromises();
              },
              assert() {
                expect(querySubscriber().next).toHaveBeenCalledTimes(1);
                expect(querySubscriber().next).toHaveBeenCalledWith(
                  value({
                    name: 'first',
                    combined: 'computed first',
                    isLoading: false,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND then the variable gets changed',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'second'),
                  assert() {
                    expect(querySubscriber().next).toHaveBeenCalledTimes(1);
                    expect(querySubscriber().next).toHaveBeenCalledWith(value('PENDING'));
                  },
                  operations: [
                    operation({
                      description: 'AND then the promise gets resolved',
                      before() {
                        jest.clearAllMocks();
                        resolvePromises();
                      },
                      assert() {
                        expect(querySubscriber().next).toHaveBeenCalledTimes(1);
                        expect(querySubscriber().next).toHaveBeenCalledWith(
                          value({
                            name: 'second',
                            combined: 'computed second',
                            isLoading: false,
                          }),
                        );
                      },
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
    description: 'GIVEN a variable with a string validator',
    graph: () =>
      muster({
        name: variable('initial', types.string),
      }),
    operations: [
      operation({
        description: 'WHEN the variable is set to a string',
        input: set('name', 'updated'),
        expected: value('updated'),
      }),
      operation({
        description: 'WHEN the variable is set to a number',
        input: set('name', 1),
        expected: withErrorPath(
          error(
            getInvalidTypeError(
              'Could not set value of the variable node: value has an incorrect type.',
              {
                expected: 'Value matched by matcher::string',
                received: value(1),
              },
            ),
          ),
          { path: ['name'] },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a variable with a shape validator',
    graph: () =>
      muster({
        user: variable(
          { name: 'Bob' },
          types.shape({
            name: types.string,
          }),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the variable is set to a correct object',
        input: set('user', value({ name: 'Kate' })),
        expected: value({ name: 'Kate' }),
      }),
      operation({
        description: 'WHEN the variable is set to an incorrect value',
        input: set('user', value({ firstName: 'Jane' })),
        expected: withErrorPath(
          error(
            getInvalidTypeError(
              'Could not set value of the variable node: value has an incorrect type.',
              {
                expected: 'Value matched by matcher::shape',
                received: value({ firstName: 'Jane' }),
              },
            ),
          ),
          { path: ['user'] },
        ),
      }),
    ],
  });
});
