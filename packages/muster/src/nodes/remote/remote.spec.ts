import { map, Observable, ObservableLike } from '@dws/muster-observable';
import muster, {
  action,
  applyTransforms,
  array,
  attachMetadata,
  call,
  computed,
  deserialize,
  dispatch,
  entries,
  error,
  ErrorNodeDefinition,
  extend,
  fields,
  filter,
  first,
  FLUSH,
  get,
  getMusterNodeTypesMap,
  getMusterOperationTypesMap,
  GraphWithMetadata,
  handleErrors,
  HttpRequestConfiguration,
  invalidateOn,
  key,
  last,
  length,
  match,
  mockResponseMiddleware,
  Muster,
  nil,
  NodeDefinition,
  nth,
  ok,
  onGlobalEvent,
  query,
  ref,
  root,
  sanitize,
  series,
  set,
  startsWith,
  toNode,
  transformResponseMiddleware,
  types,
  value,
  variable,
  withErrorPath,
} from '../..';
import { operation, runScenario } from '../../test';
import { remote } from './remote';
import * as dhr from './utils/do-http-request';

const mockAttachMetadata = attachMetadata;
const mockDeserialize = deserialize;
const mockGetMusterNodeTypesMap = getMusterNodeTypesMap;
const mockGetMusterOperationTypesMap = getMusterOperationTypesMap;
const mockMap = map;
const mockObservable = Observable;
const mockSanitize = sanitize;

jest.mock('./utils/do-http-request', () => {
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
    assertRemoteRequest(shouldCall: boolean = true) {
      if (shouldCall) {
        expect(mockResolver).toHaveBeenCalled();
      } else {
        expect(mockResolver).not.toHaveBeenCalled();
      }
    },
  };
});

const TEST_INVALIDATE_EVENT = '$$event:test-invalidateOn';
const mockRemoteGraph = (dhr as any).mockRemoteGraph;
const assertRemoteRequest = (dhr as any).assertRemoteRequest;
const mockResponse = (dhr as any).mockResponse;

function nextTick() {
  return Promise.resolve().then(() => Promise.resolve());
}

const MOCK_REMOTE_URL = 'https://example.com/muster';

