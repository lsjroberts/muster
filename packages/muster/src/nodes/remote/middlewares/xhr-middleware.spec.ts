import { map, Observable, ObservableLike } from '@dws/muster-observable';
import muster, {
  arrayList,
  attachMetadata,
  deserialize,
  entries,
  ErrorNodeDefinition,
  filter,
  getMusterNodeTypesMap,
  getMusterOperationTypesMap,
  GraphWithMetadata,
  HttpRequestConfiguration,
  key,
  lt,
  Muster,
  NodeDefinition,
  proxy,
  push,
  query,
  ref,
  root,
  sanitize,
  set,
  toNode,
  value,
  variable,
  withTransforms,
} from '../../..';
import { operation, runScenario } from '../../../test';
import * as doHttpRequest from '../utils/do-http-request';
import { xhrMiddleware, XhrMiddlewareOptions } from './xhr-middleware';

const mockRemoteGraph = (doHttpRequest as any).mockRemoteGraph as (graph: Muster) => void;

const mockAttachMetadata = attachMetadata;
const mockDeserialize = deserialize;
const mockGetMusterNodeTypesMap = getMusterNodeTypesMap;
const mockGetMusterOperationTypesMap = getMusterOperationTypesMap;
const mockMap = map;
const mockObservable = Observable;
const mockSanitize = sanitize;

jest.mock('../utils/do-http-request', () => {
  const mockResolver = jest
    .fn<ObservableLike<NodeDefinition> & Promise<NodeDefinition>>()
    .mockImplementation(() => {
      throw new Error('No mock remote graph present! Set it using `mockRemoteGraph()` function.');
    });
  return {
    doHttpRequest(config: HttpRequestConfiguration): ObservableLike<string | ErrorNodeDefinition> {
      const jsonBody: GraphWithMetadata = JSON.parse(config.body);
      const deserializedNode = mockDeserialize(
        mockGetMusterNodeTypesMap(),
        mockGetMusterOperationTypesMap(),
        jsonBody.graph,
      );
      const responseStream = new mockObservable<NodeDefinition>((observer) => {
        mockResolver(deserializedNode)
          .then((res: NodeDefinition) => observer.next(res))
          .catch((err: NodeDefinition) => observer.next(err));
        return () => {};
      });
      return mockMap(
        (res: NodeDefinition) => JSON.stringify(mockAttachMetadata(mockSanitize(res))),
        responseStream,
      );
    },
    mockRemoteGraph(graph: Muster) {
      mockResolver.mockImplementation((body) => graph.resolve(body, { raw: true }));
    },
    mockResponse(node: NodeDefinition) {
      mockResolver.mockReturnValue(Promise.resolve(node));
    },
  };
});

const xhrMiddlewareConfig: XhrMiddlewareOptions = {
  url: 'http://test.url',
};

describe('xhrMiddleware()', () => {
  describe('GIVEN a string variable as a root of a remote graph', () => {
    let remoteMuster: Muster;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster(variable('initial value'));
        mockRemoteGraph(remoteMuster);
      },
      graph: () =>
        muster({
          remote: proxy([xhrMiddleware({ ...xhrMiddlewareConfig })]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the root variable from the remote graph',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote'),
          expected: value('initial value'),
          operations: (subscriber) => [
            operation({
              description: 'AND the variable gets updated (remotely)',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(root(), 'updated value'));
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a variable in a tree', () => {
    let remoteMuster: Muster;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          name: variable('initial value'),
        });
        mockRemoteGraph(remoteMuster);
      },
      graph: () =>
        muster({
          remote: proxy([xhrMiddleware({ ...xhrMiddlewareConfig })]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the value of the variable',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'name'),
          expected: value('initial value'),
          operations: (subscriber) => [
            operation({
              description: 'AND then the value of the variable changes',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set('name', 'updated value'));
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
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
          operations: (subscriber) => [
            operation({
              description: 'AND the name changes',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set('name', 'updated value'));
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a nested variable', () => {
    let remoteMuster: Muster;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          nested: {
            name: variable('initial value'),
          },
        });
        mockRemoteGraph(remoteMuster);
      },
      graph: () =>
        muster({
          remote: proxy([xhrMiddleware({ ...xhrMiddlewareConfig })]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the nested name',
          before() {
            jest.clearAllMocks();
          },
          input: ref('remote', 'nested', 'name'),
          expected: value('initial value'),
          operations: (subscriber) => [
            operation({
              description: 'AND the nested name changes',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(ref('nested', 'name'), 'updated value'));
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
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
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with three nested variables', () => {
    let remoteMuster: Muster;

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
        mockRemoteGraph(remoteMuster);
      },
      graph: () =>
        muster({
          remote: proxy([xhrMiddleware({ ...xhrMiddlewareConfig })]),
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
          operations: (subscriber) => [
            operation({
              description: 'AND the nested1.name1 gets updated',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(set(ref('nested1', 'name1'), 'updated 1'));
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a collection of numbers', () => {
    let remoteMuster: Muster;

    runScenario({
      description: 'AND a fromStreamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          numbers: arrayList([1, 2, 3]),
        });
        mockRemoteGraph(remoteMuster);
      },
      graph: () =>
        muster({
          remote: proxy([xhrMiddleware({ ...xhrMiddlewareConfig })]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the numbers',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'numbers'), entries()),
          expected: value([1, 2, 3]),
          operations: (subscriber) => [
            operation({
              description: 'AND the remote numbers are changed',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(push(ref('numbers'), 4));
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
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
          operations: (subscriber) => [
            operation({
              description: 'AND the remote numbers are changed',
              async before() {
                jest.clearAllMocks();
                await remoteMuster.resolve(push(ref('numbers'), -10));
              },
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with a collection of branches', () => {
    let remoteMuster: Muster;

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
        mockRemoteGraph(remoteMuster);
      },
      graph: () =>
        muster({
          remote: proxy([xhrMiddleware({ ...xhrMiddlewareConfig })]),
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
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph with collection containing collections', () => {
    let remoteMuster: Muster;

    runScenario({
      description: 'AND a fromSteamMiddleware connected to the remote',
      before() {
        remoteMuster = muster({
          numberGroups: arrayList([[1, 2, 3], [-1, -2, -3]]),
        });
        mockRemoteGraph(remoteMuster);
      },
      graph: () =>
        muster({
          remote: proxy([xhrMiddleware({ ...xhrMiddlewareConfig })]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query for a list lists',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('remote', 'numberGroups'), entries(entries())),
          expected: value([[1, 2, 3], [-1, -2, -3]]),
        }),
      ],
    });
  });
});
