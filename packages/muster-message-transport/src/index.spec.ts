import muster, {
  and,
  applyTransforms,
  array,
  batchRequestsMiddleware,
  entries,
  filter,
  format,
  get,
  getItemsOperation,
  gte,
  lte,
  Muster,
  NodeLike,
  ok,
  proxy,
  query,
  querySet,
  querySetGetChildOperation,
  querySetGetItemsOperation,
  querySetOperation,
  querySetSetOperation,
  ref,
  resolveOperation,
  root,
  sanitize,
  set,
  toString,
  value,
  variable,
} from '@dws/muster';
import { mockFn, operation, runScenario } from '@dws/muster/test';
import times from 'lodash/times';
import {
  DisposeListener,
  Message,
  MessageCallback,
  messageListenerDecorator,
  messageTransportMiddleware,
  MessageTransportMiddlewareNodeDefinition,
  subscribe,
  subscriptionResult,
  unsubscribe,
} from '.';

interface LocalAndRemoteGraphs {
  local: Muster;
  mockLocalMessageCallback: jest.Mock<void>;
  mockRemoteMessageCallback: jest.Mock<void>;
  remote: Muster;
}

function createLocalAndRemoteGraphs(
  remoteGraph: NodeLike,
  localGraphFactory: (middleware: MessageTransportMiddlewareNodeDefinition) => NodeLike,
): LocalAndRemoteGraphs {
  const serverListeners: Array<MessageCallback> = [];
  const clientListeners: Array<MessageCallback> = [];
  const mockLocalMessageCallback = jest.fn<void>((message) => {
    if (clientListeners.length === 0) {
      const errorMessage = 'Could not send the message to the client: clientListener is undefined';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    clientListeners.forEach((listener) => listener(message));
  });
  const mockRemoteMessageCallback = jest.fn<void>((message) => {
    if (serverListeners.length === 0) {
      const errorMessage = 'Could not send the message to the server: serverListener is undefined';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    serverListeners.forEach((listener) => listener(message));
  });
  const remote = messageListenerDecorator(muster(remoteGraph), {
    listen(callback: MessageCallback): DisposeListener {
      serverListeners.push(callback);
      return () => {
        const index = serverListeners.indexOf(callback);
        if (index === -1) {
          console.warn('Tried to remove the remote listener for the second time');
          return;
        }
        serverListeners.splice(index, 1);
      };
    },
    send(message: Message<any>) {
      mockLocalMessageCallback(message);
    },
  }).app;
  const localToRemoteMiddleware = messageTransportMiddleware({
    listen(callback: MessageCallback): DisposeListener {
      clientListeners.push(callback);
      return () => {
        const index = clientListeners.indexOf(callback);
        if (index === -1) {
          console.warn('Tried to remove the client listener for the second time');
          return;
        }
        clientListeners.splice(index, 1);
      };
    },
    send(message: Message<any>) {
      mockRemoteMessageCallback(message);
    },
  });
  const local = muster(localGraphFactory(localToRemoteMiddleware));
  return {
    local,
    mockLocalMessageCallback,
    mockRemoteMessageCallback,
    remote,
  };
}

const RESOLVE_OPERATION = resolveOperation({
  acceptNil: true,
  allowErrors: false,
  allowPending: false,
});

describe('Muster Message Transport', () => {
  describe('GIVEN a remote value node', () => {
    runScenario(() => {
      let localMuster: Muster;
      let mockLocalMessageCallback: jest.Mock<void>;
      let mockRemoteMessageCallback: jest.Mock<void>;
      return {
        description: 'AND a local graph connected to the remote',
        before() {
          const result = createLocalAndRemoteGraphs(
            {
              greeting: 'Hello, server world!',
            },
            (middleware) => ({
              remote: proxy([middleware]),
            }),
          );
          localMuster = result.local;
          mockLocalMessageCallback = result.mockLocalMessageCallback;
          mockRemoteMessageCallback = result.mockRemoteMessageCallback;
        },
        graph: () => localMuster,
        operations: [
          operation({
            description: 'WHEN getting the remote greeting',
            before() {
              jest.clearAllMocks();
            },
            input: ref('remote', 'greeting'),
            expected: value('Hello, server world!'),
            assert() {
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      };
    });
  });

  describe('GIVEN a remote variable node', () => {
    runScenario(() => {
      let localMuster: Muster;
      let remoteMuster: Muster;
      let mockLocalMessageCallback: jest.Mock<void>;
      let mockRemoteMessageCallback: jest.Mock<void>;
      return {
        description: 'AND a local graph connected to the remote',
        before() {
          const result = createLocalAndRemoteGraphs(
            {
              age: variable(1),
              nameAndAge: format('Your age is ${age}', {
                age: toString(ref('age')),
              }),
            },
            (middleware) => ({
              remote: proxy([middleware]),
            }),
          );
          localMuster = result.local;
          remoteMuster = result.remote;
          mockLocalMessageCallback = result.mockLocalMessageCallback;
          mockRemoteMessageCallback = result.mockRemoteMessageCallback;
        },
        graph: () => localMuster,
        operations: [
          operation({
            description: 'WHEN getting the remote greeting',
            before() {
              jest.clearAllMocks();
            },
            input: ref('remote', 'nameAndAge'),
            expected: value('Your age is 1'),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('nameAndAge', [
                        querySetOperation(RESOLVE_OPERATION),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(array([array([value('Your age is 1')])])),
                ),
              );
            },
            operations: (nameAndAgeSubscriber) => [
              operation({
                description: 'AND the age is set from the client',
                before() {
                  jest.clearAllMocks();
                },
                input: set(['remote', 'age'], 2),
                assert() {
                  expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(2);
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    subscribe(
                      expect.any(String),
                      sanitize(
                        querySet(root(), [
                          querySetGetChildOperation('nameAndAge', [
                            querySetOperation(RESOLVE_OPERATION),
                          ]),
                          querySetGetChildOperation('age', [querySetSetOperation(value(2))]),
                        ]),
                      ),
                    ),
                  );
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    unsubscribe(expect.any(String)),
                  );
                  expect(mockLocalMessageCallback).toHaveReturnedTimes(2);
                  expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                    subscriptionResult(
                      expect.any(String),
                      sanitize(array([array([value('Your age is 2')]), array([ok()])])),
                    ),
                  );
                  expect(nameAndAgeSubscriber().next).toHaveBeenCalledTimes(1);
                  expect(nameAndAgeSubscriber().next).toHaveBeenCalledWith(value('Your age is 2'));
                },
              }),
              operation({
                description: 'AND the age is set from the server',
                async before() {
                  jest.clearAllMocks();
                  await remoteMuster.resolve(set('age', 2));
                },
                assert() {
                  expect(mockRemoteMessageCallback).not.toHaveBeenCalled();
                  expect(mockLocalMessageCallback).toHaveReturnedTimes(1);
                  expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                    subscriptionResult(
                      expect.any(String),
                      sanitize(array([array([value('Your age is 2')])])),
                    ),
                  );
                  expect(nameAndAgeSubscriber().next).toHaveBeenCalledTimes(1);
                  expect(nameAndAgeSubscriber().next).toHaveBeenCalledWith(value('Your age is 2'));
                },
              }),
            ],
          }),
        ],
      };
    });
  });

  describe('GIVEN a remote collection of numbers', () => {
    runScenario(() => {
      let localMuster: Muster;
      let mockLocalMessageCallback: jest.Mock<void>;
      let mockRemoteMessageCallback: jest.Mock<void>;
      return {
        description: 'AND a local graph connected to the remote',
        before() {
          const result = createLocalAndRemoteGraphs(
            {
              numbers: [1, 2, 3, 4, 5, 6],
            },
            (middleware) => ({
              remote: proxy([middleware]),
              minNumber: variable(1),
              filteredNumbers: applyTransforms(ref('remote', 'numbers'), [
                filter((number) => gte(number, ref('minNumber'))),
              ]),
            }),
          );
          localMuster = result.local;
          mockLocalMessageCallback = result.mockLocalMessageCallback;
          mockRemoteMessageCallback = result.mockRemoteMessageCallback;
        },
        graph: () => localMuster,
        operations: [
          operation({
            description: 'WHEN getting the remote list of numbers',
            before() {
              jest.clearAllMocks();
            },
            input: query(ref('remote', 'numbers'), entries()),
            expected: value([1, 2, 3, 4, 5, 6]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('numbers', [
                        querySetGetItemsOperation({
                          children: [querySetOperation(RESOLVE_OPERATION)],
                        }),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([value(1)]),
                          array([value(2)]),
                          array([value(3)]),
                          array([value(4)]),
                          array([value(5)]),
                          array([value(6)]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
          }),
          operation({
            description: 'WHEN getting the filtered remote list of numbers',
            before() {
              jest.clearAllMocks();
            },
            input: query(ref('filteredNumbers'), entries()),
            expected: value([1, 2, 3, 4, 5, 6]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('numbers', [
                        querySetGetItemsOperation({
                          operation: getItemsOperation([
                            filter(mockFn((item) => gte(item, value(1)))),
                          ]),
                          children: [querySetOperation(RESOLVE_OPERATION)],
                        }),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([value(1)]),
                          array([value(2)]),
                          array([value(3)]),
                          array([value(4)]),
                          array([value(5)]),
                          array([value(6)]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
            operations: (subscriber) => [
              operation({
                description: 'AND the filter criteria change',
                before() {
                  jest.clearAllMocks();
                },
                input: set('minNumber', 4),
                assert() {
                  expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(2);
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    unsubscribe(expect.any(String)),
                  );
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    subscribe(
                      expect.any(String),
                      sanitize(
                        querySet(root(), [
                          querySetGetChildOperation('numbers', [
                            querySetGetItemsOperation({
                              operation: getItemsOperation([
                                filter(mockFn((item) => gte(item, value(4)))),
                              ]),
                              children: [querySetOperation(RESOLVE_OPERATION)],
                            }),
                          ]),
                        ]),
                      ),
                    ),
                  );
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value([4, 5, 6]));
                },
              }),
            ],
          }),
        ],
      };
    });
  });

  describe('GIVEN a nested remote collection of numbers', () => {
    runScenario(() => {
      let localMuster: Muster;
      let mockLocalMessageCallback: jest.Mock<void>;
      let mockRemoteMessageCallback: jest.Mock<void>;
      return {
        description: 'AND a local graph connected to the remote',
        before() {
          const result = createLocalAndRemoteGraphs(
            {
              nested: {
                numbers: [1, 2, 3, 4, 5, 6],
              },
            },
            (middleware) => ({
              remote: proxy([middleware]),
              minNumber: variable(1),
              filteredNumbers: applyTransforms(ref('remote', 'nested', 'numbers'), [
                filter((number) => gte(number, ref('minNumber'))),
              ]),
            }),
          );
          localMuster = result.local;
          mockLocalMessageCallback = result.mockLocalMessageCallback;
          mockRemoteMessageCallback = result.mockRemoteMessageCallback;
        },
        graph: () => localMuster,
        operations: [
          operation({
            description: 'WHEN getting the nested remote list of numbers',
            before() {
              jest.clearAllMocks();
            },
            input: query(ref('remote', 'nested', 'numbers'), entries()),
            expected: value([1, 2, 3, 4, 5, 6]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('nested', [
                        querySetGetChildOperation('numbers', [
                          querySetGetItemsOperation({
                            children: [querySetOperation(RESOLVE_OPERATION)],
                          }),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([
                            array([value(1)]),
                            array([value(2)]),
                            array([value(3)]),
                            array([value(4)]),
                            array([value(5)]),
                            array([value(6)]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
          }),
          operation({
            description: 'WHEN getting the filtered remote list of numbers',
            before() {
              jest.clearAllMocks();
            },
            input: query(ref('filteredNumbers'), entries()),
            expected: value([1, 2, 3, 4, 5, 6]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('nested', [
                        querySetGetChildOperation('numbers', [
                          querySetGetItemsOperation({
                            operation: getItemsOperation([
                              filter(mockFn((item) => gte(item, value(1)))),
                            ]),
                            children: [querySetOperation(RESOLVE_OPERATION)],
                          }),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([
                            array([value(1)]),
                            array([value(2)]),
                            array([value(3)]),
                            array([value(4)]),
                            array([value(5)]),
                            array([value(6)]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
            operations: (subscriber) => [
              operation({
                description: 'AND the filter criteria change',
                before() {
                  jest.clearAllMocks();
                },
                input: set('minNumber', 4),
                assert() {
                  expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(2);
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    subscribe(
                      expect.any(String),
                      sanitize(
                        querySet(root(), [
                          querySetGetChildOperation('nested', [
                            querySetGetChildOperation('numbers', [
                              querySetGetItemsOperation({
                                operation: getItemsOperation([
                                  filter(mockFn((item) => gte(item, value(4)))),
                                ]),
                                children: [querySetOperation(RESOLVE_OPERATION)],
                              }),
                            ]),
                          ]),
                        ]),
                      ),
                    ),
                  );
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    unsubscribe(expect.any(String)),
                  );
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value([4, 5, 6]));
                },
              }),
            ],
          }),
        ],
      };
    });
  });

  describe('GIVEN a nested remote collection of numbers (with batchRequest)', () => {
    runScenario(() => {
      let localMuster: Muster;
      let mockLocalMessageCallback: jest.Mock<void>;
      let mockRemoteMessageCallback: jest.Mock<void>;
      return {
        description: 'AND a local graph connected to the remote',
        before() {
          const result = createLocalAndRemoteGraphs(
            {
              nested: {
                numbers: [1, 2, 3, 4, 5, 6],
              },
            },
            (middleware) => ({
              remote: proxy([batchRequestsMiddleware(), middleware]),
              minNumber: variable(1),
              filteredNumbers: applyTransforms(ref('remote', 'nested', 'numbers'), [
                filter((number) => gte(number, ref('minNumber'))),
              ]),
            }),
          );
          localMuster = result.local;
          mockLocalMessageCallback = result.mockLocalMessageCallback;
          mockRemoteMessageCallback = result.mockRemoteMessageCallback;
        },
        graph: () => localMuster,
        operations: [
          operation({
            description: 'WHEN getting the filtered remote list of numbers',
            before() {
              jest.clearAllMocks();
            },
            input: query(ref('filteredNumbers'), entries()),
            expected: value([1, 2, 3, 4, 5, 6]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).not.toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('nested', [
                        querySetGetChildOperation('numbers', [
                          querySetGetItemsOperation({
                            operation: getItemsOperation([
                              filter(mockFn((item) => gte(item, value(1)))),
                            ]),
                            children: [querySetOperation(RESOLVE_OPERATION)],
                          }),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([
                            array([value(1)]),
                            array([value(2)]),
                            array([value(3)]),
                            array([value(4)]),
                            array([value(5)]),
                            array([value(6)]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
            operations: (subscriber) => [
              operation({
                description: 'AND the filter criteria change',
                before() {
                  jest.clearAllMocks();
                },
                input: set('minNumber', 4),
                assert() {
                  expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(2);
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    unsubscribe(expect.any(String)),
                  );
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    subscribe(
                      expect.any(String),
                      sanitize(
                        querySet(root(), [
                          querySetGetChildOperation('nested', [
                            querySetGetChildOperation('numbers', [
                              querySetGetItemsOperation({
                                operation: getItemsOperation([
                                  filter(mockFn((item) => gte(item, value(4)))),
                                ]),
                                children: [querySetOperation(RESOLVE_OPERATION)],
                              }),
                            ]),
                          ]),
                        ]),
                      ),
                    ),
                  );
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value([4, 5, 6]));
                },
              }),
            ],
          }),
        ],
      };
    });
  });

  describe('GIVEN a remote collection of items', () => {
    runScenario(() => {
      let localMuster: Muster;
      let mockLocalMessageCallback: jest.Mock<void>;
      let mockRemoteMessageCallback: jest.Mock<void>;
      return {
        description: 'AND a local graph connected to the remote',
        before() {
          const result = createLocalAndRemoteGraphs(
            {
              items: times(5, (index) => ({
                id: index,
                name: `Item ${index}`,
              })),
            },
            (middleware) => ({
              remote: proxy([middleware]),
              minId: variable(0),
              filteredItems: applyTransforms(ref('remote', 'items'), [
                filter((number) => gte(get(number, 'id'), ref('minId'))),
              ]),
            }),
          );
          localMuster = result.local;
          mockLocalMessageCallback = result.mockLocalMessageCallback;
          mockRemoteMessageCallback = result.mockRemoteMessageCallback;
        },
        graph: () => localMuster,
        operations: [
          operation({
            description: 'WHEN getting the remote list of items',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              ref('remote', 'items'),
              entries({
                id: true as true,
                name: true as true,
              }),
            ),
            expected: value([
              { id: 0, name: 'Item 0' },
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
              { id: 3, name: 'Item 3' },
              { id: 4, name: 'Item 4' },
            ]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('items', [
                        querySetGetItemsOperation({
                          children: [
                            querySetGetChildOperation('name', [
                              querySetOperation(RESOLVE_OPERATION),
                            ]),
                            querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                          ],
                        }),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([array([value('Item 0')]), array([value(0)])]),
                          array([array([value('Item 1')]), array([value(1)])]),
                          array([array([value('Item 2')]), array([value(2)])]),
                          array([array([value('Item 3')]), array([value(3)])]),
                          array([array([value('Item 4')]), array([value(4)])]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
          }),
          operation({
            description: 'WHEN getting the filtered remote list of numbers',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              ref('filteredItems'),
              entries({
                id: true as true,
                name: true as true,
              }),
            ),
            expected: value([
              { id: 0, name: 'Item 0' },
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
              { id: 3, name: 'Item 3' },
              { id: 4, name: 'Item 4' },
            ]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('items', [
                        querySetGetItemsOperation({
                          operation: getItemsOperation([
                            filter(mockFn((item) => gte(get(item, 'id'), value(0)))),
                          ]),
                          children: [
                            querySetGetChildOperation('name', [
                              querySetOperation(RESOLVE_OPERATION),
                            ]),
                            querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                          ],
                        }),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([array([value('Item 0')]), array([value(0)])]),
                          array([array([value('Item 1')]), array([value(1)])]),
                          array([array([value('Item 2')]), array([value(2)])]),
                          array([array([value('Item 3')]), array([value(3)])]),
                          array([array([value('Item 4')]), array([value(4)])]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
            operations: (subscriber) => [
              operation({
                description: 'AND the filter criteria change',
                before() {
                  jest.clearAllMocks();
                },
                input: set('minId', 3),
                assert() {
                  expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(2);
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    subscribe(
                      expect.any(String),
                      sanitize(
                        querySet(root(), [
                          querySetGetChildOperation('items', [
                            querySetGetItemsOperation({
                              operation: getItemsOperation([
                                filter(mockFn((item) => gte(get(item, 'id'), value(3)))),
                              ]),
                              children: [
                                querySetGetChildOperation('name', [
                                  querySetOperation(RESOLVE_OPERATION),
                                ]),
                                querySetGetChildOperation('id', [
                                  querySetOperation(RESOLVE_OPERATION),
                                ]),
                              ],
                            }),
                          ]),
                        ]),
                      ),
                    ),
                  );
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    unsubscribe(expect.any(String)),
                  );
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(
                    value([{ id: 3, name: 'Item 3' }, { id: 4, name: 'Item 4' }]),
                  );
                },
              }),
            ],
          }),
        ],
      };
    });
  });

  describe('GIVEN a deeply nested remote collection of items', () => {
    runScenario(() => {
      let localMuster: Muster;
      let mockLocalMessageCallback: jest.Mock<void>;
      let mockRemoteMessageCallback: jest.Mock<void>;
      return {
        description: 'AND a local graph connected to the remote',
        before() {
          const result = createLocalAndRemoteGraphs(
            {
              deeply: {
                nested: {
                  items: times(5, (index) => ({
                    id: index,
                    name: `Item ${index}`,
                  })),
                },
              },
            },
            (middleware) => ({
              remote: proxy([middleware]),
              deeply: {
                nested: {
                  minId: variable(0),
                  maxId: variable(10),
                  filteredItems: applyTransforms(ref('remote', 'deeply', 'nested', 'items'), [
                    filter((number) =>
                      and(
                        gte(get(number, 'id'), ref('deeply', 'nested', 'minId')),
                        lte(get(number, 'id'), ref('deeply', 'nested', 'maxId')),
                      ),
                    ),
                  ]),
                },
              },
            }),
          );
          localMuster = result.local;
          mockLocalMessageCallback = result.mockLocalMessageCallback;
          mockRemoteMessageCallback = result.mockRemoteMessageCallback;
        },
        graph: () => localMuster,
        operations: [
          operation({
            description: 'WHEN getting the filtered remote list of numbers',
            before() {
              jest.clearAllMocks();
            },
            input: query(
              ref('deeply', 'nested', 'filteredItems'),
              entries({
                id: true as true,
                name: true as true,
              }),
            ),
            expected: value([
              { id: 0, name: 'Item 0' },
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
              { id: 3, name: 'Item 3' },
              { id: 4, name: 'Item 4' },
            ]),
            assert() {
              expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                subscribe(
                  expect.any(String),
                  sanitize(
                    querySet(root(), [
                      querySetGetChildOperation('deeply', [
                        querySetGetChildOperation('nested', [
                          querySetGetChildOperation('items', [
                            querySetGetItemsOperation({
                              operation: getItemsOperation([
                                filter(
                                  mockFn((item) =>
                                    and(
                                      gte(get(item, 'id'), value(0)),
                                      lte(get(item, 'id'), value(10)),
                                    ),
                                  ),
                                ),
                              ]),
                              children: [
                                querySetGetChildOperation('name', [
                                  querySetOperation(RESOLVE_OPERATION),
                                ]),
                                querySetGetChildOperation('id', [
                                  querySetOperation(RESOLVE_OPERATION),
                                ]),
                              ],
                            }),
                          ]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
              expect(mockLocalMessageCallback).toHaveBeenCalledTimes(1);
              expect(mockLocalMessageCallback).toHaveBeenCalledWith(
                subscriptionResult(
                  expect.any(String),
                  sanitize(
                    array([
                      array([
                        array([
                          array([
                            array([
                              array([array([value('Item 0')]), array([value(0)])]),
                              array([array([value('Item 1')]), array([value(1)])]),
                              array([array([value('Item 2')]), array([value(2)])]),
                              array([array([value('Item 3')]), array([value(3)])]),
                              array([array([value('Item 4')]), array([value(4)])]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ),
                ),
              );
            },
            operations: (subscriber) => [
              operation({
                description: 'AND the filter criteria change',
                before() {
                  jest.clearAllMocks();
                },
                input: set(ref('deeply', 'nested', 'minId'), 3),
                assert() {
                  expect(mockRemoteMessageCallback).toHaveBeenCalledTimes(2);
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    subscribe(
                      expect.any(String),
                      sanitize(
                        querySet(root(), [
                          querySetGetChildOperation('deeply', [
                            querySetGetChildOperation('nested', [
                              querySetGetChildOperation('items', [
                                querySetGetItemsOperation({
                                  operation: getItemsOperation([
                                    filter(
                                      mockFn((item) =>
                                        and(
                                          gte(get(item, 'id'), value(3)),
                                          lte(get(item, 'id'), value(10)),
                                        ),
                                      ),
                                    ),
                                  ]),
                                  children: [
                                    querySetGetChildOperation('name', [
                                      querySetOperation(RESOLVE_OPERATION),
                                    ]),
                                    querySetGetChildOperation('id', [
                                      querySetOperation(RESOLVE_OPERATION),
                                    ]),
                                  ],
                                }),
                              ]),
                            ]),
                          ]),
                        ]),
                      ),
                    ),
                  );
                  expect(mockRemoteMessageCallback).toHaveBeenCalledWith(
                    unsubscribe(expect.any(String)),
                  );
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(
                    value([{ id: 3, name: 'Item 3' }, { id: 4, name: 'Item 4' }]),
                  );
                },
              }),
            ],
          }),
        ],
      };
    });
  });
});
