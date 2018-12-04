import sum from 'lodash/sum';
import muster, {
  apply,
  call,
  error,
  format,
  fromPromise,
  getProxiedNodeValue,
  GraphNode,
  isGraphNode,
  isProxiedNode,
  match,
  nil,
  param,
  query,
  ref,
  root,
  set,
  toNode,
  types,
  value,
  variable,
  withErrorPath,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { action } from './action';

describe('action', () => {
  runScenario({
    description: 'Basic usage',
    operations: [
      operation({
        description: 'WHEN an action node is called with no arguments',
        input: call(action(() => value('foo')), []),
        expected: value('foo'),
      }),
      operation({
        description: 'WHEN an action node is called with arguments',
        input: call(action((...args) => sum(args)), [value(1), value(2), value(3)]),
        expected: value(1 + 2 + 3),
      }),
    ],
  });

  runScenario(() => {
    // tslint:disable-next-line:no-increment-decrement
    const query = action(() => value(++counter));
    let counter: number;
    return {
      description: 'GIVEN an action with side-effects',
      operations: [
        operation({
          description: 'WHEN the action is called once',
          before() {
            counter = 0;
          },
          input: call(query, []),
          expected: value(1),
          operations: [
            operation({
              description: 'AND the action is called again',
              input: call(query, []),
              expected: value(2),
            }),
          ],
        }),
      ],
    };
  });

  describe('Action dependencies should only resolve once', () => {
    let myAction: (username: string) => string;

    runScenario({
      description: 'GIVEN an action node and a variable dependency',
      before() {
        myAction = (username: string) => username.toUpperCase();
      },
      graph: () =>
        muster({
          username: variable('Rosalind'),
          loginUser: action(myAction),
        }),
      operations: [
        operation({
          description: 'AND the arguments are applied to the action',
          input: apply([ref('username')], ref('loginUser')),
          expected: value('ROSALIND'),
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'WHEN changing the username, the action should not be re-run',
              before() {
                jest.clearAllMocks();
              },
              input: set(ref('username'), value('Brian')),
              expected: value('Brian'),
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('Generators', () => {
    runScenario({
      description: 'GIVEN an action that returns a value',
      graph: () =>
        muster(
          action(function*() {
            return 'ABC';
          }),
        ),
      operations: [
        operation({
          description: 'WHEN calling the action',
          input: call(root()),
          expected: value('ABC'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an action that returns a ref',
      graph: () =>
        muster({
          foo: action(function*() {
            return ref('bar');
          }),
          bar: 'BAR',
        }),
      operations: [
        operation({
          description: 'WHEN calling the action',
          input: call(ref('foo')),
          expected: value('BAR'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an action that yields a ref',
      graph: () =>
        muster({
          foo: action(function*() {
            return yield ref('bar');
          }),
          bar: 'BAR',
        }),
      operations: [
        operation({
          description: 'WHEN calling the action',
          input: call(ref('foo')),
          expected: value('BAR'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an action that yields two refs',
      graph: () =>
        muster({
          foo: action(function*() {
            const a = yield ref('a');
            const b = yield ref('b');
            return [a, b];
          }),
          a: 'AAA',
          b: 'BBB',
        }),
      operations: [
        operation({
          description: 'WHEN calling the action',
          input: call(ref('foo')),
          expected: value(['AAA', 'BBB']),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an action that takes two arguments and yields two refs',
      graph: () =>
        muster({
          foo: action(function*(a, b) {
            const [c, d] = yield [ref('c'), value('DDD')];
            return `${a}-${b}-${c}-${d}`;
          }),
          a: 'AAA',
          c: 'CCC',
        }),
      operations: [
        operation({
          description: 'WHEN calling the action',
          input: call(ref('foo'), [ref('a'), value('BBB')]),
          expected: value('AAA-BBB-CCC-DDD'),
        }),
      ],
    });

    describe('Parellel array yielding', () => {
      let aFactory: () => Promise<any>;
      let bFactory: () => Promise<any>;
      let aResolver: (arg: any) => void;
      let bResolver: (arg: any) => void;

      runScenario({
        description: 'GIVEN an action that yields an array of nodes',
        before() {
          aFactory = jest.fn(
            () =>
              new Promise((resolve) => {
                aResolver = resolve;
              }),
          );
          bFactory = jest.fn(
            () =>
              new Promise((resolve) => {
                bResolver = resolve;
              }),
          );
        },
        graph: () =>
          muster({
            foo: action(function*() {
              const [a, b] = yield [ref('a'), ref('b')];
              return `${a}-${b}`;
            }),
            a: fromPromise(aFactory),
            b: fromPromise(bFactory),
          }),
        operations: [
          operation({
            description: 'WHEN calling the action',
            input: call(ref('foo')),
            assert() {
              expect(aFactory).toHaveBeenCalledTimes(1);
              expect(bFactory).toHaveBeenCalledTimes(1);
            },
            operations: (subscriber: () => MockSubscriber) => [
              operation({
                description: 'AND a resolves',
                before() {
                  jest.clearAllMocks();
                  aResolver('AAA');
                },
                assert() {
                  expect(subscriber().next).not.toHaveBeenCalled();
                },
                operations: [
                  operation({
                    description: 'AND b resolves',
                    before() {
                      jest.clearAllMocks();
                      bResolver('BBB');
                    },
                    assert() {
                      expect(subscriber().next).toHaveBeenCalledTimes(1);
                      expect(subscriber().next).toHaveBeenLastCalledWith(value('AAA-BBB'));
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });

    describe('Generator body must not be re-executed', () => {
      let bodyCount: jest.Mock<any>;

      runScenario({
        description: 'GIVEN an action that yields two refs',
        before() {
          bodyCount = jest.fn();
        },
        graph: () =>
          muster({
            foo: action(function*() {
              const bar = yield ref('bar');
              bodyCount();
              return `ABC ${bar}`;
            }),
            bar: variable('BAR'),
          }),
        operations: [
          operation({
            description: 'WHEN calling the action',
            before() {
              jest.clearAllMocks();
            },
            input: call(ref('foo')),
            expected: value('ABC BAR'),
            assert() {
              expect(bodyCount).toHaveBeenCalledTimes(1);
            },
            operations: [
              operation({
                description: 'AND bar is changed',
                before() {
                  jest.clearAllMocks();
                },
                input: set(ref('bar'), 'BAZ'),
                assert() {
                  expect(bodyCount).not.toHaveBeenCalled();
                },
              }),
            ],
          }),
        ],
      });
    });

    describe('Error handling', () => {
      describe('Without try/catch', () => {
        let aFactory: () => Promise<any>;
        let bFactory: () => Promise<any>;
        let aRejecter: (arg: any) => void;

        runScenario({
          description: 'GIVEN an action that yields twice, but the first receives an error',
          before() {
            aFactory = jest.fn(
              () =>
                new Promise((resolve, reject) => {
                  aRejecter = reject;
                }),
            );
            bFactory = jest.fn();
          },
          graph: () =>
            muster({
              foo: action(function*() {
                const a = yield ref('a');
                const b = yield ref('b');
                return [a, b];
              }),
              a: fromPromise(aFactory),
              b: fromPromise(bFactory),
            }),
          operations: [
            operation({
              description: 'WHEN calling the action',
              input: call(ref('foo')),
              assert() {
                expect(aFactory).toHaveBeenCalledTimes(1);
                expect(bFactory).not.toHaveBeenCalled();
              },
              operations: (subscriber: () => MockSubscriber) => [
                operation({
                  description: 'AND the promise rejects',
                  before() {
                    aRejecter(new Error('Test failure'));
                  },
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      withErrorPath(error('Test failure'), { path: ['foo'] }),
                    );
                    expect(bFactory).not.toHaveBeenCalled();
                  },
                }),
              ],
            }),
          ],
        });

        runScenario({
          description: 'GIVEN an action that yields an error node',
          graph: () =>
            muster({
              foo: action(function*() {
                yield error('Test error');
                return 'Never';
              }),
            }),
          operations: [
            operation({
              description: 'WHEN calling the action',
              input: call(ref('foo')),
              expected: withErrorPath(error('Test error'), { path: ['foo'] }),
            }),
          ],
        });
      });

      describe('With try/catch', () => {
        let aFactory: () => Promise<any>;
        let bFactory: () => Promise<any>;
        let aRejecter: (arg: any) => void;
        let bResolver: (arg: any) => void;

        runScenario({
          description: 'GIVEN an action that yields twice, but the first receives an error',
          before() {
            aFactory = jest.fn(
              () =>
                new Promise((resolve, reject) => {
                  aRejecter = reject;
                }),
            );
            bFactory = jest.fn(
              () =>
                new Promise((resolve) => {
                  bResolver = resolve;
                }),
            );
          },
          graph: () =>
            muster({
              foo: action(function*() {
                let a: any;
                try {
                  a = yield ref('a');
                } catch (e) {
                  a = `Caught: ${e.message}`;
                }
                const b = yield ref('b');
                return [a, b];
              }),
              a: fromPromise(aFactory),
              b: fromPromise(bFactory),
            }),
          operations: [
            operation({
              description: 'WHEN calling the action',
              input: call(ref('foo')),
              assert() {
                expect(aFactory).toHaveBeenCalledTimes(1);
                expect(bFactory).not.toHaveBeenCalled();
              },
              operations: (subscriber: () => MockSubscriber) => [
                operation({
                  description: 'AND the promise rejects',
                  before() {
                    aRejecter(new Error('Test failure'));
                  },
                  assert() {
                    expect(subscriber().next).not.toHaveBeenCalled();
                    expect(bFactory).toHaveBeenCalledTimes(1);
                  },
                  operations: [
                    operation({
                      description: 'AND the second promise resolves',
                      before() {
                        bResolver('Success');
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenLastCalledWith(
                          value(['Caught: Test failure', 'Success']),
                        );
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        runScenario(() => {
          class CustomError extends Error {
            public code: string;
            constructor(message: string, options: { code: string }) {
              super(message);
              this.name = this.constructor.name;
              this.code = options.code;
            }
          }
          return {
            description: 'GIVEN an action that yields twice, but the first receives a custom error',
            before() {
              aFactory = jest.fn(
                () =>
                  new Promise((resolve, reject) => {
                    aRejecter = reject;
                  }),
              );
              bFactory = jest.fn(
                () =>
                  new Promise((resolve) => {
                    bResolver = resolve;
                  }),
              );
            },
            graph: () =>
              muster({
                foo: action(function*() {
                  let a: any;
                  try {
                    a = yield ref('a');
                  } catch (e) {
                    a = `Caught: ${e.message} (${e.error.code})`;
                  }
                  const b = yield ref('b');
                  return [a, b];
                }),
                a: fromPromise(aFactory),
                b: fromPromise(bFactory),
              }),
            operations: [
              operation({
                description: 'WHEN calling the action',
                input: call(ref('foo')),
                assert() {
                  expect(aFactory).toHaveBeenCalledTimes(1);
                  expect(bFactory).not.toHaveBeenCalled();
                },
                operations: (subscriber: () => MockSubscriber) => [
                  operation({
                    description: 'AND the promise rejects with a custom error',
                    before() {
                      aRejecter(new CustomError('Test failure', { code: 'error:foo' }));
                    },
                    assert() {
                      expect(subscriber().next).not.toHaveBeenCalled();
                      expect(bFactory).toHaveBeenCalledTimes(1);
                    },
                    operations: [
                      operation({
                        description: 'AND the second promise resolves',
                        before() {
                          bResolver('Success');
                        },
                        assert() {
                          expect(subscriber().next).toHaveBeenCalledTimes(1);
                          expect(subscriber().next).toHaveBeenLastCalledWith(
                            value(['Caught: Test failure (error:foo)', 'Success']),
                          );
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          };
        });

        runScenario(() => {
          class CustomError extends Error {
            public code: string;
            constructor(message: string, options: { code: string }) {
              super(message);
              this.name = this.constructor.name;
              this.code = options.code;
            }
          }
          return {
            description: 'GIVEN an action that re-throws a custom error',
            before() {
              aFactory = jest.fn(
                () =>
                  new Promise((resolve, reject) => {
                    aRejecter = reject;
                  }),
              );
              bFactory = jest.fn(
                () =>
                  new Promise((resolve) => {
                    bResolver = resolve;
                  }),
              );
            },
            graph: () =>
              muster({
                foo: action(function*() {
                  let a: any;
                  try {
                    a = yield call(ref('bar'));
                  } catch (e) {
                    a = `Caught: ${e.message} (${e.error.code})`;
                  }
                  const b = yield ref('b');
                  return [a, b];
                }),
                bar: action(function*() {
                  let a: any;
                  try {
                    a = yield ref('a');
                  } catch (e) {
                    throw e;
                  }
                  return a;
                }),
                a: fromPromise(aFactory),
                b: fromPromise(bFactory),
              }),
            operations: [
              operation({
                description: 'WHEN calling the action',
                input: call(ref('foo')),
                assert() {
                  expect(aFactory).toHaveBeenCalledTimes(1);
                  expect(bFactory).not.toHaveBeenCalled();
                },
                operations: (subscriber: () => MockSubscriber) => [
                  operation({
                    description: 'AND the promise rejects with a custom error',
                    before() {
                      aRejecter(new CustomError('Test failure', { code: 'error:foo' }));
                    },
                    assert() {
                      expect(subscriber().next).not.toHaveBeenCalled();
                      expect(bFactory).toHaveBeenCalledTimes(1);
                    },
                    operations: [
                      operation({
                        description: 'AND the second promise resolves',
                        before() {
                          bResolver('Success');
                        },
                        assert() {
                          expect(subscriber().next).toHaveBeenCalledTimes(1);
                          expect(subscriber().next).toHaveBeenLastCalledWith(
                            value(['Caught: Test failure (error:foo)', 'Success']),
                          );
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          };
        });

        runScenario({
          description: 'GIVEN an action that yields an error node inside try/catch',
          graph: () =>
            muster({
              foo: action(function*() {
                try {
                  yield error('Test error');
                } catch (e) {
                  return 'Caught';
                }
                return 'Never';
              }),
            }),
          operations: [
            operation({
              description: 'WHEN calling the action',
              input: call(ref('foo')),
              expected: value('Caught'),
            }),
          ],
        });
      });

      describe('Throwing within the generator', () => {
        runScenario({
          description: 'GIVEN an action that throws an error',
          graph: () =>
            muster({
              foo: action(function*() {
                const a = yield ref('a');
                throw new Error(`Exception: ${a}`);
              }),
              a: value('AAA'),
            }),
          operations: [
            operation({
              description: 'WHEN calling the action',
              input: call(ref('foo')),
              expected: withErrorPath(error('Exception: AAA'), { path: ['foo'] }),
            }),
          ],
        });
      });
    });

    runScenario({
      description: 'GIVEN an action that performs a series of stateful operations',
      graph: () =>
        muster({
          variable: variable('one'),
          action: action(function*() {
            const first = yield ref('variable');
            yield set('variable', 'two');
            const second = yield ref('variable');
            return `${first}->${second}`;
          }),
        }),
      operations: [
        operation({
          description: '',
          input: call('action'),
          expected: value('one->two'),
        }),
      ],
    });

    describe('GIVEN an action that yields an error node', () => {
      let mockFunction: jest.Mock<any>;

      runScenario({
        description: 'AND the exception is then passed to a mockFunction',
        before() {
          jest.clearAllMocks();
          mockFunction = jest.fn();
        },
        graph: () =>
          muster({
            action: action(function*() {
              try {
                yield error('Test error');
              } catch (ex) {
                mockFunction(ex);
              }
            }),
          }),
        operations: [
          operation({
            description: 'WHEN calling the action',
            input: call('action'),
            assert() {
              expect(mockFunction).toHaveBeenCalledTimes(1);
              expect(mockFunction).toHaveBeenCalledWith(new Error('Test error'));
            },
          }),
        ],
      });
    });

    describe('GIVEN an action that yields an error node with additional data', () => {
      let mockFunction: jest.Mock<any>;

      runScenario({
        description: 'AND the exception is then passed to a mockFunction',
        before() {
          jest.clearAllMocks();
          mockFunction = jest.fn();
        },
        graph: () =>
          muster({
            action: action(function*() {
              try {
                yield error('Test error', {
                  code: 'test-code',
                  data: { some: 'data' },
                });
              } catch (ex) {
                mockFunction(ex);
              }
            }),
          }),
        operations: [
          operation({
            description: 'WHEN calling the action',
            input: call('action'),
            assert() {
              expect(mockFunction).toHaveBeenCalledTimes(1);
              expect(mockFunction.mock.calls[0][0]).toEqual(new Error('Test error'));
              expect(mockFunction.mock.calls[0][0].code).toEqual('test-code');
              expect(mockFunction.mock.calls[0][0].data).toEqual({ some: 'data' });
            },
          }),
        ],
      });
    });

    describe('GIVEN an action that re-throws an error node with additional data', () => {
      let mockFunction: jest.Mock<any>;

      runScenario({
        description: 'AND the exception is then passed to a mockFunction',
        before() {
          jest.clearAllMocks();
          mockFunction = jest.fn();
        },
        graph: () =>
          muster({
            actionWithError: action(function*() {
              try {
                yield error('Test error', {
                  code: 'test-code',
                  data: { some: 'data' },
                });
              } catch (ex) {
                throw ex;
              }
            }),
            action: action(function*() {
              try {
                yield call('actionWithError');
              } catch (ex) {
                mockFunction(ex);
              }
            }),
          }),
        operations: [
          operation({
            description: 'WHEN calling the action',
            input: call('action'),
            assert() {
              expect(mockFunction).toHaveBeenCalledTimes(1);
              expect(mockFunction.mock.calls[0][0]).toEqual(new Error('Test error'));
              expect(mockFunction.mock.calls[0][0].code).toEqual('test-code');
              expect(mockFunction.mock.calls[0][0].data).toEqual({ some: 'data' });
            },
          }),
        ],
      });
    });

    runScenario({
      description: 'GIVEN an action yielding an object with nodes in it',
      graph: () =>
        muster({
          getGreeting: action(function*() {
            const { first, last } = yield {
              first: ref('firstName'),
              last: ref('lastName'),
            };
            return `Hello, ${first} ${last}!`;
          }),
          firstName: 'Kate',
          lastName: 'Jonson',
        }),
      operations: [
        operation({
          description: 'WHEN the action is called',
          input: call('getGreeting'),
          expected: value('Hello, Kate Jonson!'),
        }),
      ],
    });

    runScenario(() => {
      let mockUserCallback: jest.Mock<any>;
      return {
        description: 'GIVEN an action yielding a non-data node',
        before() {
          mockUserCallback = jest.fn();
        },
        graph: () =>
          muster({
            getUser: action(function*() {
              const user = yield ref('user');
              mockUserCallback(user);
            }),
            user: {
              firstName: 'Kate',
              lastName: 'Jonson',
            },
          }),
        operations: [
          operation({
            description: 'WHEN the getUser action is called',
            before() {
              jest.clearAllMocks();
            },
            input: call('getUser'),
            assert() {
              expect(mockUserCallback).toHaveBeenCalledTimes(1);
              const [user] = mockUserCallback.mock.calls[0];
              expect(isProxiedNode(user)).toBeTruthy();
              const proxiedUser = getProxiedNodeValue(user);
              expect(isGraphNode(proxiedUser)).toBeTruthy();
              expect((proxiedUser as GraphNode).definition).toEqual(
                toNode({
                  firstName: 'Kate',
                  lastName: 'Jonson',
                }),
              );
            },
          }),
        ],
      };
    });

    runScenario({
      description: 'GIVEN an action that sets a variable to a yielded proxied node',
      graph: () =>
        muster({
          setUserVariable: action(function*(id) {
            const user = yield ref('users', id);
            yield set('user', user);
          }),
          users: {
            [match(types.string, 'id')]: {
              firstName: format('First name ${id}', {
                id: param('id'),
              }),
              lastName: format('Last name ${id}', {
                id: param('id'),
              }),
            },
          },
          user: variable(nil()),
        }),
      operations: [
        operation({
          description: 'WHEN the query for user is made',
          input: query(ref('user'), {
            firstName: true,
            lastName: true,
          }),
          expected: value({
            firstName: undefined,
            lastName: undefined,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the setUserVariable is called',
              before() {
                jest.clearAllMocks();
              },
              input: call('setUserVariable', ['1']),
              expected: value(undefined),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    firstName: 'First name 1',
                    lastName: 'Last name 1',
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an action that uses another action to create a user',
      graph: () =>
        muster({
          user: variable(nil()),
          createUser: action((name) => toNode({ name })),
          addUser: action(function*({ name }) {
            const user = yield call('createUser', [name]);
            yield set('user', user);
          }),
        }),
      operations: [
        operation({
          description: 'WHEN making a query for user',
          input: query(ref('user'), {
            name: true,
          }),
          expected: value({
            name: undefined,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the addUser action is called',
              before() {
                jest.clearAllMocks();
              },
              input: call('addUser', { name: 'Bob' }),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    name: 'Bob',
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });
});
