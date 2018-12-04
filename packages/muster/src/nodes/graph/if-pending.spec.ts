import { ObservableLike, Subject } from '@dws/muster-observable';
import muster, {
  array,
  ArrayNodeDefinition,
  computed,
  defer,
  entries,
  fields,
  fromPromise,
  fromStream,
  fromStreamMiddleware,
  get,
  getItemsOperation,
  ifPending,
  isPending,
  iterate,
  key,
  match,
  Muster,
  NodeDefinition,
  pending,
  proxy,
  query,
  querySetGetChildOperation,
  querySetGetItemsOperation,
  querySetOperation,
  ref,
  resolveOperation,
  root,
  set,
  toNode,
  tree,
  types,
  value,
  variable,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { querySetResult } from './query-set-result';

const RESOLVE_OPERATION = resolveOperation({
  acceptNil: true,
  allowErrors: false,
  allowPending: false,
});

describe('ifPending', () => {
  describe('WHEN the value is immediately available', () => {
    runScenario(() => {
      const callback = jest.fn(() => value('value:FALLBACK'));
      return {
        description: 'GIVEN a value hidden behind an `ifPending` node',
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ifPending(callback, value('value:foo')),
            expected: value('value:foo'),
            before() {
              jest.resetAllMocks();
            },
            assert() {
              expect(callback).toHaveBeenCalledTimes(0);
            },
          }),
        ],
      };
    });

    runScenario(() => {
      const callback = jest.fn(() => toNode({ nested: value('value:FALLBACK') }));
      return {
        description: 'GIVEN a branch value hidden behind an `ifPending` node',
        operations: [
          operation({
            description: 'AND the value is retrieved via a get() node',
            input: get(ifPending(callback, toNode({ nested: value('value:foo') })), 'nested'),
            expected: value('value:foo'),
            before() {
              jest.resetAllMocks();
            },
            assert() {
              expect(callback).toHaveBeenCalledTimes(0);
            },
          }),
          operation({
            description: 'AND the value is retrieved via a query() node',
            input: query(
              ifPending(
                () => toNode({ nested: value('value:FALLBACK') }),
                toNode({ nested: value('value:foo') }),
              ),
              fields({
                nested: key(value('nested')),
              }),
            ),
            expected: value({
              nested: 'value:foo',
            }),
            before() {
              jest.resetAllMocks();
            },
            assert() {
              expect(callback).toHaveBeenCalledTimes(0);
            },
          }),
        ],
      };
    });

    runScenario({
      description: 'GIVEN a graph with a branch hidden behind an `ifPending` node',
      graph: () =>
        muster({
          nested: ifPending(
            () => toNode({ item: value('missing') }),
            toNode({ item: value('nested value') }),
          ),
        }),
      operations: [
        operation({
          description: 'SHOULD resolve to the correct value',
          input: query(
            root(),
            fields({
              nestedRes: key(value('nested'), {
                itemRes: key(value('item')),
              }),
            }),
          ),
          expected: value({
            nestedRes: {
              itemRes: 'nested value',
            },
          }),
        }),
      ],
    });
    runScenario(() => {
      const callback = jest.fn(() => array([value('missing')]));
      return {
        description: 'GIVEN a graph with an iterator hidden behind an `ifPending` node',
        operations: [
          operation({
            description: 'AND the value is retrieved via an iterate() node',
            before() {
              jest.resetAllMocks();
            },
            input: query(
              iterate(
                ifPending(
                  callback,
                  array([value('value:foo'), value('value:bar'), value('value:baz')]),
                ),
              ),
              entries(),
            ),
            expected: value(['value:foo', 'value:bar', 'value:baz']),
            assert() {
              expect(callback).toHaveBeenCalledTimes(0);
            },
          }),
          operation({
            description: 'AND the value is retrieved via a query() node',
            input: query(
              ifPending(
                callback,
                array([value('value:foo'), value('value:bar'), value('value:baz')]),
              ),
              entries(),
            ),
            expected: value(['value:foo', 'value:bar', 'value:baz']),
            before() {
              jest.resetAllMocks();
            },
            assert() {
              expect(callback).toHaveBeenCalledTimes(0);
            },
          }),
        ],
      };
    });
  });

  describe('WHEN the value arrives after some time', () => {
    let resultStream: Subject<NodeDefinition>;
    let callback: jest.Mock<NodeDefinition>;

    runScenario({
      description: 'GIVEN a value hidden behind an `ifPending` node',
      before: () => {
        resultStream = new Subject<NodeDefinition>();
        callback = jest.fn(() => value('missing'));
      },
      graph: () =>
        muster({
          nested: ifPending(callback, fromStream(resultStream)),
        }),
      operations: [
        operation({
          description: 'SHOULD resolve to the fallback value',
          input: query(root(), {
            nested: key('nested'),
          }),
          expected: value({
            nested: 'missing',
          }),
          assert: () => {
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(undefined);
          },
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'SHOULD resolve to the correct value after stream emits value',
              before: async () => {
                jest.clearAllMocks();
                resultStream.next(value('VALUE'));
              },
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(0);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    nested: 'VALUE',
                  }),
                );
              },
              operations: [
                operation({
                  description: 'SHOULD switch back to pending value',
                  before: () => {
                    jest.clearAllMocks();
                    resultStream.next(pending());
                  },
                  assert: () => {
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        nested: 'missing',
                      }),
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
      description: 'GIVEN a branch hidden behind an `ifPending` node',
      before: () => {
        resultStream = new Subject<NodeDefinition>();
        callback = jest.fn(() =>
          tree({
            item: value('missing'),
          }),
        );
      },
      graph: () =>
        muster({
          nested: ifPending(callback, fromStream(resultStream)),
        }),
      operations: [
        operation({
          description: 'SHOULD resolve to the fallback value',
          input: query(root(), {
            nested: key('nested', {
              item: key('item'),
            }),
          }),
          expected: value({
            nested: {
              item: 'missing',
            },
          }),
          assert: () => {
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(undefined);
          },
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'SHOULD resolve to the correct value after stream emits value',
              before: async () => {
                jest.clearAllMocks();
                resultStream.next(
                  toNode({
                    item: 'nested value',
                  }),
                );
              },
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(0);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    nested: {
                      item: 'nested value',
                    },
                  }),
                );
              },
              operations: [
                operation({
                  description: 'SHOULD switch back to pending value',
                  before: () => {
                    jest.clearAllMocks();
                    resultStream.next(pending());
                  },
                  assert: () => {
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(callback).toHaveBeenCalledWith(
                      querySetResult(
                        [querySetGetChildOperation('item', [querySetOperation(RESOLVE_OPERATION)])],
                        array([array([value('nested value')])]),
                      ),
                    );
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        nested: {
                          item: 'missing',
                        },
                      }),
                    );
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario(() => ({
      description: 'GIVEN an iterator hidden behind an `ifPending` node',
      before: () => {
        resultStream = new Subject<NodeDefinition>();
        callback = jest.fn(() => array([value('missing')]));
      },
      graph: () => muster(ifPending(callback, fromStream(resultStream))),
      operations: [
        operation({
          description: 'WHEN the value is requested via an iterate() node',
          input: query(iterate(root()), entries()),
          expected: value(['missing']),
          assert: () => {
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(undefined);
          },
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'SHOULD resolve to the correct value after stream emits value',
              before: async () => {
                jest.clearAllMocks();
                resultStream.next(array([value('VALUE')]));
              },
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(0);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value(['VALUE']));
              },
              operations: [
                operation({
                  description: 'SHOULD switch back to pending value',
                  before: () => {
                    jest.clearAllMocks();
                    resultStream.next(pending());
                  },
                  assert: () => {
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(callback).toHaveBeenCalledWith(
                      querySetResult(
                        [
                          querySetGetItemsOperation({
                            children: [querySetOperation(RESOLVE_OPERATION)],
                            operation: getItemsOperation(),
                          }),
                        ],
                        array([array([array([value('VALUE')])])]),
                      ),
                    );
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(value(['missing']));
                  },
                }),
              ],
            }),
          ],
        }),
        operation({
          description: 'WHEN the value is requested via a query() node',
          input: query(root(), entries()),
          expected: value(['missing']),
          assert: () => {
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(undefined);
          },
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'SHOULD resolve to the correct value after stream emits value',
              before: async () => {
                jest.clearAllMocks();
                resultStream.next(array([value('VALUE')]));
              },
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(0);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value(['VALUE']));
              },
              operations: [
                operation({
                  description: 'SHOULD switch back to pending value',
                  before: () => {
                    jest.clearAllMocks();
                    resultStream.next(pending());
                  },
                  assert: () => {
                    expect(callback).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(value(['missing']));
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    }));
  });

  runScenario({
    description: 'GIVEN a branch hidden behind an `ifPending` node',
    graph: () => muster(fromPromise(() => new Promise(() => {}))),
    operations: [
      operation({
        description: 'SHOULD work when a GraphNode is given instead of a fallback factory',
        input: ifPending('PENDING', ref()),
        expected: value('PENDING'),
      }),
    ],
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let resultStream: Subject<NodeDefinition>;
    return {
      description: 'GIVEN a remote leaf hidden behind an `ifPending` node',
      before: () => {
        resultStream = new Subject<NodeDefinition>();
        remoteMuster = muster({
          foo: fromStream(resultStream),
        });
      },
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((query: NodeDefinition) =>
              remoteMuster.resolve(query, { raw: true }),
            ),
          ]),
        }),
      operations: [
        operation({
          description: 'SHOULD use the fallback',
          input: ifPending('PENDING', ref('remote', 'foo')),
          expected: value('PENDING'),
          operations: (subscriber) => [
            operation({
              description: 'AND the remote leaf is resolved with a value',
              before: () => {
                jest.clearAllMocks();
                resultStream.next(value('value:foo'));
              },
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value:foo'));
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let resultBranchStream: Subject<NodeDefinition>;
    let resultLeafStream: Subject<NodeDefinition>;
    return {
      description: 'GIVEN a nested remote leaf hidden behind an `ifPending` node',
      before: () => {
        resultBranchStream = new Subject<NodeDefinition>();
        resultLeafStream = new Subject<NodeDefinition>();
        remoteMuster = muster({
          nested: fromStream(resultBranchStream),
        });
      },
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((query: NodeDefinition) =>
              remoteMuster.resolve(query, { raw: true }),
            ),
          ]),
        }),
      operations: [
        operation({
          description: 'SHOULD use the fallback',
          input: ifPending('PENDING', ref('remote', 'nested', 'foo')),
          expected: value('PENDING'),
          operations: (subscriber) => [
            operation({
              description: 'AND the remote branch is resolved with a value',
              before: () => {
                jest.clearAllMocks();
                resultBranchStream.next(
                  toNode({
                    foo: fromStream(resultLeafStream),
                  }),
                );
              },
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
              operations: [
                {
                  description: 'AND the remote leaf is resolved with a value',
                  before: () => {
                    jest.clearAllMocks();
                    resultLeafStream.next(value('value:foo'));
                  },
                  assert: () => {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(value('value:foo'));
                  },
                },
              ],
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let resultStream: Subject<NodeDefinition>;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    return {
      description: 'GIVEN a remote branch hidden behind an `ifPending` node',
      before: () => {
        resultStream = new Subject<NodeDefinition>();
        remoteMuster = muster({
          deeply: {
            nested: {
              foo: fromStream(resultStream),
            },
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'SHOULD use the fallback',
          before() {
            jest.clearAllMocks();
          },
          input: ref({
            root: ifPending(
              toNode({
                nested: {
                  foo: 'PENDING',
                },
              }),
              ref('remote', 'deeply'),
            ),
            path: ['nested', 'foo'],
          }),
          expected: value('PENDING'),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the remote leaf is resolved with a value',
              before: () => {
                jest.clearAllMocks();
                resultStream.next(value('value:foo'));
              },
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value:foo'));
              },
            }),
          ],
        }),
      ],
    };
  });

  describe('GIVEN a collection with a dataSource that gets data asynchronously', () => {
    let dataPromise: Promise<ArrayNodeDefinition>;
    let resolvePromise: () => void;

    beforeEach(() => {
      let resolveCurrentPromise: (v: ArrayNodeDefinition) => void;
      dataPromise = new Promise((resolve) => {
        resolveCurrentPromise = resolve;
      });
      resolvePromise = () => {
        resolveCurrentPromise(array([1, 2, 3]));
      };
    });

    runScenario({
      description: 'WHEN the collection is accessible through if-pending node',
      graph: () =>
        muster({
          itemsSource: fromPromise(() => dataPromise),
          items: ifPending(array([]), ref('itemsSource')),
        }),
      operations: [
        operation({
          description: 'AND the items get requested',
          input: query(ref('items'), entries()),
          expected: value([]),
          operations: (itemsSubscription) => [
            operation({
              description: 'AND the promise gets resolved',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(itemsSubscription().next).toHaveBeenCalledTimes(1);
                expect(itemsSubscription().next).toHaveBeenCalledWith(value([1, 2, 3]));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN an async array with branches', () => {
    let dataPromise: Promise<NodeDefinition>;
    let resolvePromise: () => void;

    beforeEach(() => {
      let resolveCurrentPromise: (v: NodeDefinition) => void;
      dataPromise = new Promise((resolve) => {
        resolveCurrentPromise = resolve;
      });
      resolvePromise = () => {
        resolveCurrentPromise(toNode([{ id: 1, name: 'first' }, { id: 2, name: 'second' }]));
      };
    });

    runScenario({
      description: 'WHEN the collection is accessible through if-pending node',
      graph: () =>
        muster({
          itemsSource: fromPromise(() => dataPromise),
          items: ifPending(array([]), ref('itemsSource')),
        }),
      operations: [
        operation({
          description: 'AND the items get requested',
          input: query(
            ref('items'),
            entries({
              id: true as true,
              name: true as true,
            }),
          ),
          expected: value([]),
          operations: (itemsSubscription) => [
            operation({
              description: 'AND the promise gets resolved',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(itemsSubscription().next).toHaveBeenCalledTimes(1);
                expect(itemsSubscription().next).toHaveBeenCalledWith(
                  value([{ id: 1, name: 'first' }, { id: 2, name: 'second' }]),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let resultStream: Subject<NodeDefinition>;
    return {
      description: 'GIVEN a remote collection hidden behind an `ifPending` node',
      before: () => {
        resultStream = new Subject<NodeDefinition>();
        remoteMuster = muster({
          deeply: {
            nested: {
              items: fromStream(resultStream),
            },
          },
        });
      },
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((query: NodeDefinition) =>
              remoteMuster.resolve(query, { raw: true }),
            ),
          ]),
          collection: ifPending(
            array(['PENDING 1', 'PENDING 2', 'PENDING 3']),
            ref('remote', 'deeply', 'nested', 'items'),
          ),
        }),
      operations: [
        operation({
          description: 'AND a the collection items are fetched via a query',
          input: query(ref('collection'), entries()),
          expected: value(['PENDING 1', 'PENDING 2', 'PENDING 3']),
          operations: (subscriber) => [
            operation({
              description: 'AND the remote leaf is resolved with a value',
              before() {
                jest.clearAllMocks();
                resultStream.next(array(['Value 1', 'Value 2']));
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value(['Value 1', 'Value 2']));
              },
            }),
          ],
        }),
      ],
    };
  });

  describe('Asynchronous loading', () => {
    let resolvePromise: () => void;
    runScenario({
      description: 'GIVEN a muster graph containing an async node wrapped in ifPending',
      graph: () =>
        muster({
          name: variable('initial'),
          asyncName: computed([ref('name')], (name) => ref(name)),
          [match(types.string, 'name')]: fromPromise(({ name }) =>
            new Promise((resolve) => {
              resolvePromise = resolve;
            }).then(() => name),
          ),
        }),
      operations: [
        operation({
          description:
            'WHEN the asyncName and isAsyncNameLoading gets requested for the first time',
          input: query(root(), {
            asyncName: defer(key('asyncName')),
            isAsyncNameLoading: isPending(key('asyncName')),
          }),
          expected: value({
            asyncName: undefined,
            isAsyncNameLoading: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the asyncName promise resolves',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    asyncName: 'initial',
                    isAsyncNameLoading: false,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the name gets changed',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        asyncName: 'initial',
                        isAsyncNameLoading: true,
                      }),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the promise resolves for the second time',
                      before() {
                        jest.clearAllMocks();
                        resolvePromise();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            asyncName: 'updated',
                            isAsyncNameLoading: false,
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

    runScenario({
      description:
        'GIVEN a muster graph containing an async node wrapped in ifPending - with branch matcher',
      graph: () =>
        muster({
          name: variable('initial'),
          nested: {
            [match(types.string, 'name')]: fromPromise((props: any) =>
              new Promise((res) => (resolvePromise = res)).then(() => props.name),
            ),
          },
          asyncName: ref('nested', ref('name')),
        }),
      operations: [
        operation({
          description:
            'WHEN the asyncName and isAsyncNameLoading gets requested for the first time',
          input: query(root(), {
            asyncName: defer(key('asyncName')),
            isAsyncNameLoading: isPending(key('asyncName')),
          }),
          expected: value({
            asyncName: undefined,
            isAsyncNameLoading: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the asyncName promise resolves',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    asyncName: 'initial',
                    isAsyncNameLoading: false,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the name gets changed',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        asyncName: 'initial',
                        isAsyncNameLoading: true,
                      }),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the promise resolves for the second time',
                      before() {
                        jest.clearAllMocks();
                        resolvePromise();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            asyncName: 'updated',
                            isAsyncNameLoading: false,
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

    runScenario({
      description: 'GIVEN a muster graph with an async node wrapped in ifPending',
      graph: () =>
        muster({
          name: variable('initial'),
          nested: {
            [match(types.string, 'name')]: fromPromise((props: any) =>
              new Promise((res) => (resolvePromise = res)).then(() => props.name),
            ),
          },
          asyncName: ref('nested', ref('name')),
        }),
      operations: [
        operation({
          description: 'WHEN making a query for asyncName and isLoadingAsyncName',
          input: query(root(), {
            asyncName: defer(key('asyncName')),
            isLoadingAsyncName: isPending(key('asyncName')),
          }),
          expected: value({
            asyncName: undefined,
            isLoadingAsyncName: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promise resolves',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    asyncName: 'initial',
                    isLoadingAsyncName: false,
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });

    let counter: number;
    runScenario({
      description: 'GIVEN a muster graph containing a fromPromise node behind ifPending',
      before() {
        counter = 0;
      },
      graph: () =>
        muster({
          async: ifPending(
            (previous: NodeDefinition) => previous || value('pending'),
            fromPromise(() => {
              // tslint:disable-next-line:no-increment-decrement
              return Promise.resolve(++counter);
            }),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the async is requested for the first time',
          input: ref('async'),
          expected: [value('pending'), value(1)],
          operations: [
            operation({
              description: 'AND the async is requested for the first time',
              input: ref('async'),
              expected: value(1),
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a muster graph containing a fromPromise node',
      before() {
        counter = 0;
      },
      graph: () =>
        muster({
          async: fromPromise(() => {
            // tslint:disable-next-line:no-increment-decrement
            return Promise.resolve(++counter);
          }),
        }),
      operations: [
        operation({
          description: 'WHEN the async is requested for the first time (wrapped in ifPending)',
          input: ifPending((prev: any) => prev || value('pending'), ref('async')),
          expected: [value('pending'), value(1)],
          operations: [
            operation({
              description: 'AND the async is requested for the first time (wrapped in ifPending)',
              input: ifPending((prev: any) => prev || value('pending'), ref('async')),
              expected: value(1),
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a muster graph containing asynchronously returned collection',
      graph: () =>
        muster({
          name: variable('initial'),
          nested: {
            [match(types.string, 'name')]: fromPromise((props: any) =>
              new Promise((res) => (resolvePromise = res)).then(() =>
                array([`${props.name} 1`, `${props.name} 2`, `${props.name} 3`]),
              ),
            ),
          },
          asyncCollection: ref('nested', ref('name')),
        }),
      operations: [
        operation({
          description: 'WHEN making a query for asyncCollection and isLoadingCollection',
          input: query(root(), {
            asyncCollection: defer(key('asyncCollection', entries())),
            isLoadingCollection: isPending(key('asyncCollection', entries())),
          }),
          expected: value({
            asyncCollection: [],
            isLoadingCollection: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promise gets resolved',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    asyncCollection: ['initial 1', 'initial 2', 'initial 3'],
                    isLoadingCollection: false,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the name changes',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        asyncCollection: ['initial 1', 'initial 2', 'initial 3'],
                        isLoadingCollection: true,
                      }),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the promise resolves',
                      before() {
                        jest.clearAllMocks();
                        resolvePromise();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            asyncCollection: ['updated 1', 'updated 2', 'updated 3'],
                            isLoadingCollection: false,
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

  describe('GIVEN a remote muster graph containing an async value', () => {
    let remoteMuster: Muster;
    let promisesToResolve: Array<() => void>;
    let mockFallback: jest.Mock<NodeDefinition>;
    let resolvePromise: () => void;

    beforeEach(() => {
      jest.clearAllMocks();
      remoteMuster = muster({
        [match(types.string, 'name')]: fromPromise(({ name }) =>
          new Promise((resolve) => promisesToResolve.push(resolve)).then(() => name),
        ),
      });
      promisesToResolve = [];
      mockFallback = jest.fn((prev: any) => prev || value('PENDING'));
      resolvePromise = () => {
        promisesToResolve.forEach((res) => res());
        promisesToResolve = [];
      };
    });

    runScenario({
      description: 'AND a local instance of muster connected to the remote',
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true }))]),
          name: variable('initial'),
          remoteName: ifPending(mockFallback, ref('remote', ref('name'))),
        }),
      operations: [
        operation({
          description: 'WHEN the remoteName gets requested with "initial" name',
          input: ref('remoteName'),
          expected: value('PENDING'),
          assert() {
            expect(mockFallback).toHaveBeenCalledTimes(1);
            expect(mockFallback).toHaveBeenCalledWith(undefined);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the promise gets resolved',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('initial'));
              },
              operations: [
                operation({
                  description: 'AND the name changes to "updated"',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(mockFallback).toHaveBeenCalledTimes(1);
                    expect(mockFallback).toHaveBeenCalledWith(
                      querySetResult(
                        [querySetOperation(RESOLVE_OPERATION)],
                        array([value('initial')]),
                      ),
                    );
                    expect(subscriber().next).not.toHaveBeenCalled();
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster graph containing an async tree', () => {
    let remoteMuster: Muster;
    let promisesToResolve: Array<() => void>;
    let mockFallback: jest.Mock<NodeDefinition>;
    let resolvePromise: () => void;

    beforeEach(() => {
      jest.clearAllMocks();
      remoteMuster = muster({
        user: {
          [match(types.string, 'name')]: fromPromise(({ name }) =>
            new Promise((resolve) => promisesToResolve.push(resolve)).then(() =>
              tree({
                first: value(`${name} first`),
                last: value(`${name} last`),
                additional: value(`${name} additional`),
              }),
            ),
          ),
        },
      });
      promisesToResolve = [];
      mockFallback = jest.fn((prev: any) => {
        return (
          prev ||
          tree({
            first: value('PENDING'),
            last: value('PENDING'),
          })
        );
      });
      resolvePromise = () => {
        promisesToResolve.forEach((res) => res());
        promisesToResolve = [];
      };
    });

    runScenario({
      description: 'AND a local instance of muster connected to the remote',
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true }))]),
          name: variable('initial'),
          remoteUser: ifPending(mockFallback, ref('remote', `user`, ref('name'))),
        }),
      operations: [
        operation({
          description: 'WHEN the remoteName gets requested with "initial" name',
          input: query(ref('remoteUser'), {
            first: key('first'),
            last: key('last'),
          }),
          expected: value({
            first: 'PENDING',
            last: 'PENDING',
          }),
          assert() {
            expect(mockFallback).toHaveBeenCalledTimes(1);
            expect(mockFallback).toHaveBeenCalledWith(undefined);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the promise is resolved',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    first: 'initial first',
                    last: 'initial last',
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the name changes to "updated"',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(mockFallback).toHaveBeenCalledTimes(1);
                    expect(mockFallback).toHaveBeenCalledWith(
                      querySetResult(
                        [
                          querySetGetChildOperation('last', [querySetOperation(RESOLVE_OPERATION)]),
                          querySetGetChildOperation('first', [
                            querySetOperation(RESOLVE_OPERATION),
                          ]),
                        ],
                        array([array([value('initial last')]), array([value('initial first')])]),
                      ),
                    );
                    expect(subscriber().next).not.toHaveBeenCalled();
                  },
                  operations: [
                    operation({
                      description: 'AND the promise is resolved',
                      before() {
                        jest.clearAllMocks();
                        resolvePromise();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            first: 'updated first',
                            last: 'updated last',
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

  describe('GIVEN a remote instance of muster containing a collection of items', () => {
    let remoteMuster: Muster;
    let promisesToResolve: Array<() => void>;
    let resolvePromise: () => void;
    let mockFallback: jest.Mock<NodeDefinition>;

    beforeEach(() => {
      promisesToResolve = [];
      resolvePromise = () => {
        promisesToResolve.forEach((res) => res());
        promisesToResolve = [];
      };
      mockFallback = jest.fn((prev) => {
        return prev || array([]);
      });
      remoteMuster = muster({
        [match(types.string, 'name')]: fromPromise(({ name }) =>
          new Promise((res) => promisesToResolve.push(res)).then(() =>
            array([value(`${name} 1`), value(`${name} 2`)]),
          ),
        ),
      });
    });

    runScenario({
      description: 'AND the local instance connected to the remote',
      before() {
        jest.clearAllMocks();
      },
      graph: () =>
        muster({
          name: variable('initial'),
          remote: proxy([fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true }))]),
          remoteItems: ifPending(mockFallback, ref('remote', ref('name'))),
        }),
      operations: [
        operation({
          description: 'WHEN the remote items gets requested for "initial" name',
          input: query(ref('remoteItems'), entries()),
          expected: value([]),
          assert() {
            expect(mockFallback).toHaveBeenCalledTimes(1);
            expect(mockFallback).toHaveBeenCalledWith(undefined);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the promise is resolved',
              before() {
                jest.clearAllMocks();
                resolvePromise();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value(['initial 1', 'initial 2']));
              },
              operations: [
                operation({
                  description: 'AND the name is changed to "updated"',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(0);
                    expect(mockFallback).toHaveBeenCalledTimes(1);
                    expect(mockFallback).toHaveBeenCalledWith(
                      querySetResult(
                        [
                          querySetGetItemsOperation({
                            children: [querySetOperation(RESOLVE_OPERATION)],
                            operation: getItemsOperation(),
                          }),
                        ],
                        array([array([array([value('initial 1')]), array([value('initial 2')])])]),
                      ),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the promise is resolved',
                      before() {
                        jest.clearAllMocks();
                        resolvePromise();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value(['updated 1', 'updated 2']),
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
});
