import { ObservableLike } from '@dws/muster-observable';
import muster, {
  arrayList,
  context,
  createNodeDefinition,
  entries,
  filter,
  FnNodeType,
  getItemsOperation,
  key,
  lt,
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
  withTransforms,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { fromStreamMiddleware } from './from-stream-middleware';

const RESOLVE_OPERATION = resolveOperation({
  acceptNil: true,
  allowErrors: false,
  allowPending: false,
});

describe('fromStreamMiddleware()', () => {
  describe('GIVEN a string variable as a root of a remote graph', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster(variable('initial value'));
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the root variable from the remote graph',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote'),
          expected: value('initial value'),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [querySetOperation(RESOLVE_OPERATION)]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the variable gets updated (remotely)',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(root(), 'updated value'));
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('updated value'));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a variable in a tree', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          name: variable('initial value'),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the value of the variable',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'name'),
          expected: value('initial value'),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND then the value of the variable changes',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set('name', 'updated value'));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('updated value'));
              },
            }),
          ],
        }),
        operation({
          description: 'WHEN requesting the value of the variable as a query',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote'), {
            name: key('name'),
          }),
          expected: value({
            name: 'initial value',
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the name changes',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set('name', 'updated value'));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    name: 'updated value',
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with two variables', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          value1: variable('initial 1'),
          value2: variable('initial 2'),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting both variables',
          input: query(ref('remote'), {
            value1: key('value1'),
            value2: key('value2'),
          }),
          expected: value({
            value1: 'initial 1',
            value2: 'initial 2',
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('value2', [querySetOperation(RESOLVE_OPERATION)]),
                querySetGetChildOperation('value1', [querySetOperation(RESOLVE_OPERATION)]),
              ]),
            );
          },
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a nested variable', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          nested: {
            name: variable('initial value'),
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
          description: 'WHEN requesting the nested name',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'nested', 'name'),
          expected: value('initial value'),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('nested', [
                  querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the nested name changes',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(ref('nested', 'name'), 'updated value'));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('updated value'));
              },
            }),
          ],
        }),
        operation({
          description: 'WHEN requesting the name through a query',
          input: query(ref('remote'), {
            nested: key('nested', {
              name: key('name'),
            }),
          }),
          expected: value({
            nested: {
              name: 'initial value',
            },
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('nested', [
                  querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the nested name changes',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(ref('nested', 'name'), 'updated value'));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    nested: {
                      name: 'updated value',
                    },
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with three nested variables', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          nested1: {
            name1: variable('initial 1'),
          },
          nested2: {
            name2: variable('initial 2'),
          },
          name3: variable('initial 3'),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN making a combined query for three variables',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote'), {
            nested1: key('nested1', {
              name1: key('name1'),
            }),
            nested2: key('nested2', {
              name2: key('name2'),
            }),
            name3: key('name3'),
          }),
          expected: value({
            nested1: {
              name1: 'initial 1',
            },
            nested2: {
              name2: 'initial 2',
            },
            name3: 'initial 3',
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('nested2', [
                  querySetGetChildOperation('name2', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
                querySetGetChildOperation('nested1', [
                  querySetGetChildOperation('name1', [querySetOperation(RESOLVE_OPERATION)]),
                ]),
                querySetGetChildOperation('name3', [querySetOperation(RESOLVE_OPERATION)]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the nested1.name1 gets updated',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(ref('nested1', 'name1'), 'updated 1'));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    nested1: {
                      name1: 'updated 1',
                    },
                    nested2: {
                      name2: 'initial 2',
                    },
                    name3: 'initial 3',
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a collection of numbers', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          numbers: arrayList([1, 2, 3]),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the numbers',
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
              description: 'AND the remote numbers are changed',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(push(ref('numbers'), 4));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
        operation({
          description: 'WHEN requesting numbers with filter',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('remote', 'numbers'),
            withTransforms([filter((item: NodeDefinition) => lt(item, 3))], entries()),
          ),
          expected: value([1, 2]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('numbers', [
                  querySetGetItemsOperation({
                    children: [querySetOperation(RESOLVE_OPERATION)],
                    operation: getItemsOperation([
                      filter(
                        createNodeDefinition(FnNodeType, {
                          body: lt(context('$$arg:1'), 3) as NodeDefinition,
                          argIds: ['$$arg:1'],
                          hasNamedArgs: false,
                        }),
                      ),
                    ]),
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the remote numbers are changed',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(push(ref('numbers'), -10));
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([1, 2, -10]));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a collection of branches', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          products: arrayList([
            { name: 'name 1', description: 'description 1', price: 1 },
            { name: 'name 2', description: 'description 2', price: 2 },
            { name: 'name 3', description: 'description 3', price: 3 },
          ]),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN making a request for a list of product names',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('remote', 'products'),
            entries({
              name: key('name'),
            }),
          ),
          expected: value([{ name: 'name 1' }, { name: 'name 2' }, { name: 'name 3' }]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('products', [
                  querySetGetItemsOperation({
                    children: [
                      querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                    ],
                    operation: getItemsOperation(),
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND then the new item is added',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(
                  push(
                    ref('products'),
                    toNode({
                      name: 'name 4',
                      description: 'description 4',
                      price: 4,
                    }),
                  ),
                );
              },
              assert() {
                expect(mockRemoteResolve).not.toHaveBeenCalled();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([
                    { name: 'name 1' },
                    { name: 'name 2' },
                    { name: 'name 3' },
                    { name: 'name 4' },
                  ]),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with collection containing collections', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a fromSteamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          numberGroups: arrayList([[1, 2, 3], [-1, -2, -3]]),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query for a list lists',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'numberGroups'), entries(entries())),
          expected: value([[1, 2, 3], [-1, -2, -3]]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('numberGroups', [
                  querySetGetItemsOperation({
                    children: [
                      querySetGetItemsOperation({
                        children: [querySetOperation(RESOLVE_OPERATION)],
                        operation: getItemsOperation(),
                      }),
                    ],
                    operation: getItemsOperation(),
                  }),
                ]),
              ]),
            );
          },
        }),
      ],
    });
  });
});
