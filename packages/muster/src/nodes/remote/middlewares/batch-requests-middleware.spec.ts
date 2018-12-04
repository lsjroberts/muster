import { ObservableLike } from '@dws/muster-observable';
import muster, {
  arrayList,
  entries,
  fromPromise,
  fromStreamMiddleware,
  getItemsOperation,
  key,
  Muster,
  NodeDefinition,
  proxy,
  push,
  query,
  querySet,
  querySetGetChildOperation,
  querySetGetItemsOperation,
  querySetOperation,
  ref,
  resolveOperation,
  root,
  set,
  toNode,
  value,
  variable,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { batchRequestsMiddleware } from './batch-requests-middleware';

const RESOLVE_OPERATION = resolveOperation({
  acceptNil: true,
  allowErrors: false,
  allowPending: false,
});

describe('batchRequestMiddleware()', () => {
  describe('GIVEN a remote graph containing a variable', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local graph connected to the remote',
      before() {
        remoteMuster = muster(variable('initial'));
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the variable (ref)',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote'),
          expected: value('initial'),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [querySetOperation(RESOLVE_OPERATION)]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the variable is updated',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(root(), 'updated'));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
              },
            }),
          ],
        }),
        operation({
          description: 'WHEN requesting the variable (query)',
          before() {
            jest.clearAllMocks();
          },
          input: query(root(), {
            remote: key('remote'),
          }),
          expected: value({
            remote: 'initial',
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [querySetOperation(RESOLVE_OPERATION)]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the variable is updated',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(root(), 'updated'));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    remote: 'updated',
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph containing a tree', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local graph connected to the remote',
      before() {
        remoteMuster = muster({
          first: variable('initial 1'),
          second: variable('initial 2'),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting `first` (ref)',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'first'),
          expected: value('initial 1'),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
              ]),
            );
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND then requesting `second` (ref)',
              before() {
                jest.clearAllMocks();
              },
              input: ref('remote', 'second'),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('second', [querySetOperation(RESOLVE_OPERATION)]),
                  ]),
                );
              },
              operations: (subscriber2) => [
                operation({
                  description: 'AND the `first` variable is set',
                  async before() {
                    jest.clearAllMocks();
                    await remoteMuster.resolve(set(ref('first'), 'updated 1'));
                  },
                  assert() {
                    expect(mockRemoteResolve).not.toHaveBeenCalled();
                    expect(subscriber1().next).toHaveBeenCalledTimes(1);
                    expect(subscriber1().next).toHaveBeenCalledWith(value('updated 1'));
                    expect(subscriber2().next).not.toHaveBeenCalled();
                  },
                  operations: [
                    operation({
                      description: 'AND the `second` variable is set',
                      async before() {
                        jest.clearAllMocks();
                        await remoteMuster.resolve(set(ref('second'), 'updated 2'));
                      },
                      assert() {
                        expect(mockRemoteResolve).not.toHaveBeenCalled();
                        expect(subscriber1().next).not.toHaveBeenCalled();
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(value('updated 2'));
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

  describe('GIVEN a remote graph containing nested branches', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          nested1: {
            first: variable('initial first 1'),
            second: variable('initial second 1'),
          },
          nested2: {
            first: variable('initial first 2'),
            second: variable('initial second 2'),
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        //
        // TEST 1:
        // 1. subscribe(nested1)
        // 2. subscribe(nested2)
        // 3. reSubscribe(nested1)
        //
        operation({
          description: 'WHEN resolving a query for `nested1`',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'nested1'), {
            first: key('first'),
            second: key('second'),
          }),
          expected: value({
            first: 'initial first 1',
            second: 'initial second 1',
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('nested1', [
                  querySetGetChildOperation('second', [querySetOperation(RESOLVE_OPERATION)]),
                  querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
              ]),
            );
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND then resolving a query for `nested2`',
              before() {
                jest.clearAllMocks();
              },
              input: query(ref('remote', 'nested2'), {
                first: key('first'),
                second: key('second'),
              }),
              expected: value({
                first: 'initial first 2',
                second: 'initial second 2',
              }),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('nested2', [
                      querySetGetChildOperation('second', [querySetOperation(RESOLVE_OPERATION)]),
                      querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
                    ]),
                  ]),
                );
              },
              operations: (subscriber2) => [
                operation({
                  description: 'AND the first query gets un-subscribed and then re-subscribed',
                  before() {
                    jest.clearAllMocks();
                    subscriber1().subscription.unsubscribe();
                  },
                  input: query(ref('remote', 'nested1'), {
                    first: key('first'),
                    second: key('second'),
                  }),
                  expected: value({
                    first: 'initial first 1',
                    second: 'initial second 1',
                  }),
                  assert() {
                    expect(subscriber2().next).not.toHaveBeenCalled();
                    expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                    expect(mockRemoteResolve).toHaveBeenCalledWith(
                      querySet(root(), [
                        querySetGetChildOperation('nested1', [
                          querySetGetChildOperation('second', [
                            querySetOperation(RESOLVE_OPERATION),
                          ]),
                          querySetGetChildOperation('first', [
                            querySetOperation(RESOLVE_OPERATION),
                          ]),
                        ]),
                      ]),
                    );
                  },
                }),
              ],
            }),
          ],
        }),
        //
        // TEST 2:
        // 1. subscribe(nested1 & nested2.first)
        // 2. subscribe(nested2)
        // 3. unsubscribe(nested1 & nested2.first)
        // 4. set(nested2.first)
        //
        operation({
          description: 'WHEN resolving a query for `nested1` and `nested2.first`',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote'), {
            nested1: key('nested1', {
              first: key('first'),
              second: key('second'),
            }),
            nested2: key('nested2', {
              first: key('first'),
            }),
          }),
          expected: value({
            nested1: {
              first: 'initial first 1',
              second: 'initial second 1',
            },
            nested2: {
              first: 'initial first 2',
            },
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('nested2', [
                  querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
                querySetGetChildOperation('nested1', [
                  querySetGetChildOperation('second', [querySetOperation(RESOLVE_OPERATION)]),
                  querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
              ]),
            );
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND then resolving a query for `nested2`',
              before() {
                jest.clearAllMocks();
              },
              input: query(ref('remote', 'nested2'), {
                first: key('first'),
                second: key('second'),
              }),
              expected: value({
                first: 'initial first 2',
                second: 'initial second 2',
              }),
              assert() {
                expect(subscriber1().next).not.toHaveBeenCalled();
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('nested2', [
                      querySetGetChildOperation('second', [querySetOperation(RESOLVE_OPERATION)]),
                    ]),
                  ]),
                );
              },
              operations: (subscriber2) => [
                operation({
                  description: 'AND then first query is un-subscribed',
                  before() {
                    subscriber1().subscription.unsubscribe();
                  },
                  operations: [
                    operation({
                      description: 'AND then `nested2`->`first` is set',
                      async before() {
                        jest.clearAllMocks();
                        await remoteMuster.resolve(set(ref('nested2', 'first'), 'updated first 2'));
                      },
                      assert() {
                        expect(mockRemoteResolve).not.toHaveBeenCalled();
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(
                          value({
                            first: 'updated first 2',
                            second: 'initial second 2',
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

  describe('GIVEN a remote graph containing a collection of numbers', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local instance connected to the remote',
      before() {
        remoteMuster = muster(arrayList([1, 2, 3]));
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the list of items',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote'), entries()),
          expected: value([1, 2, 3]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetItemsOperation({
                  children: [querySetOperation(RESOLVE_OPERATION)],
                  operation: getItemsOperation(),
                }),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND a new item is added to the remote collection',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(push(root(), 4));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([1, 2, 3, 4]));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph containing a collection of numbers inside a branch', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local instance connected to the remote',
      before() {
        remoteMuster = muster({
          numbers: arrayList([1, 2, 3]),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the list of items',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'numbers'), entries()),
          expected: value([1, 2, 3]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('numbers', [
                  querySetGetItemsOperation({
                    children: [querySetOperation(RESOLVE_OPERATION)],
                    operation: getItemsOperation(),
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND a new item is added to the remote collection',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(push(ref('numbers'), 4));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([1, 2, 3, 4]));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph containing a collection of flat trees', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local instance connected to the remote',
      before() {
        remoteMuster = muster(
          arrayList([
            { name: 'item 1', description: 'description 1', id: 1 },
            { name: 'item 2', description: 'description 2', id: 2 },
            { name: 'item 3', description: 'description 3', id: 3 },
          ]),
        );
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the list of items',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('remote'),
            entries({
              name: key('name'),
              description: key('description'),
            }),
          ),
          expected: value([
            { name: 'item 1', description: 'description 1' },
            { name: 'item 2', description: 'description 2' },
            { name: 'item 3', description: 'description 3' },
          ]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetItemsOperation({
                  children: [
                    querySetGetChildOperation('description', [
                      querySetOperation(RESOLVE_OPERATION),
                    ]),
                    querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                  ],
                  operation: getItemsOperation(),
                }),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND a new item is added to the remote collection',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(
                  push(
                    root(),
                    toNode({
                      name: 'item 4',
                      description: 'description 4',
                      id: 4,
                    }),
                  ),
                );
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([
                    { name: 'item 1', description: 'description 1' },
                    { name: 'item 2', description: 'description 2' },
                    { name: 'item 3', description: 'description 3' },
                    { name: 'item 4', description: 'description 4' },
                  ]),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with nested branches', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          users: [
            {
              info: {
                firstName: 'test first 1',
                lastName: 'test last 1',
                userName: 'testUser1',
              },
            },
            {
              info: {
                firstName: 'test first 2',
                lastName: 'test last 2',
                userName: 'testUser2',
              },
            },
            {
              info: {
                firstName: 'test first 3',
                lastName: 'test last 3',
                userName: 'testUser3',
              },
            },
          ],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting user data',
          input: query(
            ref('remote', 'users'),
            entries({
              info: key('info', {
                firstName: key('firstName'),
                lastName: key('lastName'),
                userName: key('userName'),
              }),
            }),
          ),
          expected: value([
            {
              info: {
                firstName: 'test first 1',
                lastName: 'test last 1',
                userName: 'testUser1',
              },
            },
            {
              info: {
                firstName: 'test first 2',
                lastName: 'test last 2',
                userName: 'testUser2',
              },
            },
            {
              info: {
                firstName: 'test first 3',
                lastName: 'test last 3',
                userName: 'testUser3',
              },
            },
          ]),
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with slow async fields', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    let userPromise: () => void;
    let messagePromise: () => void;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          user: fromPromise(() =>
            new Promise((res) => (userPromise = res)).then(() =>
              toNode({
                first: 'first name',
                last: 'last name',
              }),
            ),
          ),
          message: fromPromise(() =>
            new Promise((res) => (messagePromise = res)).then(() => 'Some message'),
          ),
          number: 1,
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting user',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'user'), {
            first: key('first'),
            last: key('last'),
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('user', [
                  querySetGetChildOperation('last', [querySetOperation(RESOLVE_OPERATION)]),
                  querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
              ]),
            );
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND requesting message and number before the previous query finishes',
              before() {
                jest.clearAllMocks();
              },
              input: query(ref('remote'), {
                message: key('message'),
                number: key('number'),
              }),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('number', [querySetOperation(RESOLVE_OPERATION)]),
                    querySetGetChildOperation('message', [querySetOperation(RESOLVE_OPERATION)]),
                  ]),
                );
              },
              operations: (subscriber2) => [
                operation({
                  description: 'AND the second request finishes first',
                  before() {
                    jest.clearAllMocks();
                    messagePromise();
                  },
                  assert() {
                    expect(subscriber1().next).not.toHaveBeenCalled();
                    expect(subscriber2().next).not.toHaveBeenCalled();
                  },
                  operations: [
                    operation({
                      description: 'AND then the first request is resolved',
                      before() {
                        jest.clearAllMocks();
                        userPromise();
                      },
                      assert() {
                        expect(subscriber1().next).toHaveBeenCalledTimes(1);
                        expect(subscriber1().next).toHaveBeenCalledWith(
                          value({
                            first: 'first name',
                            last: 'last name',
                          }),
                        );
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(
                          value({
                            message: 'Some message',
                            number: 1,
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

  describe('GIVEN a remote graph with slow async fields (test with un-subscribing)', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    let userPromise: () => void;
    let messagePromise: () => void;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          user: fromPromise(() =>
            new Promise((res) => (userPromise = res)).then(() =>
              toNode({
                first: 'first name',
                last: 'last name',
              }),
            ),
          ),
          message: fromPromise(() =>
            new Promise((res) => (messagePromise = res)).then(() => 'Some message'),
          ),
          number: 1,
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting user',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'user'), {
            first: key('first'),
            last: key('last'),
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('user', [
                  querySetGetChildOperation('last', [querySetOperation(RESOLVE_OPERATION)]),
                  querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
              ]),
            );
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND then the subscription is closed',
              before() {
                jest.clearAllMocks();
                subscriber1().subscription.unsubscribe();
              },
              operations: [
                operation({
                  description:
                    'AND requesting message and number before the previous query finishes',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: query(ref('remote'), {
                    message: key('message'),
                    number: key('number'),
                  }),
                  assert() {
                    expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                    expect(mockRemoteResolve).toHaveBeenCalledWith(
                      querySet(root(), [
                        querySetGetChildOperation('number', [querySetOperation(RESOLVE_OPERATION)]),
                        querySetGetChildOperation('message', [
                          querySetOperation(RESOLVE_OPERATION),
                        ]),
                      ]),
                    );
                  },
                  operations: (subscriber2) => [
                    operation({
                      description: 'AND the first request is resolved',
                      before() {
                        jest.clearAllMocks();
                        messagePromise();
                      },
                      assert() {
                        expect(subscriber1().next).not.toHaveBeenCalled();
                        // expect(subscriber2().next).not.toHaveBeenCalled();
                        expect(subscriber2().next).toHaveBeenCalledTimes(1);
                        expect(subscriber2().next).toHaveBeenCalledWith(
                          value({
                            message: 'Some message',
                            number: 1,
                          }),
                        );
                      },
                      operations: [
                        operation({
                          description: 'AND then the second request is resolved',
                          before() {
                            jest.clearAllMocks();
                            userPromise();
                          },
                          assert() {
                            expect(subscriber1().next).not.toHaveBeenCalled();
                            expect(subscriber2().next).not.toHaveBeenCalled();
                            // expect(subscriber2().next).toHaveBeenCalledTimes(1);
                            // expect(subscriber2().next).toHaveBeenCalledWith(value({
                            //   message: 'Some message',
                            //   number: 1,
                            // }));
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
    });
  });
});