describe('remote', () => {
  describe('ParsedProps set building phase', () => {
    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        jest.clearAllMocks();
        mockRemoteGraph(
          muster({
            foo: value('remote:foo'),
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a node from the root of the remote branch',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('remote', 'foo'),
          expected: value('remote:foo'),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        mockRemoteGraph(
          muster({
            deeply: {
              nested: {
                value: value('remote:foo'),
              },
            },
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a nested path from the remote branch',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('remote', 'deeply', 'nested', 'value'),
          expected: value('remote:foo'),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        mockRemoteGraph(
          muster({
            users: {
              [match(types.number, 'id')]: value('remote:foo'),
            },
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          currentUserId: value(1),
          currentUser: ref('remote', 'users', ref('currentUserId')),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a ref to the remote branch',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('currentUser'),
          expected: value('remote:foo'),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        mockRemoteGraph(
          muster({
            users: {
              [match(types.string, 'id')]: {
                firstName: value('remote:foo'),
              },
            },
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          currentUser: ref('remote', 'users', 'johndoe@db.com'),
          firstName: ref('currentUser', 'firstName'),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a path built with two refs to the remote node',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('firstName'),
          expected: value('remote:foo'),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote graph containing undefined and atomic values',
      before: () => {
        mockRemoteGraph(
          muster({
            foo: undefined,
            bar: value({ baz: true }),
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a remote path that resolves to undefined',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('remote', 'foo'),
          expected: value(undefined),
          assert: () => {
            assertRemoteRequest();
          },
        }),
        operation({
          description: 'WHEN requesting a remote path that resolves to an atomic value',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('remote', 'bar'),
          expected: value({ baz: true }),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node with custom headers',
      before: () => {
        mockRemoteGraph(
          muster({
            foo: value('remote:foo'),
            bar: value('remote:bar'),
          }),
        );
      },
      graph: () =>
        muster({
          headers: {
            authToken: variable(value('my test auth token')),
          },
          remoteHeaders: computed([ref('headers', 'authToken')], (authToken) =>
            value({ 'X-AUTH-TOKEN': authToken }),
          ),
          remote: remote(MOCK_REMOTE_URL, {
            headers: ref('remoteHeaders'),
            scheduler: onGlobalEvent(FLUSH),
          }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting something from the remote branch',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('remote', 'foo'),
          expected: value('remote:foo'),
          assert: () => {
            assertRemoteRequest(MOCK_REMOTE_URL, {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
              'X-AUTH-TOKEN': 'my test auth token',
            });
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the variable used to generate header has changed',
              before() {
                jest.clearAllMocks();
              },
              input: set(['headers', 'authToken'], 'updated token'),
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
                assertRemoteRequest(false);
              },
              operations: [
                operation({
                  description: 'AND then a second request is made',
                  input: ref('remote', 'bar'),
                  expected: value('remote:bar'),
                  assert() {
                    assertRemoteRequest(MOCK_REMOTE_URL, {
                      Accept: 'application/json, text/plain, */*',
                      'Content-Type': 'application/json',
                      'X-AUTH-TOKEN': 'updated token',
                    });
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node wrapped in invalidateOn',
      before: () => {
        mockRemoteGraph(
          muster({
            foo: value('remote:foo'),
          }),
        );
      },
      graph: () =>
        muster({
          remote: invalidateOn(
            TEST_INVALIDATE_EVENT,
            remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN requesting something out of a remote node',
          before: () => {
            jest.clearAllMocks();
          },
          input: ref('remote', 'foo'),
          expected: value('remote:foo'),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a remote graph containing an action',
      before() {
        mockRemoteGraph(
          muster({
            action: action(() => value('value from server')),
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL),
        }),
      operations: [
        operation({
          description: 'WHEN calling a remote action',
          input: call(['remote', 'action']),
          expected: value('value from server'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote variable (appendName)',
      before: () => {
        mockRemoteGraph(
          muster({
            name: variable('Hello'),
            appendName: action(function*(val) {
              const name = yield ref('name');
              yield set('name', `${name}${val}`);
            }),
          }),
        );
      },
      graph: () =>
        muster({
          proxy: invalidateOn(
            TEST_INVALIDATE_EVENT,
            remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          ),
          name: invalidateOn(TEST_INVALIDATE_EVENT, ref('proxy', 'name')),
        }),
      operations: [
        operation({
          description: 'WHEN the name gets requested',
          input: ref('name'),
          expected: value('Hello'),
          operations: (subscriber) => [
            operation({
              description: 'AND the appendName action gets called',
              before() {
                jest.clearAllMocks();
              },
              input: series([
                call(ref('proxy', 'appendName'), [' world']),
                dispatch({ type: TEST_INVALIDATE_EVENT, payload: undefined }),
              ]),
              expected: ok(),
              async assert() {
                await nextTick();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
              },
              operations: [
                operation({
                  description: 'AND the name gets re-requested',
                  before() {
                    subscriber().subscription.unsubscribe();
                  },
                  input: ref('name'),
                  expected: value('Hello world'),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote variable (appendName with query)',
      before: () => {
        mockRemoteGraph(
          muster({
            name: variable('Hello'),
            appendName: action(function*(val) {
              const name = yield ref('name');
              yield set('name', `${name}${val}`);
            }),
          }),
        );
      },
      graph: () =>
        muster({
          proxy: invalidateOn(
            TEST_INVALIDATE_EVENT,
            remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          ),
          name: ref('proxy', 'name'),
        }),
      operations: [
        operation({
          description: 'WHEN the name gets requested',
          input: query(root(), {
            name: true,
          }),
          expected: value({
            name: 'Hello',
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the appendName action gets called',
              before() {
                jest.clearAllMocks();
              },
              input: series([
                call(ref('proxy', 'appendName'), [' world']),
                dispatch({ type: TEST_INVALIDATE_EVENT, payload: undefined }),
              ]),
              expected: ok(),
              async assert() {
                await nextTick();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
              },
              operations: [
                operation({
                  description: 'AND the name gets re-requested',
                  before() {
                    subscriber().subscription.unsubscribe();
                  },
                  input: query(root(), { name: true }),
                  expected: value({ name: 'Hello world' }),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario({
      description:
        'GIVEN a graph containing a remote collection with data source within a variable',
      before: () => {
        mockRemoteGraph(
          muster({
            itemsArray: variable(array(['first'])),
            items: ref('itemsArray'),
            addItem: action(function*(item) {
              const existingItems = yield query(ref('itemsArray'), entries());
              yield set('itemsArray', array([...existingItems, item]));
            }),
          }),
        );
      },
      graph: () =>
        muster({
          proxy: invalidateOn(
            TEST_INVALIDATE_EVENT,
            remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          ),
          items: ref('proxy', 'items'),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the items for the first time',
          input: query(root(), {
            items: entries(),
          }),
          expected: value({
            items: ['first'],
          }),
          operations: (itemsSubscriber) => [
            operation({
              description: 'AND the new item gets added',
              before() {
                jest.clearAllMocks();
              },
              input: series([
                call(ref('proxy', 'addItem'), ['second']),
                dispatch({ type: TEST_INVALIDATE_EVENT, payload: undefined }),
              ]),
              expected: ok(),
              async assert() {
                await nextTick();
                expect(itemsSubscriber().next).toHaveBeenCalledTimes(1);
              },
              operations: [
                operation({
                  description: 'AND the items subscriber gets re-subscribed',
                  before() {
                    itemsSubscriber().subscription.unsubscribe();
                  },
                  input: query(root(), { items: entries() }),
                  expected: value({
                    items: ['first', 'second'],
                  }),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote collection within variable',
      before: () => {
        mockRemoteGraph(
          muster({
            items: variable(array(['first'])),
            addItem: action(function*(item) {
              const existingItems = yield query(ref('items'), entries());
              yield series([set('items', array([...existingItems, item])), ok()]);
            }),
          }),
        );
      },
      graph: () =>
        muster({
          proxy: invalidateOn(
            TEST_INVALIDATE_EVENT,
            remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          ),
          items: ref('proxy', 'items'),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the items for the first time',
          input: query(root(), {
            items: entries(),
          }),
          expected: value({
            items: ['first'],
          }),
          operations: (itemsSubscriber) => [
            operation({
              description: 'AND the new item gets added',
              before() {
                jest.clearAllMocks();
              },
              input: series([
                call(ref('proxy', 'addItem'), ['second']),
                dispatch({ type: TEST_INVALIDATE_EVENT, payload: undefined }),
              ]),
              expected: ok(),
              async assert() {
                await nextTick();
                expect(itemsSubscriber().next).toHaveBeenCalledTimes(1);
              },
              operations: [
                operation({
                  description: 'AND the items subscriber gets re-subscribed',
                  before() {
                    itemsSubscriber().subscription.unsubscribe();
                  },
                  input: query(root(), { items: entries() }),
                  expected: value({
                    items: ['first', 'second'],
                  }),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote collection node within a variable',
      before: () => {
        mockRemoteGraph(
          muster({
            items: variable(array(['foo', 'bar', 'baz'])),
            addItem: action(function*(item) {
              const existingItems = yield query(ref('items'), entries());
              yield series([set('items', array([...existingItems, item])), ok()]);
            }),
          }),
        );
      },
      graph: () =>
        muster({
          proxy: invalidateOn(
            TEST_INVALIDATE_EVENT,
            remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          ),
          items: ref('proxy', 'items'),
          filteredItems: applyTransforms(ref('items'), [
            filter((item: NodeDefinition) => startsWith('b', item)),
          ]),
          firstItem: get(ref('items'), first()),
          secondItem: get(ref('items'), nth(1)),
          lastItem: get(ref('items'), last()),
          numItems: get(ref('items'), length()),
          numFilteredItems: get(ref('filteredItems'), length()),
        }),
      operations: [
        operation({
          description: 'AND a query requests multiple transformed versions of the collection',
          input: query(root(), {
            items: entries(),
            filteredItems: entries(),
            firstItem: true,
            secondItem: true,
            lastItem: true,
            numItems: true,
            numFilteredItems: true,
          }),
          expected: value({
            items: ['foo', 'bar', 'baz'],
            filteredItems: ['bar', 'baz'],
            firstItem: 'foo',
            secondItem: 'bar',
            lastItem: 'baz',
            numItems: 3,
            numFilteredItems: 2,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the collection is updated',
              before: () => {
                jest.clearAllMocks();
              },
              input: series([
                call(ref('proxy', 'addItem'), [value('qux')]),
                dispatch({ type: TEST_INVALIDATE_EVENT, payload: undefined }),
              ]),
              expected: ok(),
              async assert() {
                await nextTick();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    items: ['foo', 'bar', 'baz', 'qux'],
                    filteredItems: ['bar', 'baz'],
                    firstItem: 'foo',
                    secondItem: 'bar',
                    lastItem: 'qux',
                    numItems: 4,
                    numFilteredItems: 2,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the collection is unsubscribed and retrieved again',
                  before: () => {
                    subscriber().subscription.unsubscribe();
                  },
                  input: query(root(), {
                    items: entries(),
                    filteredItems: entries(),
                    firstItem: true,
                    secondItem: true,
                    lastItem: true,
                    numItems: true,
                    numFilteredItems: true,
                  }),
                  expected: value({
                    items: ['foo', 'bar', 'baz', 'qux'],
                    filteredItems: ['bar', 'baz'],
                    firstItem: 'foo',
                    secondItem: 'bar',
                    lastItem: 'qux',
                    numItems: 4,
                    numFilteredItems: 2,
                  }),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote variable',
      before: () => {
        mockRemoteGraph(
          muster({
            currentValue: variable('foo'),
            updateValue: action(function*(newValue) {
              yield set('currentValue', newValue);
            }),
          }),
        );
      },
      graph: () =>
        muster({
          proxy: invalidateOn(
            TEST_INVALIDATE_EVENT,
            remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
          ),
          currentValue: ref('proxy', 'currentValue'),
        }),
      operations: [
        operation({
          description: 'AND current value of the remote variable is requested via a query',
          input: query(root(), {
            currentValue: true,
          }),
          expected: value({
            currentValue: 'foo',
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the variable is updated',
              before: () => {
                jest.clearAllMocks();
              },
              input: series([
                call(ref('proxy', 'updateValue'), [value('bar')]),
                dispatch({ type: TEST_INVALIDATE_EVENT, payload: undefined }),
              ]),
              expected: ok(),
              async assert() {
                await nextTick();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    currentValue: 'bar',
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the variable is unsubscribed and retrieved again',
                  before: () => {
                    subscriber().subscription.unsubscribe();
                  },
                  input: query(root(), {
                    currentValue: true,
                  }),
                  expected: value({
                    currentValue: 'bar',
                  }),
                }),
              ],
            }),
          ],
        }),
        operation({
          description: 'AND current value of the remote variable is requested via a ref',
          input: ref('currentValue'),
          expected: value('foo'),
          operations: (subscriber) => [
            operation({
              description: 'AND the variable is updated',
              before: () => {
                jest.clearAllMocks();
              },
              input: series([
                call(ref('proxy', 'updateValue'), [value('bar')]),
                dispatch({ type: TEST_INVALIDATE_EVENT, payload: undefined }),
              ]),
              expected: ok(),
              async assert() {
                await nextTick();
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('bar'));
              },
              operations: [
                operation({
                  description: 'AND the variable is unsubscribed and retrieved again',
                  before: () => {
                    subscriber().subscription.unsubscribe();
                  },
                  input: ref('currentValue'),
                  expected: value('bar'),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        mockRemoteGraph(
          muster({
            nested: {
              field1: value('remote:foo1'),
              field2: value('remote:foo2'),
            },
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a query that requests two paths from the same branch',
          before: () => {
            jest.clearAllMocks();
          },
          input: query(
            root(),
            fields({
              remote: key('remote', {
                nested1: key('nested', { field1: key('field1') }),
                nested2: key('nested', { field2: key('field2') }),
              }),
            }),
          ),
          expected: value({
            remote: {
              nested1: {
                field1: 'remote:foo1',
              },
              nested2: {
                field2: 'remote:foo2',
              },
            },
          }),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        mockRemoteGraph(
          muster({
            nested: {
              field1: value('remote:foo1'),
              field2: value('remote:foo2'),
            },
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a nested path',
          before: () => {
            jest.clearAllMocks();
          },
          input: query(
            root(),
            fields({
              remote: key('remote', {
                nested: key('nested', {
                  field1: key('field1'),
                  field2: key('field2'),
                }),
              }),
            }),
          ),
          expected: value({
            remote: {
              nested: {
                field1: 'remote:foo1',
                field2: 'remote:foo2',
              },
            },
          }),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        mockRemoteGraph(
          muster({
            nested: {
              myCollection: [
                { firstName: 'remote:foo1', lastName: 'remote:bar1' },
                { firstName: 'remote:foo2', lastName: 'remote:bar2' },
                { firstName: 'remote:foo3', lastName: 'remote:bar3' },
              ],
            },
          }),
        );
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a collection with fragments',
          before: () => {
            jest.clearAllMocks();
          },
          input: query(
            root(),
            fields({
              remote: key('remote', {
                nested: key('nested', {
                  myCollection: key(
                    'myCollection',
                    entries({
                      firstName: key('firstName'),
                      lastName: key('lastName'),
                    }),
                  ),
                }),
              }),
            }),
          ),
          expected: value({
            remote: {
              nested: {
                myCollection: [
                  { firstName: 'remote:foo1', lastName: 'remote:bar1' },
                  { firstName: 'remote:foo2', lastName: 'remote:bar2' },
                  { firstName: 'remote:foo3', lastName: 'remote:bar3' },
                ],
              },
            },
          }),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a remote node',
      before: () => {
        mockRemoteGraph(muster(nil()));
      },
      graph: () =>
        muster({
          remote: remote(MOCK_REMOTE_URL, { scheduler: onGlobalEvent(FLUSH) }),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a query that triggers a network error',
          before: () => {
            jest.clearAllMocks();
            mockResponse(error('Network error'));
          },
          input: ref('remote', '$$NETWORK_ERROR$$'),
          expected: withErrorPath(error({ message: 'Network error', stack: expect.anything() }), {
            path: ['remote', '$$NETWORK_ERROR$$'],
          }),
          assert: () => {
            assertRemoteRequest();
          },
        }),
        operation({
          description: 'WHEN requesting a query that triggers a server error',
          before: () => {
            jest.clearAllMocks();
            mockResponse(error('SERVER ERROR', { data: { url: MOCK_REMOTE_URL, status: 500 } }));
          },
          input: ref('remote', '$$SERVER_ERROR$$'),
          expected: withErrorPath(
            error(
              { message: 'SERVER ERROR', stack: expect.anything() },
              { data: { url: MOCK_REMOTE_URL, status: 500 } },
            ),
            { path: ['remote', '$$SERVER_ERROR$$'] },
          ),
          assert: () => {
            assertRemoteRequest();
          },
        }),
        operation({
          description: 'WHEN requesting a query that returns a non-JSON response',
          before: () => {
            jest.clearAllMocks();
            mockResponse(error('foo', { data: { url: MOCK_REMOTE_URL, status: 200 } }));
          },
          input: ref('remote', '$$INVALID_RESPONSE_FORMAT$$'),
          expected: withErrorPath(
            error(
              { message: 'foo', stack: expect.anything() },
              { data: { url: MOCK_REMOTE_URL, status: 200 } },
            ),
            { path: ['remote', '$$INVALID_RESPONSE_FORMAT$$'] },
          ),
          assert: () => {
            assertRemoteRequest();
          },
        }),
      ],
    });

    runScenario(() => {
      let errorCallback: jest.Mock<NodeDefinition>;
      return {
        description: 'GIVEN a graph containing a remote node that remaps error messages',
        before: () => {
          errorCallback = jest.fn<NodeDefinition>((e: ErrorNodeDefinition) =>
            error(`ERROR: ${e.properties.error.message}`),
          );
          mockRemoteGraph(
            muster({
              error: error('error:foo'),
            }),
          );
        },
        graph: () =>
          muster({
            remote: remote(MOCK_REMOTE_URL, {
              middleware: [transformResponseMiddleware(handleErrors(errorCallback))],
              scheduler: onGlobalEvent(FLUSH),
            }),
          }),
        operations: [
          operation({
            description: 'WHEN requesting a query that triggers a server error',
            before: () => {
              jest.clearAllMocks();
              mockResponse(error('SERVER ERROR'));
            },
            input: ref('remote', '$$SERVER_ERROR$$'),
            expected: withErrorPath(error('ERROR: SERVER ERROR'), {
              path: ['remote', '$$SERVER_ERROR$$'],
            }),
            assert: () => {
              assertRemoteRequest();
            },
          }),
          operation({
            description: 'WHEN requesting a query that resolves to a Muster error',
            before: () => {
              jest.clearAllMocks();
              mockResponse(error('error:foo'));
            },
            input: ref('remote', 'error'),
            expected: withErrorPath(error('ERROR: error:foo'), { path: ['remote', 'error'] }),
            assert: () => {
              assertRemoteRequest();
            },
          }),
        ],
      };
    });

    runScenario(() => {
      let errorCallback: jest.Mock<NodeDefinition>;
      return {
        description: 'GIVEN a graph containing a remote node that computes error messages',
        before: () => {
          errorCallback = jest.fn<NodeDefinition>((e: ErrorNodeDefinition) =>
            computed(['ERROR', e.properties.error.message], (prefix: string, message: string) =>
              error(`${prefix}: ${message}`),
            ),
          );
          mockRemoteGraph(
            muster({
              error: error('error:foo'),
            }),
          );
        },
        graph: () =>
          muster({
            remote: remote(MOCK_REMOTE_URL, {
              middleware: [transformResponseMiddleware(handleErrors(errorCallback))],
              scheduler: onGlobalEvent(FLUSH),
            }),
          }),
        operations: [
          operation({
            description: 'WHEN requesting a query that triggers a server error',
            before: () => {
              jest.clearAllMocks();
              mockResponse(error('SERVER ERROR'));
            },
            input: ref('remote', '$$SERVER_ERROR$$'),
            expected: withErrorPath(error('ERROR: SERVER ERROR'), {
              path: ['remote', '$$SERVER_ERROR$$'],
            }),
            assert: () => {
              assertRemoteRequest();
            },
          }),
          operation({
            description: 'WHEN requesting a query that resolves to a Muster error',
            before: () => {
              jest.clearAllMocks();
            },
            input: ref('remote', 'error'),
            expected: withErrorPath(error('ERROR: error:foo'), { path: ['remote', 'error'] }),
            assert: () => {
              assertRemoteRequest();
            },
          }),
        ],
      };
    });
  });

  runScenario({
    description:
      'GIVEN a remote graph containing a collection of collections with inner resolving to nil',
    before() {
      mockRemoteGraph(
        muster({
          users: [
            toNode(
              {
                userId: 1,
              },
              { catchAll: true },
            ),
          ],
          greeting: 'Hello world',
        }),
      );
    },
    graph: () =>
      muster({
        remote: remote('http://test.url', {
          scheduler: onGlobalEvent(FLUSH),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the query is made to a remote collection',
        input: query(root(), {
          remote: key('remote', {
            users: key(
              'users',
              entries({
                userId: key('userId'),
                items: key(
                  'items',
                  entries({
                    name: key('name'),
                  }),
                ),
              }),
            ),
          }),
        }),
        expected: value({
          remote: {
            users: [
              {
                userId: 1,
                items: [],
              },
            ],
          },
        }),
        operations: [
          operation({
            description: 'AND then the greeting is requested',
            input: ref('remote', 'greeting'),
            expected: value('Hello world'),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a remote node with middleware that overrides request with error',
    before() {
      jest.clearAllMocks();
      mockRemoteGraph(muster({}));
    },
    graph: () =>
      muster({
        remote: remote('http://test.url', {
          middleware: [mockResponseMiddleware(() => error('Test error'))],
          scheduler: onGlobalEvent(FLUSH),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the request gets made to the remote node',
        input: ref('remote', 'test', 'path'),
        expected: withErrorPath(error('Test error'), { path: ['remote', 'test', 'path'] }),
        assert() {
          assertRemoteRequest(false);
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a remote node with middleware that throws an error',
    before() {
      jest.clearAllMocks();
      mockRemoteGraph(muster({}));
    },
    graph: () =>
      muster({
        remote: remote('http://test.url', {
          middleware: [
            mockResponseMiddleware(() => {
              throw new Error('Boom!');
            }),
          ],
          scheduler: onGlobalEvent(FLUSH),
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the request gets made to the remote node',
        input: ref('remote', 'test', 'path'),
        expected: withErrorPath(error('Boom!'), { path: ['remote', 'test', 'path'] }),
        assert() {
          assertRemoteRequest(false);
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a remote node containing a collection with refs',
    before() {
      mockRemoteGraph(
        muster({
          globalName: 'test name',
          items: [{ name: ref('globalName') }],
        }),
      );
    },
    graph: () =>
      muster({
        remote: remote('http://test.url'),
      }),
    operations: [
      operation({
        description: 'WHEN the items list is requested',
        input: query(root(), {
          remote: key('remote', {
            items: key(
              'items',
              entries({
                name: key('name'),
              }),
            ),
          }),
        }),
        expected: value({
          remote: {
            items: [{ name: 'test name' }],
          },
        }),
      }),
    ],
  });

  runScenario({
    description:
      'GIVEN a remote node containing a collection with refs ' +
      'and the local graph with the `extend` node',
    before() {
      mockRemoteGraph(
        muster({
          globalName: 'test name',
          items: [{ name: ref('globalName') }],
        }),
      );
    },
    graph: () =>
      muster(
        extend(
          {
            remote: remote('http://test.url'),
          },
          {
            other: 'name',
          },
        ),
      ),
    operations: [
      operation({
        description: 'WHEN the list is requested',
        input: query(root(), {
          remote: key('remote', {
            items: key(
              'items',
              entries({
                name: key('name'),
              }),
            ),
          }),
        }),
        expected: value({
          remote: {
            items: [{ name: 'test name' }],
          },
        }),
      }),
    ],
  });
});
