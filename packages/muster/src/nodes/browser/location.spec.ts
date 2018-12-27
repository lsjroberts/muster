import * as history from 'history';
import muster, { error, ref, set, value, withErrorPath } from '../..';
import { operation, runScenario } from '../../test';
import { location } from './location';

jest.mock('history', () => {
  const history = {
    listen: jest.fn(),
    location: {
      pathname: '/',
      search: '',
    },
    push: jest.fn((newLocation) => {
      history.location = newLocation;
    }),
    replace: jest.fn((newLocation) => {
      history.location = newLocation;
    }),
  };
  return {
    clear: () => {
      history.location = { pathname: '/', search: '' };
    },
    createBrowserHistory: jest.fn(() => history),
    createHashHistory: jest.fn(() => history),
  };
});

describe('location()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (history as any).clear();
  });

  runScenario({
    description: 'GIVEN a location node created without a hash',
    graph: () =>
      muster({
        url: location(),
      }),
    operations: [
      operation({
        description: 'WHEN a location gets resolved',
        input: ref('url'),
        assert() {
          expect(history.createHashHistory).not.toHaveBeenCalled();
          expect(history.createBrowserHistory).toHaveBeenCalledTimes(1);
          expect(history.createBrowserHistory).toHaveBeenCalledWith({ forceRefresh: false });
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a location node created without a hash',
    graph: () =>
      muster({
        url: location({ hash: 'slash' }),
      }),
    operations: [
      operation({
        description: 'WHEN a location gets resolved',
        input: ref('url'),
        assert() {
          expect(history.createBrowserHistory).not.toHaveBeenCalled();
          expect(history.createHashHistory).toHaveBeenCalledTimes(1);
          expect(history.createHashHistory).toHaveBeenCalledWith({ hashType: 'slash' });
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an url node in a muster graph',
    graph: () =>
      muster({
        url: location(),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the url for the first time',
        input: ref('url'),
        expected: value({
          path: '/',
          params: {},
        }),
        operations: (subscriber) => [
          operation({
            description: 'AND the url gets set',
            before() {
              jest.clearAllMocks();
            },
            input: set('url', {
              path: '/test',
              params: {},
            }),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({
                  path: '/test',
                  params: {},
                }),
              );
            },
            operations: [
              operation({
                description: 'AND the url gets re-requested',
                before() {
                  subscriber().subscription.unsubscribe();
                },
                input: ref('url'),
                expected: value({
                  path: '/test',
                  params: {},
                }),
              }),
            ],
          }),
          operation({
            description: 'AND the url gets set with the data',
            before() {
              jest.clearAllMocks();
            },
            input: set('url', {
              path: '/test',
              params: {
                hello: 'world',
              },
            }),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({
                  path: '/test',
                  params: {
                    hello: 'world',
                  },
                }),
              );
            },
            operations: [
              operation({
                description: 'AND the url gets re-requested',
                before() {
                  subscriber().subscription.unsubscribe();
                },
                input: ref('url'),
                expected: value({
                  path: '/test',
                  params: {
                    hello: 'world',
                  },
                }),
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN requesting path from url',
        input: ref('url', 'path'),
        expected: value('/'),
        operations: (subscriber) => [
          operation({
            description: 'AND the path gets set',
            before() {
              jest.clearAllMocks();
            },
            input: set(['url', 'path'], '/testPath'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('/testPath'));
            },
            operations: [
              operation({
                description: 'AND the path gets re-requested',
                before() {
                  subscriber().subscription.unsubscribe();
                },
                input: ref('url', 'path'),
                expected: value('/testPath'),
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN requesting path from url',
        input: ref('url', 'path'),
        expected: value('/'),
        operations: (subscriber) => [
          operation({
            description: 'AND the URL gets changed',
            before() {
              jest.clearAllMocks();
            },
            input: set('url', {
              path: '/otherTest',
            }),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('/otherTest'));
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN requesting url',
        input: ref('url'),
        expected: value({
          path: '/',
          params: {},
        }),
        operations: (subscriber) => [
          operation({
            description: 'AND the path gets changed',
            before() {
              jest.clearAllMocks();
            },
            input: set(['url', 'path'], '/other'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({
                  path: '/other',
                  params: {},
                }),
              );
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN requesting data from url',
        input: ref('url', 'params'),
        expected: value({}),
        operations: (subscriber) => [
          operation({
            description: 'AND the data get updated',
            before() {
              jest.clearAllMocks();
            },
            input: set(['url', 'params'], value({ hello: 'world' })),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value({ hello: 'world' }));
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN requesting data from url',
        input: ref('url', 'params'),
        expected: value({}),
        operations: (subscriber) => [
          operation({
            description: 'AND the url gets updated',
            before() {
              jest.clearAllMocks();
            },
            input: set('url', {
              path: '/updated',
              params: { test: 'value' },
            }),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value({ test: 'value' }));
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN requesting url',
        input: ref('url'),
        expected: value({
          path: '/',
          params: {},
        }),
        operations: (subscriber) => [
          operation({
            description: 'AND the data get updated',
            before() {
              jest.clearAllMocks();
            },
            input: set(['url', 'params'], {
              test: 'value',
            }),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value({
                  path: '/',
                  params: { test: 'value' },
                }),
              );
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with an url node with JSON encoding',
    graph: () =>
      muster({
        url: location({ encoding: 'json' }),
      }),
    operations: [
      operation({
        description: 'WHEN requesting data from url',
        before() {
          jest.clearAllMocks();
          const h = history.createBrowserHistory() as any;
          h.location = {
            pathname: '/',
            search: '&test=value',
          };
        },
        operations: (subscriber) => [
          operation({
            description: 'AND the url gets updated with non-json params',
            input: ref('url', 'params'),
            expected: withErrorPath(error('Unexpected token v in JSON at position 0'), {
              path: ['url', 'params'],
            }),
          }),
          operation({
            description: 'AND the url gets updated with json params',
            before() {
              const h = history.createBrowserHistory() as any;
              h.location = {
                pathname: '/',
                search: '&test="value"',
              };
            },
            input: ref('url', 'params'),
            expected: value({ test: 'value' }),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an location node with an update flag',
    graph: () =>
      muster({
        url: location({ encoding: 'json', update: true }),
      }),
    operations: [
      operation({
        description: 'WHEN the URL gets changed',
        input: set('url', {
          path: '/update',
        }),
        assert() {
          const h = history.createBrowserHistory() as any;
          expect(h.replace).toHaveBeenCalledTimes(1);
          expect(h.push).not.toHaveBeenCalled();
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph with a location node with Base64 encoding',
    graph: () =>
      muster({
        url: location({ encoding: 'base64' }),
      }),
    operations: [
      operation({
        description: 'When the url gets updated with Base64 params',
        before() {
          const h = history.createBrowserHistory() as any;
          h.location = {
            pathname: '/',
            search: '&test=InRlc3QgdmFsdWUi',
          };
        },
        input: ref('url', 'params'),
        expected: value({ test: 'test value' }),
      }),
    ],
  });
});
