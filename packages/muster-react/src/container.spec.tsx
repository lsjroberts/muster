import muster, {
  action,
  applyTransforms,
  array,
  arrayList,
  attachMetadata,
  batchRequestsMiddleware,
  call,
  computed,
  context,
  deserialize,
  dispatch,
  error,
  ErrorNodeDefinition,
  extend,
  filter,
  FLUSH,
  formatError,
  fromPromise,
  fromStream,
  fromStreamMiddleware,
  get,
  getChildOperation,
  getItemsOperation,
  getMusterNodeTypesMap,
  getMusterOperationTypesMap,
  GraphWithMetadata,
  gte,
  handleErrors,
  HttpRequestConfiguration,
  ifPending,
  map,
  match,
  Muster,
  nil,
  NodeDefinition,
  on,
  onGlobalEvent,
  param,
  pending,
  proxy,
  push,
  querySet,
  querySetGetChildOperation,
  querySetGetItemsOperation,
  querySetOperation,
  ref,
  relative,
  remote,
  resolveOperation,
  root,
  sanitize,
  scope,
  set,
  toNode,
  transformResponseMiddleware,
  types,
  value,
  variable,
  withErrorPath,
} from '@dws/muster';
import {
  BehaviorSubject,
  map as mapStream,
  Observable,
  ObservableLike,
  Subject,
} from '@dws/muster-observable';
import { mockFn } from '@dws/muster/test';
import { mount } from 'enzyme';
import * as React from 'react';
import { global, injected, propTypes, Provider, renderPlatformErrors } from './';
import { container } from './container';
import { ContainerComponent, RenderErrorCallback, RenderLoadingCallback } from './container-types';
import { asyncValue, operation, runScenario } from './test';

jest.mock('./utils/render-platform-errors', () => {
  const React = require('react');
  return { renderPlatformErrors: jest.fn(() => <div />) };
});

function nextRender() {
  jest.runAllTimers();
  return Promise.resolve(null).then(() => Promise.resolve(null));
}

const mockAttachMetadata = attachMetadata;
const mockDeserialize = deserialize;
const mockGetMusterNodeTypesMap = getMusterNodeTypesMap;
const mockGetMusterOperationTypesMap = getMusterOperationTypesMap;
const mockMap = mapStream;
const mockObservable = Observable;
const mockSanitize = sanitize;

function withFakeConsole<T>(func: () => T): () => T {
  return () => {
    const error = console.error;
    console.error = jest.fn();
    const result = func();
    console.error = error;
    return result;
  };
}

jest.mock('@dws/muster/dist/nodes/remote/utils/do-http-request', () => {
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

const m = require('@dws/muster/dist/nodes/remote/utils/do-http-request');
const mockResponse = m.mockResponse;
const mockRemoteGraph = m.mockRemoteGraph;

const RESOLVE_OPERATION = resolveOperation({
  acceptNil: true,
  allowErrors: false,
  allowPending: false,
});

describe('container', () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('WHEN container is rendered without a valid provider', () => {
    it('SHOULD throw an error', () => {
      const testContainer = container({
        graph: {
          name: 'Hello world',
        },
        props: {
          name: true,
        },
      });
      const mockRender = jest.fn(() => null);
      const TestComponent = testContainer(mockRender);
      expect(
        withFakeConsole(() => {
          mount(<TestComponent />);
        }),
      ).toThrowError(
        [
          `A muster-react component "mockConstructor" must be wrapped in a Provider with a valid Muster instance:`,
          '  <Provider muster={<<valid_muster_instance>>}>',
          `    <mockConstructor ... />`,
          '  </Provider>',
        ].join('\n'),
      );
    });
  });

  describe('WHEN muster returns a global error', () => {
    let app: Muster;
    let Container: ContainerComponent;
    let mockRender: React.StatelessComponent;

    beforeEach(() => {
      app = Object.assign(muster(value(undefined)), {
        resolve: jest.fn(() => Observable.of(error('test error'))),
      });

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);
    });

    describe('AND the `renderError` method is defined', () => {
      let renderError: RenderErrorCallback;

      beforeEach(() => {
        renderError = jest.fn(() => <div />);
        Container = container({
          graph: {
            prop: ref(global('prop')),
          },
          props: {
            prop: types.any,
          },
          renderError,
        })(mockRender);
      });

      it('SHOULD call `renderError`', () => {
        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );

        expect(mockRender).not.toHaveBeenCalled();
        expect(renderPlatformErrors).not.toHaveBeenCalled();
        expect(renderError).toHaveBeenCalledWith([new Error('test error')], {});
      });
    });
  });

  describe('WHEN the query returns an error', () => {
    let app: Muster;
    let Container: ContainerComponent;
    let mockRender: React.StatelessComponent;

    beforeEach(() => {
      app = muster({
        data: {
          testValue: 'Hello world',
          testError: error('test error'),
        },
      });

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);
    });

    describe('AND the `renderError` method is defined', () => {
      let renderError: RenderErrorCallback<{}>;
      beforeEach(() => {
        renderError = jest.fn(() => <div />);
        Container = container({
          graph: ref(global('data')),
          props: {
            testValue: types.any,
            testError: types.any,
          },
          renderError,
        })(mockRender);
      });

      it('SHOULD call `renderError` method', () => {
        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );

        expect(mockRender).not.toHaveBeenCalled();
        expect(renderPlatformErrors).not.toHaveBeenCalled();
        const expectedError = new Error(['test error', 'Path: ["data","testError"]'].join('\n\n'));
        expect(renderError).toHaveBeenCalledWith([expectedError], {});
      });
    });
  });

  describe("WHEN the query returns an error for a leaf's dependency", () => {
    let app: Muster;
    let Container: ContainerComponent;
    let mockRender: React.StatelessComponent;

    beforeEach(() => {
      const remoteInstance = muster({
        someBranch: error('test error'),
      });

      app = muster({
        data: {
          proxy: proxy([fromStreamMiddleware((val) => remoteInstance.resolve(val, { raw: true }))]),
          something: ref('data', 'proxy', 'someBranch'),
        },
      });

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);
    });

    describe('AND the `renderError` method is defined', () => {
      let renderError: RenderErrorCallback<{}>;
      beforeEach(() => {
        renderError = jest.fn(() => <div />);
        Container = container({
          graph: ref(global('data')),
          props: {
            something: {
              nested: types.any,
            },
          },
          renderError,
        })(mockRender);

        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );
      });

      it('SHOULD call `renderError` method', async () => {
        const expectedError = new Error(
          ['test error', `Path: ${JSON.stringify(['data', 'proxy', 'someBranch', 'nested'])}`].join(
            '\n\n',
          ),
        );
        expect(renderError).toHaveBeenCalledWith([expectedError], {});
      });
    });
  });

  describe('WHEN the query is not ready', () => {
    describe('AND `renderLoading` is defined', () => {
      let app: Muster;
      let mockRender: jest.Mock<React.StatelessComponent>;
      let mockRenderLoading: jest.Mock<RenderLoadingCallback>;
      let Container: ContainerComponent;

      beforeEach(() => {
        app = muster(value('nothing'));
        mockRenderLoading = jest.fn<RenderLoadingCallback>(() => <div />);
        mockRender = jest.fn<React.StatelessComponent>(() => <div />);
        Container = container({
          graph: {
            test: asyncValue('test value'),
          },
          props: {
            test: types.string,
          },
          renderLoading: mockRenderLoading,
        })(mockRender);
      });

      it('SHOULD call `renderLoading` with correct args', async () => {
        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );

        expect(mockRender).not.toHaveBeenCalled();
        expect(mockRenderLoading).toHaveBeenCalled();

        mockRender.mockClear();
        mockRenderLoading.mockClear();

        await nextRender();

        expect(mockRender).toHaveBeenCalled();
        expect(mockRenderLoading).not.toHaveBeenCalled();
      });
    });
  });

  describe('WHEN creating a container with empty props', () => {
    let app: Muster;
    let mockRender: React.StatelessComponent;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster({
        simple: value('simple test value'),
      });

      mockRender = jest.fn<JSX.Element>(() => <div />);

      Container = container({
        graph: {
          first: value('first value'),
          second: value(2),
          third: value([1, 2, 3]),
        },
        props: {},
      })(mockRender);
    });

    it('SHOULD render the component with correct data', () => {
      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );

      expect(mockRender).toHaveBeenCalledWith({}, {});
    });
  });

  describe('WHEN creating a container with a simple local graph', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster({
        simple: value('simple test value'),
      });

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);

      Container = container({
        graph: {
          first: value('first value'),
          second: value(2),
          third: value([1, 2, 3]),
        },
        props: {
          first: true,
          second: types.number,
          third: types.arrayOf(types.number),
        },
      })(mockRender);
    });

    it('SHOULD render the component with a correct data', () => {
      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );

      expect(mockRender).toHaveBeenCalledWith(
        {
          first: 'first value',
          second: 2,
          third: [1, 2, 3],
        },
        {},
      );
    });
  });

  describe('WHEN the container requires injected props but none are passed', () => {
    let app: Muster;
    let mockRender: jest.Mock<JSX.Element>;
    let mockRenderError: jest.Mock;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster(nil());

      mockRender = jest.fn<JSX.Element>(() => <div />);
      mockRenderError = jest.fn(() => null);

      Container = container({
        require: {
          prop1: types.string,
        },
        props: propTypes.injected(),
        renderError: mockRenderError,
      })(mockRender);
    });

    it('SHOULD throw error', () => {
      expect(
        withFakeConsole(() => {
          mount(
            <Provider muster={app}>
              <Container />
            </Provider>,
          );
        }),
      ).toThrowError(
        'Component "mockConstructor" is declaring injected props but none were injected from the parent container',
      );
    });
  });

  describe('WHEN creating a container with a ref to the global graph', () => {
    let app: Muster;
    let mockRender: jest.Mock<JSX.Element>;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster({
        simple: value('simple test value'),
      });

      mockRender = jest.fn<JSX.Element>(() => <div />);

      Container = container({
        graph: {
          pullRefFromGraph: ref(global('simple')),
        },
        props: {
          pullRefFromGraph: types.string,
        },
      })(mockRender);
    });

    it('SHOULD render the component with a correct data', () => {
      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );

      expect(mockRender).toHaveBeenCalledWith(
        {
          pullRefFromGraph: 'simple test value',
        },
        {},
      );
    });
  });

  describe('WHEN creating a container with a ref to the local graph', () => {
    let app: Muster;
    let mockRender: jest.Mock<JSX.Element>;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster(value('no-one cares'));

      mockRender = jest.fn<JSX.Element>(() => <div />);

      Container = container({
        graph: {
          testValue: value('test value'),
          refToTestValue: ref('testValue'),
        },
        props: {
          refToTestValue: types.string,
        },
      })(mockRender);
    });

    it('SHOULD render the component with a correct data', () => {
      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );

      expect(mockRender).toHaveBeenCalledWith(
        {
          refToTestValue: 'test value',
        },
        {},
      );
    });
  });

  describe('WHEN creating a container which requests async data with sets and calls', () => {
    let app: Muster;
    let mockRender: jest.Mock<{}> & React.StatelessComponent;
    let Container: ContainerComponent;
    let resolveAsync: (value: NodeDefinition) => void;

    beforeEach(() => {
      app = muster(nil());

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);

      Container = container({
        graph: {
          testAction: action(() => {}),
          asyncValue: fromPromise(
            () =>
              new Promise((resolve) => {
                resolveAsync = resolve;
              }),
          ),
          testValue: variable(value('test value')),
        },
        props: {
          asyncValue: types.string,
          testValue: types.string,
          caller: propTypes.caller('testAction'),
          setter: propTypes.setter('testValue', types.string),
        },
        renderLoading: true,
      })(mockRender);

      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );
    });

    it('SHOULD render the component with the correct initial data', () => {
      expect(mockRender).toHaveBeenCalledTimes(2);
      expect(mockRender).toHaveBeenLastCalledWith(
        {
          caller: expect.any(Function),
          setter: expect.any(Function),
        },
        {},
      );
    });

    it('SHOULD render the component with correct data after the promise gets resolved', async () => {
      mockRender.mockClear();
      resolveAsync(value('async value'));

      await nextRender();

      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(mockRender).toHaveBeenCalledWith(
        {
          asyncValue: 'async value',
          testValue: 'test value',
          caller: expect.any(Function),
          setter: expect.any(Function),
        },
        {},
      );
    });
  });

  describe('WHEN creating a container with a ref to the local graph that may change', () => {
    let app: Muster;
    let mockRender: jest.Mock<{}> & React.StatelessComponent;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster(value('no-one cares'));

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);

      Container = container({
        graph: {
          testValue: variable(value('test value')),
          refToTestValue: ref('testValue'),
        },
        props: {
          testValue: types.string,
          refToTestValue: types.string,
          setter: propTypes.setter('testValue', types.string),
        },
      })(mockRender);

      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );
    });

    it('SHOULD render the component with the correct data', () => {
      expect(mockRender).toHaveBeenCalledWith(
        {
          testValue: 'test value',
          refToTestValue: 'test value',
          setter: expect.any(Function),
        },
        {},
      );
    });

    describe('AND the data is updated', () => {
      beforeEach(async () => {
        const setter: Function = mockRender.mock.calls[0][0].setter;
        jest.clearAllMocks();
        await setter('another value');
      });

      it('SHOULD re-render the component with the correct data', () => {
        expect(mockRender).toHaveBeenCalledWith(
          {
            testValue: 'another value',
            refToTestValue: 'another value',
            setter: expect.any(Function),
          },
          {},
        );
      });
    });
  });

  describe('WHEN creating a container which does not relay events from the parent scope', () => {
    let app: Muster;
    let mockRender: jest.Mock<JSX.Element>;
    let Container: ContainerComponent;
    const EVENT_FOO = '$$event:foo';

    beforeEach(() => {
      app = muster({
        simple: value('simple test value'),
      });

      mockRender = jest.fn<JSX.Element>(() => <div />);

      Container = container({
        graph: {
          lastEvent: on(
            (event) => (event.type === EVENT_FOO ? value(event.payload) : undefined),
            value(undefined),
          ),
        },
        props: {
          lastEvent: types.any,
        },
      })(mockRender);
    });

    it('SHOULD render the component with a correct data', () => {
      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );

      expect(mockRender).toHaveBeenCalledWith(
        {
          lastEvent: undefined,
        },
        {},
      );
    });

    describe('AND an event is emitted', () => {
      beforeEach(async () => {
        jest.clearAllMocks();
        await app.resolve(dispatch({ type: EVENT_FOO, payload: undefined }));
      });

      it('SHOULD NOT respond to the event', () => {
        expect(mockRender).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('WHEN creating a container which does not relay events from the parent scope', () => {
    let app: Muster;
    let mockRender: jest.Mock<JSX.Element>;
    let Container: ContainerComponent;
    const EVENT_FOO = '$$event:foo';
    const EVENT_BAR = '$$event:bar';

    beforeEach(() => {
      app = muster({
        simple: value('simple test value'),
      });

      mockRender = jest.fn<JSX.Element>(() => <div />);

      Container = container({
        graph: {
          lastEvent: on(
            (event) => (event.type === EVENT_FOO ? value(event.payload) : undefined),
            value(undefined),
          ),
        },
        props: {
          lastEvent: types.any,
        },
        events(event: any) {
          return event.type === EVENT_FOO ? event : undefined;
        },
      })(mockRender);
    });

    it('SHOULD render the component with a correct data', () => {
      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );

      expect(mockRender).toHaveBeenCalledWith(
        {
          lastEvent: undefined,
        },
        {},
      );
    });

    describe('AND the component is mounted', () => {
      beforeEach(() => {
        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );
      });

      describe('AND a relayed event is emitted', () => {
        beforeEach(async () => {
          jest.clearAllMocks();
          await app.resolve(dispatch({ type: EVENT_FOO, payload: 'foo' }));
        });

        it('SHOULD respond to the event', () => {
          expect(mockRender).toHaveBeenCalledTimes(1);
          expect(mockRender).toHaveBeenCalledWith(
            {
              lastEvent: 'foo',
            },
            {},
          );
        });
      });

      describe('AND an irrelevant event is emitted', () => {
        beforeEach(async () => {
          jest.clearAllMocks();
          await app.resolve(dispatch({ type: EVENT_BAR, payload: undefined }));
        });

        it('SHOULD NOT respond to the event', () => {
          expect(mockRender).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('WHEN creating a container requesting nested data from a local graph', () => {
    let app: Muster;
    let mockRender: jest.Mock<JSX.Element>;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster(value('no-one cares'));

      mockRender = jest.fn<JSX.Element>(() => <div />);

      Container = container({
        graph: {
          deeply: {
            nested: {
              value: value('deeply nested value'),
            },
          },
        },
        props: {
          deeply: {
            nested: {
              value: types.string,
            },
          },
        },
      })(mockRender);
    });

    it('SHOULD render the component with a correct data', () => {
      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );

      expect(mockRender).toHaveBeenCalledWith(
        {
          deeply: {
            nested: {
              value: 'deeply nested value',
            },
          },
        },
        {},
      );
    });
  });

  describe('WHEN creating a container requiring data from the parent container through the graph', () => {
    let app: Muster;
    let mockRender: jest.Mock<JSX.Element>;
    let Container: ContainerComponent;
    let ParentContainer: ContainerComponent;

    beforeEach(() => {
      app = muster(nil());

      mockRender = jest.fn<JSX.Element>(() => null);

      Container = container({
        require: {
          foo: types.string,
        },
        graph: {
          myFoo: injected('foo'),
        },
        props: {
          myFoo: types.any,
        },
      })(mockRender);

      ParentContainer = container({
        graph: {
          foo: 'test value',
        },
        props: {
          ...Container.getRequirements(),
        },
      })((props) => <Container {...Container.inject(props)} />);

      mount(
        <Provider muster={app}>
          <ParentContainer />
        </Provider>,
      );
    });

    it('SHOULD render the component with the correct data', () => {
      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(mockRender).toHaveBeenCalledWith(
        {
          myFoo: 'test value',
        },
        {},
      );
    });
  });

  describe('WHEN requesting data with $get, $set and $call', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;
    let mockAction: jest.Mock<any>;

    beforeEach(() => {
      app = muster(value('no-one cares'));

      mockAction = jest.fn();

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);

      Container = container({
        graph: {
          myValue: variable(value('initial value')),
          someAction: action((arg) => {
            mockAction(arg);
            return value(arg);
          }),
          emptyAction: action(() => value(undefined)),
        },
        props: {
          myValue: propTypes.getter(types.any),
          setMyValue: propTypes.setter('myValue', types.any),
          someAction: propTypes.caller(),
          callSomeAction: propTypes.caller('someAction'),
          callEmptyAction: propTypes.caller('emptyAction'),
        },
      })(mockRender);

      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );
    });

    it('SHOULD render component with a correct state', () => {
      expect(mockRender).toHaveBeenCalledWith(
        {
          myValue: 'initial value',
          setMyValue: expect.any(Function),
          someAction: expect.any(Function),
          callSomeAction: expect.any(Function),
          callEmptyAction: expect.any(Function),
        },
        {},
      );
    });

    describe('AND setting the myValue through the setter', () => {
      it('SHOULD re-render component with correct state', async () => {
        const setMyValue = mockRender.mock.calls[0][0].setMyValue;
        mockRender.mockClear();

        await setMyValue('updated value');

        expect(mockRender).toHaveBeenCalledWith(
          {
            myValue: 'updated value',
            setMyValue: expect.any(Function),
            someAction: expect.any(Function),
            callSomeAction: expect.any(Function),
            callEmptyAction: expect.any(Function),
          },
          {},
        );
      });
    });

    describe('AND setting the myValue through the setter to an array', () => {
      it('SHOULD re-render component with correct state', async () => {
        const setMyValue = mockRender.mock.calls[0][0].setMyValue;
        mockRender.mockClear();

        await setMyValue(['one', 'two']);

        expect(mockRender).toHaveBeenCalledWith(
          {
            myValue: ['one', 'two'],
            setMyValue: expect.any(Function),
            someAction: expect.any(Function),
            callSomeAction: expect.any(Function),
            callEmptyAction: expect.any(Function),
          },
          {},
        );
      });
    });

    describe('AND calling the `callSomeAction`', () => {
      it('SHOULD call the mock function', async () => {
        const callSomeAction = mockRender.mock.calls[0][0].callSomeAction;

        const result = await callSomeAction('test value');

        expect(mockAction).toHaveBeenCalledWith('test value');
        expect(result).toEqual('test value');
      });
    });

    describe('AND calling the `callEmptyAction`', () => {
      it('SHOULD complete the returned promise', async () => {
        const callEmptyAction = mockRender.mock.calls[0][0].callEmptyAction;
        const result = await callEmptyAction();
        expect(result).toBeUndefined();
      });
    });
  });

  describe('WHEN requesting a node within a container and directly outside of React', () => {
    describe('AND the node is a top-level node', () => {
      let app: Muster;
      let mockResolver: jest.Mock<Promise<any>>;
      let mockRender: jest.Mock<React.StatelessComponent>;
      let Container: ContainerComponent;
      let nonReactSubscriber: jest.Mock<any>;

      beforeEach(() => {
        mockResolver = jest.fn(() => Promise.resolve(value('ABC')));

        app = muster(fromPromise(mockResolver));

        nonReactSubscriber = jest.fn();
        app.resolve(ref(), { raw: true }).subscribe(nonReactSubscriber);

        mockRender = jest.fn(() => null);

        Container = container({
          graph: {
            myProp: ref(global()),
          },
          props: {
            myProp: types.string,
          },
        })(mockRender);

        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );
      });

      it('SHOULD only have resolved once', () => {
        expect(mockResolver).toHaveBeenCalledTimes(1);
      });

      it('SHOULD render component with a correct state', () => {
        expect(mockRender).toHaveBeenCalledWith(
          {
            myProp: 'ABC',
          },
          {},
        );
      });

      it('SHOULD have output the correct value to the non-React subscription', () => {
        expect(nonReactSubscriber).toHaveBeenCalledTimes(1);
        expect(nonReactSubscriber).toHaveBeenLastCalledWith(value('ABC'));
      });
    });

    describe('AND the node is not a top-level node', () => {
      let app: Muster;
      let mockResolver: jest.Mock<Promise<any>>;
      let mockRender: jest.Mock<React.StatelessComponent>;
      let Container: ContainerComponent;
      let nonReactSubscriber: jest.Mock<any>;

      beforeEach(() => {
        mockResolver = jest.fn(() => Promise.resolve(value('ABC')));

        app = muster({
          foo: {
            bar: fromPromise(mockResolver),
          },
        });

        nonReactSubscriber = jest.fn();
        app.resolve(ref('foo', 'bar'), { raw: true }).subscribe(nonReactSubscriber);

        mockRender = jest.fn(() => null);

        Container = container({
          graph: {
            myProp: ref(global('foo', 'bar')),
          },
          props: {
            myProp: types.string,
          },
        })(mockRender);

        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );
      });

      it('SHOULD only have resolved once', () => {
        expect(mockResolver).toHaveBeenCalledTimes(1);
      });

      it('SHOULD render component with a correct state', () => {
        expect(mockRender).toHaveBeenCalledWith(
          {
            myProp: 'ABC',
          },
          {},
        );
      });

      it('SHOULD have output the correct value to the non-React subscription', () => {
        expect(nonReactSubscriber).toHaveBeenCalledTimes(1);
        expect(nonReactSubscriber).toHaveBeenLastCalledWith(value('ABC'));
      });
    });
  });

  describe('WHEN $call action sets a relative variable', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;
    let stateSubscriber: jest.Mock<any>;

    beforeEach(() => {
      app = muster({
        navigation: {
          state: variable('STATE-A'),
          setState: action((newState) => set(ref(relative('state')), newState)),
        },
      });

      stateSubscriber = jest.fn();
      app.resolve(ref('navigation', 'state'), { raw: true }).subscribe(stateSubscriber);

      mockRender = jest.fn();
      const render = (...args: Array<any>) => {
        mockRender(...args);
        return null;
      };

      Container = container({
        graph: ref(global('navigation')),
        props: {
          state: types.string,
          setState: propTypes.caller('setState'),
        },
      })(render);

      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );
    });

    it('SHOULD render component with a correct state', () => {
      expect(mockRender).toHaveBeenCalledWith(
        {
          state: 'STATE-A',
          setState: expect.any(Function),
        },
        {},
      );
    });

    it('SHOULD have output the correct state value to the non-React subscription', () => {
      expect(stateSubscriber).toHaveBeenCalledTimes(1);
      expect(stateSubscriber).toHaveBeenLastCalledWith(value('STATE-A'));
    });

    describe('AND calling `setState`', () => {
      it('SHOULD re-render component with new value', async () => {
        const setState = mockRender.mock.calls[0][0].setState;

        stateSubscriber.mockReset();
        mockRender.mockReset();

        const result = await setState('STATE-B');

        expect(stateSubscriber).toHaveBeenCalledTimes(1);
        expect(stateSubscriber).toHaveBeenLastCalledWith(value('STATE-B'));

        expect(mockRender).toHaveBeenCalledTimes(1);
        expect(mockRender).toHaveBeenCalledWith(
          {
            state: 'STATE-B',
            setState: expect.any(Function),
          },
          {},
        );
        expect(result).toEqual('STATE-B');
      });
    });
  });

  describe('WHEN requesting data from requirements', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster(value('no-one cares'));

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);

      Container = container({
        graph: {},
        props: {
          loadedFromReq: propTypes.injected('requiredProp'),
        },
        require: {
          requiredProp: types.integer,
        },
      })(mockRender);

      mount(
        <Provider muster={app}>
          <Container $inject={{ requiredProp: 1 }} />
        </Provider>,
      );
    });

    it('SHOULD render component with a correct state', () => {
      expect(mockRender).toHaveBeenCalledWith(
        {
          loadedFromReq: 1,
        },
        {},
      );
    });
  });

  describe('WHEN requesting data from react props', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;

    beforeEach(() => {
      app = muster(value('no-one cares'));

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);

      Container = container({
        graph: {},
        props: {},
      })(mockRender);

      mount(
        <Provider muster={app}>
          <Container
            $inject={{ requiredProp: 1 }}
            react-first="test first value"
            react-second={2}
          />
        </Provider>,
      );
    });

    it('SHOULD render component with a correct state', () => {
      expect(mockRender).toHaveBeenCalledWith(
        {
          'react-first': 'test first value',
          'react-second': 2,
        },
        {},
      );
    });
  });

  describe('WHEN requesting list from local graph', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;
    const testItems = [
      { firstName: 'Maggie', lastName: 'Flores', hairColour: 'Papaya Whip' },
      { firstName: 'Pearl', lastName: 'Nunez', hairColour: 'Dark Gray' },
      { firstName: 'Eula', lastName: 'Lowe', hairColour: 'Peach Puff' },
    ];

    beforeEach(() => {
      app = muster(value('no-one cares'));

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);
    });

    describe('AND the items are simple JS objects', () => {
      beforeEach(() => {
        Container = container({
          graph: {
            mySimpleList: testItems.map(value),
          },
          props: {
            mySimpleList: propTypes.list(),
          },
        })(mockRender);

        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );
      });

      it('SHOULD render component with a correct state', () => {
        expect(mockRender).toHaveBeenCalledWith(
          {
            mySimpleList: testItems,
          },
          {},
        );
      });
    });

    describe('AND the items are branch nodes', () => {
      beforeEach(() => {
        function itemToBranch(item: any) {
          return toNode({
            firstName: value(item.firstName),
            lastName: value(item.lastName),
            hairColour: value(item.hairColur),
          });
        }

        Container = container({
          graph: {
            mySimpleList: testItems.map(itemToBranch),
          },
          props: {
            mySimpleList: propTypes.list({
              firstName: types.string,
            }),
          },
        })(mockRender);

        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );
      });

      it('SHOULD render component with a correct state', () => {
        expect(mockRender).toHaveBeenCalledWith(
          {
            mySimpleList: [{ firstName: 'Maggie' }, { firstName: 'Pearl' }, { firstName: 'Eula' }],
          },
          {},
        );
      });
    });

    describe('AND requesting nested lists', () => {
      const nestedTestItems = [
        {
          firstName: 'Maggie',
          lastName: 'Flores',
          hairColour: 'Papaya Whip',
          books: [
            { id: 1, name: 'Spy Of The Forest', pageCount: 52 },
            { id: 2, name: 'Rat With Silver', pageCount: 614 },
          ],
        },
        {
          firstName: 'Pearl',
          lastName: 'Nunez',
          hairColour: 'Dark Gray',
          books: [],
        },
        {
          firstName: 'Eula',
          lastName: 'Lowe',
          hairColour: 'Peach Puff',
          books: [{ id: 1, name: 'Praise The Nation', pageCount: 201 }],
        },
      ];

      function personToBranch(item: any) {
        return toNode({
          firstName: value(item.firstName),
          lastName: value(item.lastName),
          hairColour: value(item.hairClour),
          books: item.books.map(bookToBranch),
        });
      }

      function bookToBranch(item: any) {
        return toNode({
          id: value(item.id),
          name: value(item.name),
          pageCount: value(item.pageCount),
        });
      }

      beforeEach(() => {
        Container = container({
          graph: {
            mySimpleList: nestedTestItems.map(personToBranch),
          },
          props: {
            mySimpleList: propTypes.list({
              firstName: types.string,
              books: propTypes.list({
                name: types.string,
                pageCount: types.number,
              }),
            }),
          },
        })(mockRender);

        mount(
          <Provider muster={app}>
            <Container />
          </Provider>,
        );
      });

      it('SHOULD render component with a correct state', () => {
        expect(mockRender).toHaveBeenCalledWith(
          {
            mySimpleList: [
              {
                firstName: 'Maggie',
                books: [
                  { name: 'Spy Of The Forest', pageCount: 52 },
                  { name: 'Rat With Silver', pageCount: 614 },
                ],
              },
              {
                firstName: 'Pearl',
                books: [],
              },
              {
                firstName: 'Eula',
                books: [{ name: 'Praise The Nation', pageCount: 201 }],
              },
            ],
          },
          {},
        );
      });
    });
  });

  describe('WHEN requesting data that will arrive asynchronously', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;
    let asyncSubject: Subject<NodeDefinition>;

    beforeEach(() => {
      app = muster(value('no-one cares'));

      asyncSubject = new Subject();

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);

      Container = container({
        graph: {
          async: ifPending(
            (previousValue: NodeDefinition) =>
              toNode({
                nested: {
                  value: value('missing'),
                },
              }),
            fromStream(asyncSubject),
          ),
          sync: {
            nested: {
              value: value('some sync nested value'),
            },
          },
        },
        props: {
          async: {
            nested: {
              value: types.string,
            },
          },
          sync: {
            nested: {
              value: types.string,
            },
          },
        },
        renderLoading: (props) => mockRender(props),
      })(mockRender);

      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );
    });

    it('SHOULD render component with a correct initial state', () => {
      expect(mockRender).toHaveBeenCalledTimes(2);
      expect(mockRender).toHaveBeenLastCalledWith(
        {
          async: {
            nested: {
              value: 'missing',
            },
          },
          sync: {
            nested: {
              value: 'some sync nested value',
            },
          },
        },
        {},
      );
    });

    it('SHOULD render component with correct updated state', () => {
      mockRender.mockClear();

      asyncSubject.next(
        toNode({
          nested: {
            value: value('some async nested value'),
          },
        }),
      );

      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(mockRender).toHaveBeenCalledWith(
        {
          async: {
            nested: {
              value: 'some async nested value',
            },
          },
          sync: {
            nested: {
              value: 'some sync nested value',
            },
          },
        },
        {},
      );
    });

    it('SHOULD render component with correct stale state', () => {
      asyncSubject.next(
        toNode({
          nested: {
            value: value('some async nested value'),
          },
        }),
      );

      mockRender.mockClear();

      asyncSubject.next(pending());

      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(mockRender).toHaveBeenCalledWith(
        {
          async: {
            nested: {
              value: 'missing',
            },
          },
          sync: {
            nested: {
              value: 'some sync nested value',
            },
          },
        },
        {},
      );
    });
  });

  describe('WHEN creating a nested container', () => {
    describe('AND the child container maps all requirements onto a data graph', () => {
      let app: Muster;
      let mockChildRender: jest.Mock<React.StatelessComponent>;
      let mockParentRender: jest.Mock<React.StatelessComponent>;
      let ChildContainer: ContainerComponent;
      let ParentContainer: ContainerComponent;

      beforeEach(() => {
        app = muster({
          user: {
            address: {
              street: value('test street name'),
              city: value('test city name'),
            },
            fullName: value('test full name'),
          },
        });

        mockChildRender = jest.fn<React.StatelessComponent>(() => <div />);
        mockParentRender = jest.fn<React.StatelessComponent>((props) => (
          <ChildContainer {...ChildContainer.inject(props, ['user', 'address'])} />
        ));

        ChildContainer = container({
          require: {
            street: types.string,
            city: types.string,
          },
          graph: {},
          props: propTypes.injected(),
        })(mockChildRender);

        ParentContainer = container({
          graph: {
            user: ref(global('user')),
          },
          props: {
            user: {
              fullName: types.string,
              address: {
                ...ChildContainer.getRequirements(),
              },
            },
          },
        })(mockParentRender);

        mount(
          <Provider muster={app}>
            <ParentContainer />
          </Provider>,
        );
      });

      it('SHOULD render the parent container with correct props,', () => {
        expect(mockParentRender).toHaveBeenCalledTimes(1);
        expect(mockParentRender).toHaveBeenCalledWith(
          {
            user: {
              fullName: 'test full name',
              address: expect.anything(),
            },
          },
          {},
        );
      });

      it('SHOULD render the child container with correct props,', () => {
        expect(mockChildRender).toHaveBeenCalledTimes(1);
        expect(mockChildRender).toHaveBeenCalledWith(
          {
            street: 'test street name',
            city: 'test city name',
          },
          {},
        );
      });
    });

    describe('AND the child container requires `set` and `call`', () => {
      let app: Muster;
      let mockChildRender: jest.Mock<React.StatelessComponent>;
      let mockParentRender: jest.Mock<React.StatelessComponent>;
      let ChildContainer: ContainerComponent;
      let ParentContainer: ContainerComponent;

      beforeEach(() => {
        app = muster({
          someVariable: variable('initial value'),
        });

        mockChildRender = jest.fn<React.StatelessComponent>(() => <div />);
        mockParentRender = jest.fn<React.StatelessComponent>((props) => (
          <ChildContainer {...ChildContainer.inject(props)} />
        ));

        ChildContainer = container({
          require: {
            someVariable: types.string,
            setSomeVariable: propTypes.setter('someVariable', types.string),
          },
          graph: {},
          props: {
            someVariableTest: propTypes.injected('someVariable'),
            setSomeVariableTest: propTypes.injected('setSomeVariable'),
          },
        })(mockChildRender);

        ParentContainer = container({
          graph: {
            someVariable: ref(global('someVariable')),
          },
          props: {
            ...ChildContainer.getRequirements(),
          },
        })(mockParentRender);

        mount(
          <Provider muster={app}>
            <ParentContainer />
          </Provider>,
        );
      });

      it('SHOULD render the parent component with correct props', () => {
        expect(mockParentRender).toHaveBeenCalledTimes(1);
        expect(mockParentRender).toHaveBeenCalledWith(expect.objectContaining({}), {});
      });

      it('SHOULD render the child component with a `setSomeVariable` function', () => {
        expect(mockChildRender).toHaveBeenCalledTimes(1);
        expect(mockChildRender).toHaveBeenCalledWith(
          {
            someVariableTest: 'initial value',
            setSomeVariableTest: expect.any(Function),
          },
          {},
        );
      });

      describe('AND the `setSomeVariable` function is called', () => {
        beforeEach(async () => {
          const setter: Function = mockChildRender.mock.calls[0][0].setSomeVariableTest;
          jest.clearAllMocks();
          await setter('another value');
        });

        it('SHOULD re-render the component with the correct data', () => {
          expect(mockChildRender).toHaveBeenCalledTimes(1);
          expect(mockChildRender).toHaveBeenCalledWith(
            {
              someVariableTest: 'another value',
              setSomeVariableTest: expect.any(Function),
            },
            {},
          );
        });
      });
    });

    describe('AND the child is injected into the parent', () => {
      let app: Muster;
      let mockChildRender: jest.Mock<React.StatelessComponent>;
      let mockParentRender: jest.Mock<React.StatelessComponent>;
      let ChildContainer: ContainerComponent;
      let ParentContainer: ContainerComponent;

      beforeEach(() => {
        app = muster({
          someVariable: variable('initial value'),
        });

        mockChildRender = jest.fn<React.StatelessComponent>(() => <div />);
        mockParentRender = jest.fn<React.StatelessComponent>((props) => (
          <ChildContainer {...ChildContainer.inject(props)} />
        ));

        ChildContainer = container({
          require: {
            someVariable: types.string,
            setSomeVariable: propTypes.setter('someVariable', types.string),
          },
          graph: {},
          props: {
            someVariable: propTypes.injected(),
            setSomeVariable: propTypes.injected(),
          },
        })(mockChildRender);

        ParentContainer = container({
          graph: {
            appName: value('Test app name'),
            someVariable: ref(global('someVariable')),
          },
          props: {
            appName: types.string,
            ...ChildContainer.getRequirements(),
          },
        })(mockParentRender);

        mount(
          <Provider muster={app}>
            <ParentContainer />
          </Provider>,
        );
      });

      it('SHOULD render the parent component with all of the props', () => {
        expect(mockParentRender).toHaveBeenCalledTimes(1);
        expect(mockParentRender).toHaveBeenCalledWith(
          expect.objectContaining({
            appName: 'Test app name',
          }),
          {},
        );
      });

      it('SHOULD render the child component with a `setSomeVariable` function', () => {
        expect(mockChildRender).toHaveBeenCalledTimes(1);
        expect(mockChildRender).toHaveBeenCalledWith(
          {
            someVariable: 'initial value',
            setSomeVariable: expect.any(Function),
          },
          {},
        );
      });
    });

    describe('AND the containers are nested 3 levels deep', () => {
      let app: Muster;
      let mockLevel2Render: jest.Mock<React.StatelessComponent>;
      let mockLevel1Render: jest.Mock<React.StatelessComponent>;
      let mockRootRender: jest.Mock<React.StatelessComponent>;
      let Level2Container: ContainerComponent;
      let Level1Container: ContainerComponent;
      let RootContainer: ContainerComponent;

      beforeEach(() => {
        app = muster({
          deeply: {
            name: value('test name'),
            nested: {
              name: value('Some other name'),
              value: value('Hello world'),
            },
          },
        });

        mockLevel2Render = jest.fn<React.StatelessComponent>(() => <div />);
        mockLevel1Render = jest.fn<React.StatelessComponent>((props) => (
          <Level2Container {...Level2Container.inject(props, ['nested'])} />
        ));
        mockRootRender = jest.fn<React.StatelessComponent>((props) => (
          <Level1Container {...Level1Container.inject(props, ['deeply'])} />
        ));

        Level2Container = container({
          require: {
            value: types.string,
          },
          graph: {},
          props: {
            value: propTypes.injected(),
          },
        })(mockLevel2Render);

        Level1Container = container({
          require: {
            nested: {
              ...Level2Container.getRequirements(),
            },
          },
          graph: {},
          props: propTypes.injected(),
        })(mockLevel1Render);

        RootContainer = container({
          graph: {
            deeply: ref(global('deeply')),
          },
          props: {
            deeply: {
              name: types.string,
              nested: {
                name: types.string,
              },
              ...Level1Container.getRequirements(),
            },
          },
        })(mockRootRender);

        mount(
          <Provider muster={app}>
            <RootContainer />
          </Provider>,
        );
      });

      it('SHOULD render root container with the correct props', () => {
        expect(mockRootRender).toHaveBeenCalledTimes(1);
        expect(mockRootRender).toHaveBeenCalledWith(
          {
            deeply: expect.objectContaining({
              name: 'test name',
              nested: {
                name: 'Some other name',
              },
            }),
          },
          {},
        );
      });

      it('SHOULD render level 1 container with correct props', () => {
        expect(mockLevel1Render).toHaveBeenCalledTimes(1);
        expect(mockLevel1Render).toHaveBeenCalledWith(expect.objectContaining({}), {});
      });

      it('SHOULD render level 2 container with correct props', () => {
        expect(mockLevel2Render).toHaveBeenCalledTimes(1);
        expect(mockLevel2Render).toHaveBeenCalledWith(
          {
            value: 'Hello world',
          },
          {},
        );
      });
    });

    describe('AND the containers are nested 3 levels deep', () => {
      let app: Muster;
      let mockLevel2ARender: jest.Mock<React.StatelessComponent>;
      let mockLevel2BRender: jest.Mock<React.StatelessComponent>;
      let mockLevel1Render: jest.Mock<React.StatelessComponent>;
      let mockRootRender: jest.Mock<React.StatelessComponent>;
      let Level2AContainer: ContainerComponent;
      let Level2BContainer: ContainerComponent;
      let Level1Container: ContainerComponent;
      let RootContainer: ContainerComponent;

      beforeEach(() => {
        app = muster({
          deeply: {
            name: value('test name'),
            nested: {
              name: value('Some other name'),
              value: value('Hello world'),
            },
          },
        });

        mockLevel2ARender = jest.fn<React.StatelessComponent>(() => <span>{}</span>);
        mockLevel2BRender = jest.fn<React.StatelessComponent>(() => <div />);
        mockLevel1Render = jest.fn<React.StatelessComponent>((props) => (
          <div>
            <Level2AContainer {...Level2AContainer.inject(props, ['nested'])} />
            <Level2BContainer {...Level2BContainer.inject(props, ['nested'])} />
          </div>
        ));
        mockRootRender = jest.fn<React.StatelessComponent>((props) => (
          <Level1Container {...Level1Container.inject(props, ['deeply'])} />
        ));

        Level2AContainer = container({
          require: {
            value: types.string,
          },
          graph: {},
          props: {
            value: propTypes.injected(),
          },
        })(mockLevel2ARender);

        Level2BContainer = container({
          require: {
            name: types.string,
          },
          graph: {},
          props: {
            name: propTypes.injected(),
          },
        })(mockLevel2BRender);

        Level1Container = container({
          require: {
            nested: {
              ...Level2AContainer.getRequirements(),
              ...Level2BContainer.getRequirements(),
            },
          },
          graph: {},
          props: propTypes.injected(),
        })(mockLevel1Render);

        RootContainer = container({
          graph: {
            deeply: ref(global('deeply')),
          },
          props: {
            deeply: {
              name: types.string,
              nested: {
                name: types.string,
              },
              ...Level1Container.getRequirements(),
            },
          },
        })(mockRootRender);

        mount(
          <Provider muster={app}>
            <RootContainer />
          </Provider>,
        );
      });

      it('SHOULD render root container with the correct props', () => {
        expect(mockRootRender).toHaveBeenCalledTimes(1);
        expect(mockRootRender).toHaveBeenCalledWith(
          {
            deeply: expect.objectContaining({
              name: 'test name',
              nested: {
                name: 'Some other name',
              },
            }),
          },
          {},
        );
      });

      it('SHOULD render level 1 container with correct props', () => {
        expect(mockLevel1Render).toHaveBeenCalledTimes(1);
        expect(mockLevel1Render).toHaveBeenCalledWith(expect.objectContaining({}), {});
      });

      it('SHOULD render level 2A container with correct props', () => {
        expect(mockLevel2ARender).toHaveBeenCalledTimes(1);
        expect(mockLevel2ARender).toHaveBeenCalledWith(
          {
            value: 'Hello world',
          },
          {},
        );
      });

      it('SHOULD render level 2B container with correct props', () => {
        expect(mockLevel2BRender).toHaveBeenCalledTimes(1);
        expect(mockLevel2BRender).toHaveBeenCalledWith(
          {
            name: 'Some other name',
          },
          {},
        );
      });
    });

    describe('AND the child requires an array', () => {
      let app: Muster;
      let mockChildRender: jest.Mock<React.StatelessComponent>;
      let mockParentRender: jest.Mock<React.StatelessComponent>;
      let ChildContainer: ContainerComponent;
      let ParentContainer: ContainerComponent;

      beforeEach(() => {
        app = muster({
          someArray: value([1, 2, 3]),
        });

        mockChildRender = jest.fn<React.StatelessComponent>(() => <div />);
        mockParentRender = jest.fn<React.StatelessComponent>((props) => (
          <ChildContainer {...ChildContainer.inject(props)} />
        ));

        ChildContainer = container({
          require: {
            someArray: types.array,
          },
          graph: {},
          props: {
            someArray: propTypes.injected(),
          },
        })(mockChildRender);

        ParentContainer = container({
          graph: {
            appName: value('Test app name'),
            someArray: ref(global('someArray')),
          },
          props: {
            appName: types.string,
            ...ChildContainer.getRequirements(),
          },
        })(mockParentRender);

        mount(
          <Provider muster={app}>
            <ParentContainer />
          </Provider>,
        );
      });

      it('SHOULD render the parent component with all of the props', () => {
        expect(mockParentRender).toHaveBeenCalledTimes(1);
        expect(mockParentRender).toHaveBeenCalledWith(
          expect.objectContaining({
            appName: 'Test app name',
          }),
          {},
        );
      });

      it('SHOULD render the child component with correct array', () => {
        expect(mockChildRender).toHaveBeenCalledTimes(1);
        expect(mockChildRender).toHaveBeenCalledWith(
          {
            someArray: [1, 2, 3],
          },
          {},
        );
      });
    });
  });

  describe('GIVEN a component which is loading data from the stream', () => {
    let app: Muster;
    let mockRender: jest.Mock<React.StatelessComponent>;
    let Container: ContainerComponent;
    let stream: BehaviorSubject<any>;

    beforeEach(() => {
      stream = new BehaviorSubject({ someProp: 'Initial value' });

      app = muster({
        streamedValue: fromStream(stream),
      });

      mockRender = jest.fn<React.StatelessComponent>(() => <div />);
      Container = container(
        {
          graph: {
            value: ref(global('streamedValue')),
          },
          props: {
            value: types.any,
          },
        },
        (data) => data,
      )(mockRender);

      mount(
        <Provider muster={app}>
          <Container />
        </Provider>,
      );
    });

    it('SHOULD render the component with correct props', () => {
      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(mockRender).toHaveBeenCalledWith(
        {
          value: { someProp: 'Initial value' },
        },
        {},
      );
    });

    describe('WHEN the value stream gets updated with new value', () => {
      beforeEach(() => {
        stream.next({ otherProp: 'Updated value' });
      });

      it('SHOULD render the component with updated props', async () => {
        expect(mockRender).toHaveBeenCalledTimes(2);
        expect(mockRender).toHaveBeenLastCalledWith(
          {
            value: { otherProp: 'Updated value' },
          },
          {},
        );
        await nextRender();
        expect(mockRender).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('integration', () => {
    runScenario(() => {
      const globalMuster = () => muster({ first: variable('foo') });

      const TestContainer = container({
        graph: {
          first: ref(global('first')),
          second: value(2),
          third: value([1, 2, 3]),
        },
        props: {
          first: types.any,
          second: types.any,
          third: types.any,
          setFirst: propTypes.setter('first', types.string),
        },
      });

      interface TestComponentProps {
        first: string;
        second: number;
        third: Array<number>;
        setFirst: (value: any) => Promise<NodeDefinition>;
      }
      const TestComponent = (props: TestComponentProps) => null;

      return {
        description: 'WHEN creating a container with a simple local graph',
        graph: globalMuster,
        container: TestContainer,
        component: TestComponent,
        expected: {
          props: {
            first: 'foo',
            second: 2,
            third: [1, 2, 3],
            setFirst: expect.any(Function),
          },
        },
        operations: [
          operation({
            description: 'AND a variable is updated via the component',
            input: (results) => (results.props as any).setFirst('bar'),
            expected: {
              value: 'bar',
              graph: {
                first: 'bar',
              },
              props: {
                first: 'bar',
                second: 2,
                third: [1, 2, 3],
                setFirst: expect.any(Function),
              },
            },
          }),
          {
            description: 'AND a variable is updated in the graph',
            input: set(ref('first'), 'bar'),
            expected: {
              props: {
                first: 'bar',
                second: 2,
                third: [1, 2, 3],
                setFirst: expect.any(Function),
              },
            },
          },
        ],
      };
    });

    runScenario(() => {
      const globalMuster = () => muster({ outer: variable('foo') });

      const TestContainer = container({
        graph: {
          inner: ref(global('outer')),
        },
        props: {
          inner: types.any,
          setInner: propTypes.setter('inner', types.string),
        },
      });

      interface TestComponentProps {
        inner: string;
        setInner: (value: any) => Promise<NodeDefinition>;
      }

      const TestComponent = (props: TestComponentProps) => null;

      return {
        description: 'WHEN creating a container with a local graph that aliases a global path',
        graph: globalMuster,
        container: TestContainer,
        component: TestComponent,
        expected: {
          props: {
            inner: 'foo',
            setInner: expect.any(Function),
          },
        },
        operations: [
          operation({
            description: 'AND a variable is updated via the component',
            input: (results) => (results.props as any).setInner('bar'),
            expected: {
              graph: {
                outer: 'bar',
              },
              props: {
                inner: 'bar',
                setInner: expect.any(Function),
              },
            },
          }),
          operation({
            description: 'AND a variable is updated in the global graph',
            input: set(ref('outer'), 'bar'),
            expected: {
              props: {
                inner: 'bar',
                setInner: expect.any(Function),
              },
            },
          }),
        ],
      };
    });

    runScenario(() => {
      const TestContainer = container({
        graph: {
          foo: action(function*() {
            const result = yield fromPromise(() => Promise.resolve(value('foo')));
            return `Result: ${result}`;
          }),
        },
        props: {
          callFoo: propTypes.caller('foo'),
        },
      });

      return {
        description: 'WHEN creating a container that triggers an asynchronous action',
        graph: () => muster(nil()),
        container: TestContainer,
        expected: {
          props: {
            callFoo: expect.any(Function),
          },
        },
        operations: [
          operation({
            description: 'AND the action is called via the component props',
            input: (results) => results.props.callFoo(),
            expected: {
              value: 'Result: foo',
            },
          }),
        ],
      };
    });

    runScenario(() => {
      const mockRenderError = jest.fn(() => null);
      const TestContainer = container({
        graph: {
          name: ref(global('remote', '$$NETWORK_ERROR$$')),
        },
        props: {
          name: types.any,
        },
        renderError: mockRenderError,
      });
      return {
        description:
          'GIVEN the muster graph containing a connection to a remote node (Network error)',
        before() {
          mockResponse(error('Network error'));
        },
        graph: () =>
          muster({
            remote: remote('http://test/', { scheduler: onGlobalEvent(FLUSH) }),
          }),
        container: TestContainer,
        assert() {
          expect(mockRenderError).toHaveBeenCalledTimes(1);
          expect(mockRenderError).toHaveBeenCalledWith(
            [
              formatError(
                withErrorPath(error({ message: 'Network error', stack: expect.anything() }), {
                  path: ['remote', '$$NETWORK_ERROR$$'],
                }),
              ),
            ],
            {},
          );
        },
      };
    });

    runScenario(() => {
      const mockRenderError = jest.fn(() => null);
      const TestContainer = container({
        graph: {
          name: ref(global('remote', '$$NETWORK_ERROR$$')),
        },
        props: {
          name: types.any,
        },
        renderError: mockRenderError,
      });
      return {
        description:
          'GIVEN the muster graph containing a connection to a remote node (with mapper)',
        before() {
          mockResponse(error('Network error'));
        },
        graph: () =>
          muster({
            remote: remote('http://test/', {
              middleware: [
                transformResponseMiddleware(
                  handleErrors((v) => error(`Other: ${v.properties.error.message}`)),
                ),
              ],
              scheduler: onGlobalEvent(FLUSH),
            }),
          }),
        container: TestContainer,
        assert() {
          expect(mockRenderError).toHaveBeenCalledTimes(1);
          expect(mockRenderError).toHaveBeenCalledWith(
            [
              formatError(
                withErrorPath(
                  error({ message: 'Other: Network error', stack: expect.anything() }),
                  { path: ['remote', '$$NETWORK_ERROR$$'] },
                ),
              ),
            ],
            {},
          );
        },
      };
    });

    runScenario(() => {
      let promisesToResolve: Array<() => void> = [];
      const resolvePromise = () => {
        promisesToResolve.forEach((res) => res());
        promisesToResolve = [];
      };

      const TestContainer = container({
        graph: {
          name: ref(global('name')),
          combined: ref(global('combined')),
        },
        props: {
          name: types.string,
          combined: propTypes.defer(types.string),
          isLoading: propTypes.isLoading('combined'),
        },
      });
      return {
        description: 'GIVEN a muster graph containing variable that causes other fields to re-load',
        before() {
          promisesToResolve = [];
        },
        graph: () =>
          muster({
            name: variable('first'),
            combined: computed([ref('name')], (name) =>
              fromPromise(() =>
                new Promise((resolve) => {
                  promisesToResolve.push(resolve);
                }).then(() => value(`computed ${name}`)),
              ),
            ),
          }),
        container: TestContainer,
        expected: {
          props: [{ name: 'first', combined: undefined, isLoading: true }],
        },
        operations: [
          operation({
            description: 'WHEN the promise gets resolved',
            before() {
              resolvePromise();
            },
            expected: {
              props: [{ name: 'first', combined: 'computed first', isLoading: false }],
            },
            operations: [
              operation({
                description: 'AND then the variable gets changed',
                input: set('name', 'second'),
                expected: {
                  value: value('second'),
                  props: [{ name: 'second', combined: 'computed first', isLoading: true }],
                },
                operations: [
                  operation({
                    description: 'AND then the promise gets resolved',
                    before() {
                      resolvePromise();
                    },
                    expected: {
                      props: [{ name: 'second', combined: 'computed second', isLoading: false }],
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
      let promisesToResolve: Array<() => void> = [];
      const resolvePromise = () => {
        promisesToResolve.forEach((res) => res());
        promisesToResolve = [];
      };
      const renderLoading = jest.fn(() => null);
      const TestContainer = container({
        graph: {
          name: ref(global('name')),
          combined: ref(global('combined')),
        },
        renderLoading,
        props: {
          name: types.string,
          combined: propTypes.defer(types.string),
          isLoading: propTypes.isLoading('combined'),
        },
      });
      return {
        description:
          'GIVEN a muster graph containing variable that causes other fields to re-load 1',
        before() {
          promisesToResolve = [];
        },
        graph: () =>
          muster({
            name: variable('first'),
            combined: computed([ref('name')], (name) =>
              fromPromise(() =>
                new Promise((resolve) => {
                  promisesToResolve.push(resolve);
                }).then(() => value(`computed ${name}`)),
              ),
            ),
          }),
        container: TestContainer,
        expected: {
          props: [{ name: 'first', combined: undefined, isLoading: true }],
        },
        assert() {
          expect(renderLoading).toHaveBeenCalledTimes(1);
        },
        operations: [
          operation({
            description: 'WHEN the promise gets resolved.',
            before() {
              jest.clearAllMocks();
              resolvePromise();
            },
            expected: {
              props: [{ name: 'first', combined: 'computed first', isLoading: false }],
            },
            assert() {
              expect(renderLoading).not.toHaveBeenCalled();
            },
            operations: [
              operation({
                description: 'AND then the variable gets changed',
                before() {
                  jest.clearAllMocks();
                },
                input: set('name', 'second'),
                expected: {
                  value: value('second'),
                  props: [{ name: 'second', combined: 'computed first', isLoading: true }],
                },
                assert() {
                  expect(renderLoading).not.toHaveBeenCalled();
                },
                operations: [
                  operation({
                    description: 'AND then the promise gets resolved',
                    before() {
                      jest.clearAllMocks();
                      resolvePromise();
                    },
                    expected: {
                      props: [{ name: 'second', combined: 'computed second', isLoading: false }],
                    },
                    assert() {
                      expect(renderLoading).not.toHaveBeenCalled();
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
      let resolvePromise: () => void;
      const TestContainer = container({
        graph: {
          name: variable('initial'),
          nested: {
            [match(types.string, 'name')]: fromPromise((props: any) =>
              new Promise((res) => (resolvePromise = res)).then(() => props.name),
            ),
          },
          asyncName: ref('nested', ref('name')),
        },
        props: {
          asyncName: propTypes.defer(types.string),
          isAsyncNameLoading: propTypes.isLoading('asyncName'),
          setName: propTypes.setter('name', types.string),
        },
      });

      return {
        description: 'WHEN rendering a component with async name',
        graph: () => muster(nil()),
        container: TestContainer,
        component: () => null,
        expected: {
          props: {
            asyncName: undefined,
            isAsyncNameLoading: true,
            setName: expect.any(Function),
          },
        },
        operations: [
          operation({
            description: 'AND the promise resolves',
            before() {
              resolvePromise();
            },
            expected: {
              props: {
                asyncName: 'initial',
                isAsyncNameLoading: false,
                setName: expect.any(Function),
              },
            },
            operations: [
              operation({
                description: 'AND the setter gets called with a new value',
                input: (results) => results.props.setName('updated'),
                expected: {
                  props: {
                    asyncName: 'initial',
                    isAsyncNameLoading: true,
                    setName: expect.any(Function),
                  },
                },
                operations: [
                  operation({
                    description: 'AND the promise gets resolved (again)',
                    before() {
                      resolvePromise();
                    },
                    expected: {
                      props: {
                        asyncName: 'updated',
                        isAsyncNameLoading: false,
                        setName: expect.any(Function),
                      },
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
      let promisesToResolve: Array<() => void> = [];
      const resolvePromise = () => {
        promisesToResolve.forEach((res) => res());
        promisesToResolve = [];
      };
      const TestContainer = container({
        graph: {
          name: variable('initial'),
          remoteItems: ref(global('remote', ref('name'))),
        },
        props: {
          remoteItems: propTypes.defer(propTypes.list()),
          areRemoteItemsLoading: propTypes.isLoading('remoteItems'),
          setName: propTypes.setter('name', types.string),
        },
      });
      return {
        description: 'WHEN rendering a component with async items',
        before() {
          promisesToResolve = [];
          mockRemoteGraph(
            muster({
              [match(types.string, 'name')]: fromPromise((props: any) =>
                new Promise((res) => promisesToResolve.push(res)).then(() =>
                  array([`${props.name} 1`, `${props.name} 2`]),
                ),
              ),
            }),
          );
        },
        graph: () =>
          muster({
            remote: remote('http://test/', {
              middleware: [
                transformResponseMiddleware(
                  handleErrors((v) => error(`Other: ${v.properties.error.message}`)),
                ),
              ],
              scheduler: onGlobalEvent(FLUSH),
            }),
          }),
        container: TestContainer,
        component: () => null,
        expected: {
          props: {
            remoteItems: [],
            areRemoteItemsLoading: true,
            setName: expect.any(Function),
          },
        },
        operations: [
          operation({
            description: 'AND the promise resolves',
            async before() {
              resolvePromise();
              await nextRender();
              await nextRender();
            },
            expected: {
              props: {
                remoteItems: ['initial 1', 'initial 2'],
                areRemoteItemsLoading: false,
                setName: expect.any(Function),
              },
            },
            operations: [
              operation({
                description: 'AND the setter gets called with a new value',
                input: (results) => results.props.setName('updated'),
                expected: {
                  props: {
                    remoteItems: ['initial 1', 'initial 2'],
                    areRemoteItemsLoading: true,
                    setName: expect.any(Function),
                  },
                },
                operations: [
                  operation({
                    description: 'AND the promise gets resolved (again)',
                    async before() {
                      resolvePromise();
                      await nextRender();
                      await nextRender();
                    },
                    expected: {
                      props: {
                        remoteItems: ['updated 1', 'updated 2'],
                        areRemoteItemsLoading: false,
                        setName: expect.any(Function),
                      },
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
      const TestContainer = container({
        graph: {
          async: fromPromise(() => Promise.resolve('value')),
          sync: 'value',
        },
        props: {
          async: propTypes.defer(types.string),
          sync: types.string,
        },
      });

      return {
        description: 'GIVEN a muster graph containing an async and sync nodes',
        graph: () => muster(nil()),
        container: TestContainer,
        expected: {
          props: [{ async: undefined, sync: 'value' }, { async: 'value', sync: 'value' }],
        },
      };
    });

    describe('GIVEN a remote muster graph containing two async fields', () => {
      let resolveFirst: () => void;
      let resolveSecond: () => void;
      let remoteMuster: Muster;
      let localMuster: Muster;

      beforeEach(() => {
        remoteMuster = muster({
          first: fromPromise(() => new Promise((res) => (resolveFirst = res)).then(() => 'first')),
          second: fromPromise(() =>
            new Promise((res) => (resolveSecond = res)).then(() => 'second'),
          ),
        });
        localMuster = muster({
          remote: proxy([fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true }))]),
        });
      });

      describe('WHEN a component is requesting both of the fields', () => {
        let mockRender: jest.Mock<JSX.Element>;
        let Container: ContainerComponent;
        beforeEach(() => {
          mockRender = jest.fn(() => <div />);
          Container = container({
            graph: {
              first: ref(global('remote', 'first')),
              second: ref(global('remote', 'second')),
            },
            props: {
              first: propTypes.defer(types.string),
              second: propTypes.defer(types.string),
            },
          })(mockRender);
          mount(
            <Provider muster={localMuster}>
              <Container />
            </Provider>,
          );
        });

        it('SHOULD render the component with first and second equal to null', () => {
          expect(mockRender).toHaveBeenCalledTimes(1);
          expect(mockRender).toHaveBeenCalledWith(
            {
              first: undefined,
              second: undefined,
            },
            expect.anything(),
          );
        });

        describe('AND then the promises get resolved', () => {
          beforeEach(async () => {
            jest.clearAllMocks();
            resolveFirst();
            resolveSecond();
            await nextRender();
          });

          it('SHOULD render the component with resolved first and second', () => {
            expect(mockRender).toHaveBeenCalledTimes(1);
            expect(mockRender).toHaveBeenCalledWith(
              {
                first: 'first',
                second: 'second',
              },
              expect.anything(),
            );
          });
        });
      });
    });

    describe('GIVEN a remote muster instance containing a collection with refs', () => {
      let remoteMuster: Muster;

      beforeEach(() => {
        remoteMuster = muster({
          globalName: 'test name',
          items: [{ name: ref('globalName') }],
        });
      });

      runScenario(() => {
        return {
          description: 'AND the local instance of muster containing a proxy node linking to it',
          graph: () =>
            muster({
              remote: proxy([
                fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true })),
              ]),
            }),
          container: container({
            graph: extend(ref(global('remote')), {
              name: 'Bob',
            }),
            props: {
              items: propTypes.list({
                name: types.any,
              }),
            },
          }),
          expected: {
            props: {
              items: [{ name: 'test name' }],
            },
          },
        };
      });
    });

    describe('GIVEN a remote instance containing a branch matcher (call action, local graph)', () => {
      let remoteMuster: Muster;
      let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

      runScenario({
        before() {
          remoteMuster = muster({
            [match(types.string, 'name')]: computed([param('name')], (name) => `Hello, ${name}`),
          });
          mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        },
        description: 'AND a local instance connected to the remote',
        graph: () =>
          muster({
            remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          }),
        container: container({
          graph: {
            addName: action(function*(name) {
              yield push(ref('names'), name);
            }),
            greetings: applyTransforms(ref('names'), [
              map((name: NodeDefinition) => ref(global('remote', name))),
            ]),
            names: arrayList(['first']),
          },
          props: {
            addName: propTypes.caller(),
            greetings: propTypes.list(),
          },
        }),
        expected: {
          props: {
            addName: expect.any(Function),
            greetings: ['Hello, first'],
          },
        },
        assert() {
          expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          expect(mockRemoteResolve).toHaveBeenCalledWith(
            querySet(root(), [
              querySetGetChildOperation(getChildOperation('first'), [
                querySetOperation(RESOLVE_OPERATION),
              ]),
            ]),
          );
        },
        operations: [
          operation({
            description: 'AND the new name gets added (by calling props.addName)',
            before() {
              jest.clearAllMocks();
            },
            input: (results) => results.props.addName('second'),
            expected: {
              props: {
                addName: expect.any(Function),
                greetings: ['Hello, first', 'Hello, second'],
              },
            },
            assert() {
              expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      });
    });

    describe('GIVEN a remote instance containing a branch matcher (call action, global graph)', () => {
      let remoteMuster: Muster;
      let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

      runScenario({
        before() {
          remoteMuster = muster({
            [match(types.string, 'name')]: computed([param('name')], (name) => `Hello, ${name}`),
          });
          mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        },
        description: 'AND a local instance connected to the remote',
        graph: () =>
          muster({
            remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
            addName: action(function*(name) {
              yield push(ref('names'), name);
            }),
            greetings: applyTransforms(ref('names'), [
              map((name: NodeDefinition) => ref('remote', name)),
            ]),
            names: arrayList(['first']),
          }),
        container: container({
          graph: {
            addName: ref(global('addName')),
            greetings: ref(global('greetings')),
          },
          props: {
            addName: propTypes.caller(),
            greetings: propTypes.list(),
          },
        }),
        expected: {
          props: {
            addName: expect.any(Function),
            greetings: ['Hello, first'],
          },
        },
        assert() {
          expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          expect(mockRemoteResolve).toHaveBeenCalledWith(
            querySet(root(), [
              querySetGetChildOperation(getChildOperation('first'), [
                querySetOperation(RESOLVE_OPERATION),
              ]),
            ]),
          );
        },
        operations: [
          operation({
            description: 'AND the new name gets added',
            before() {
              jest.clearAllMocks();
            },
            input: (results) => results.props.addName('second'),
            expected: {
              props: {
                addName: expect.any(Function),
                greetings: ['Hello, first', 'Hello, second'],
              },
            },
            assert() {
              expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            },
          }),
          operation({
            description: 'AND the new name gets added (by resolving a call node)',
            before() {
              jest.clearAllMocks();
            },
            input: call(ref('addName'), ['second']),
            expected: {
              props: {
                addName: expect.any(Function),
                greetings: ['Hello, first', 'Hello, second'],
              },
            },
            assert() {
              expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      });
    });

    describe('GIVEN a remote instance containing a branch matcher (push, global graph)', () => {
      let remoteMuster: Muster;
      let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

      runScenario({
        before() {
          remoteMuster = muster({
            [match(types.string, 'name')]: computed([param('name')], (name) => `Hello, ${name}`),
          });
          mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
        },
        description: 'AND a local instance connected to the remote',
        graph: () =>
          muster({
            remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
            addName: action(function*(name) {
              yield push(ref('names'), name);
            }),
            greetings: applyTransforms(ref('names'), [
              map((name: NodeDefinition) => ref('remote', name)),
            ]),
            names: arrayList(['first']),
          }),
        container: container({
          graph: {
            addName: ref(global('addName')),
            greetings: ref(global('greetings')),
          },
          props: {
            greetings: propTypes.list(),
          },
        }),
        expected: {
          props: {
            greetings: ['Hello, first'],
          },
        },
        assert() {
          expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          expect(mockRemoteResolve).toHaveBeenCalledWith(
            querySet(root(), [
              querySetGetChildOperation(getChildOperation('first'), [
                querySetOperation(RESOLVE_OPERATION),
              ]),
            ]),
          );
        },
        operations: [
          operation({
            description: 'AND the new name gets added',
            before() {
              jest.clearAllMocks();
            },
            input: push(ref('names'), 'second'),
            expected: {
              props: {
                greetings: ['Hello, first', 'Hello, second'],
              },
            },
            assert() {
              expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            },
          }),
        ],
      });
    });
  });

  describe('GIVEN a remote instance of muster containing a collection behind a matcher', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          [match(types.shape({ name: types.string }), 'criteria')]: computed(
            [param('criteria')],
            (criteria) =>
              toNode([
                { name: `${criteria.name} 1` },
                { name: `${criteria.name} 2` },
                { name: `${criteria.name} 3` },
              ]),
          ),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
          data: {
            criteria: variable({ name: 'initial' }),
            items: ref('remote', ref('data', 'criteria')),
          },
        }),
      container: container({
        graph: scope(
          extend(context('data'), {
            someValue: 'some value',
          }),
          {
            data: ref(global('data')),
          },
        ),
        props: {
          items: propTypes.list({
            name: types.any,
          }),
          setCriteria: propTypes.setter('criteria', types.any),
          someValue: types.any,
        },
      }),
      expected: {
        props: {
          items: [{ name: 'initial 1' }, { name: 'initial 2' }, { name: 'initial 3' }],
          setCriteria: expect.any(Function),
          someValue: 'some value',
        },
      },
      assert() {
        expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
        expect(mockRemoteResolve).toHaveBeenCalledWith(
          querySet(root(), [
            querySetGetChildOperation(getChildOperation({ name: 'initial' }), [
              querySetGetItemsOperation({
                children: [
                  querySetGetChildOperation(getChildOperation('name'), [
                    querySetOperation(RESOLVE_OPERATION),
                  ]),
                ],
                operation: getItemsOperation([]),
              }),
            ]),
          ]),
        );
      },
      operations: [
        operation({
          description: 'AND the criteria changes',
          before() {
            jest.clearAllMocks();
          },
          input: (results) => results.props.setCriteria({ name: 'updated' }),
          expected: {
            props: {
              items: [{ name: 'updated 1' }, { name: 'updated 2' }, { name: 'updated 3' }],
              setCriteria: expect.any(Function),
              someValue: 'some value',
            },
          },
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation(getChildOperation({ name: 'updated' }), [
                  querySetGetItemsOperation({
                    children: [
                      querySetGetChildOperation(getChildOperation('name'), [
                        querySetOperation(RESOLVE_OPERATION),
                      ]),
                    ],
                    operation: getItemsOperation([]),
                  }),
                ]),
              ]),
            );
          },
        }),
      ],
    });
  });

  runScenario(() => {
    let promisesToResolve: Array<() => void>;

    function resolvePromises() {
      promisesToResolve.forEach((res) => res());
    }

    return {
      description: 'WHEN the component defers loading asynchronous branch',
      before() {
        promisesToResolve = [];
      },
      graph: () => muster({}),
      container: container({
        graph: {
          user: fromPromise(() =>
            new Promise((resolve) => promisesToResolve.push(resolve)).then(() =>
              toNode({
                firstName: 'Test',
                lastName: 'User',
              }),
            ),
          ),
          sync: 'synchronously available value',
        },
        props: {
          user: propTypes.defer({
            firstName: types.string,
            lastName: types.string,
          }),
          isLoadingUser: propTypes.isLoading('user'),
          sync: types.string,
        },
      }),
      expected: {
        props: {
          user: undefined,
          isLoadingUser: true,
          sync: 'synchronously available value',
        },
      },
      operations: [
        operation({
          description: 'AND the promise finally resolves',
          before() {
            resolvePromises();
          },
          expected: {
            props: {
              user: {
                firstName: 'Test',
                lastName: 'User',
              },
              isLoadingUser: false,
              sync: 'synchronously available value',
            },
          },
        }),
      ],
    };
  });

  runScenario(() => {
    const renderError = jest.fn(() => null);
    return {
      description: 'GIVEN a component with string prop',
      graph: () =>
        muster({
          someValue: variable('initial'),
        }),
      container: container({
        graph: {
          someValue: ref(global('someValue')),
        },
        props: {
          someValue: types.optional(types.string),
        },
        renderError,
      }),
      expected: {
        props: {
          someValue: 'initial',
        },
      },
      operations: [
        operation({
          description: 'AND `someValue` is changed to an integer value',
          before() {
            jest.clearAllMocks();
          },
          input: set('someValue', 123),
          assert() {
            expect(renderError).toHaveBeenCalledTimes(1);
            expect(renderError).toHaveBeenCalledWith(
              [new Error(`Property 'someValue' - Invalid value: 123`)],
              { someValue: 123 },
            );
          },
          operations: [
            operation({
              description: 'AND `someValue` is changed to an undefined value',
              before() {
                jest.clearAllMocks();
              },
              input: set('someValue', undefined),
              expected: {
                props: {
                  someValue: undefined,
                },
              },
              assert() {
                expect(renderError).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let promisesToResolve: Array<() => void>;

    function resolvePromises() {
      promisesToResolve.forEach((resolve) => resolve());
    }

    return {
      description: 'GIVEN a component requesting a deferred branch with a fallback',
      before() {
        promisesToResolve = [];
      },
      graph: () => muster({}),
      container: container({
        graph: {
          user: fromPromise(() =>
            new Promise((resolve) => promisesToResolve.push(resolve)).then(() =>
              toNode({
                firstName: 'Bob',
                lastName: 'Smith',
              }),
            ),
          ),
        },
        props: {
          user: propTypes.defer(value('Loading...'), {
            firstName: types.string,
            lastName: types.string,
          }),
        },
      }),
      expected: {
        props: {
          user: 'Loading...',
        },
      },
      operations: [
        operation({
          description: 'AND user promise resolves',
          before() {
            resolvePromises();
          },
          expected: {
            props: {
              user: {
                firstName: 'Bob',
                lastName: 'Smith',
              },
            },
          },
        }),
      ],
    };
  });

  describe('GIVEN a page component and two composable child components (one with and the other without requirements', () => {
    it('SHOULD correctly render all components', () => {
      const expandContainer = container({
        graph: {
          expanded: variable(false),
        },
        props: {
          expanded: types.bool,
        },
      });
      const childContainer = container({
        require: {
          user: {
            firstName: types.string,
            lastName: types.string,
          },
        },
        props: propTypes.injected(),
      });
      const renderChild = jest.fn(() => null);
      const ChildComponent = childContainer(expandContainer(renderChild));
      const pageContainer = container({
        graph: {
          user: {
            firstName: 'Bob',
            lastName: 'Smith',
          },
        },
        props: {
          ...ChildComponent.getRequirements(),
        },
      });
      const PageComponent = pageContainer((props) => (
        <ChildComponent {...ChildComponent.inject(props)} />
      ));

      mount(
        <Provider muster={muster({})}>
          <PageComponent />
        </Provider>,
      );

      expect(renderChild).toHaveBeenCalledTimes(1);
    });
  });

  runScenario({
    description: 'GIVEN a component containing error leaves, and props with catchError',
    graph: () => muster({}),
    container: container({
      graph: {
        name: error('Test error'),
      },
      props: {
        name: propTypes.catchError('Fallback value', types.string),
      },
    }),
    expected: {
      props: {
        name: 'Fallback value',
      },
    },
  });

  runScenario({
    description: 'GIVEN a component containing error branch, and props with catchError',
    graph: () => muster({}),
    container: container({
      graph: {
        user: error('Test error'),
      },
      props: {
        user: propTypes.catchError('Fallback user', {
          firstName: types.string,
          lastName: types.string,
        }),
      },
    }),
    expected: {
      props: {
        user: 'Fallback user',
      },
    },
  });

  describe('GIVEN a container with relaxed prop validation', () => {
    let originalWarn: any;

    beforeEach(() => {
      originalWarn = console.warn;
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.warn = originalWarn;
    });

    runScenario(() => {
      const mockComponent = jest.fn(() => null);
      return {
        description: 'AND a local graph that has an incorrectly typed value',
        container: container({
          graph: {
            name: 123,
          },
          props: {
            name: types.string,
          },
          relaxPropsValidation: true,
        }),
        component: mockComponent,
        graph: () => muster({}),
        assert() {
          expect(mockComponent).toHaveBeenCalledTimes(1);
          expect(console.warn).toHaveBeenCalledTimes(1);
        },
      };
    });
  });

  runScenario(() => {
    const mockRenderError = jest.fn(() => null);
    return {
      description: 'GIVEN a container with a renderError handler',
      graph: () => muster({}),
      container: container({
        graph: {
          error: error('Test error message', { code: 'some code', data: { name: 'some data' } }),
        },
        props: {
          error: true,
        },
        renderError: mockRenderError,
      }),
      assert() {
        expect(mockRenderError).toHaveBeenCalledTimes(1);
        const errors = mockRenderError.mock.calls[0][0];
        expect(errors).toHaveLength(1);
        const err = errors[0];
        expect(err).toEqual(new Error('Test error message\n\nPath: ["error"]'));
        expect(err.data).toEqual({ name: 'some data' });
        expect(err.code).toEqual('some code');
      },
    };
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    return {
      description: 'GIVEN a remote deeply nested collection of items',
      before() {
        remoteMuster = muster({
          deeply: {
            nested: {
              items: [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
                { id: 3, name: 'Item 3' },
              ],
            },
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          nested: {
            minId: variable(1),
            filteredItems: applyTransforms(ref('remote', 'deeply', 'nested', 'items'), [
              filter((item) => gte(get(item, 'id'), ref('nested', 'minId'))),
            ]),
          },
        }),
      container: container({
        graph: {
          minId: ref(global('nested', 'minId')),
          filteredItems: ref(global('nested', 'filteredItems')),
        },
        props: {
          minId: true,
          setMinId: propTypes.setter('minId'),
          filteredItems: propTypes.list({
            id: true,
            name: true,
          }),
        },
      }),
      expected: {
        props: {
          minId: 1,
          setMinId: expect.any(Function),
          filteredItems: [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
            { id: 3, name: 'Item 3' },
          ],
        },
      },
      assert() {
        expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
        expect(mockRemoteResolve).toHaveBeenCalledWith(
          querySet(root(), [
            querySetGetChildOperation('deeply', [
              querySetGetChildOperation('nested', [
                querySetGetChildOperation('items', [
                  querySetGetItemsOperation({
                    operation: getItemsOperation([
                      filter(mockFn((item) => gte(get(item, 'id'), 1))),
                    ]),
                    children: [
                      querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                      querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                    ],
                  }),
                ]),
              ]),
            ]),
          ]),
        );
      },
      operations: [
        operation({
          description: 'WHEN the filter is changed',
          before() {
            jest.clearAllMocks();
          },
          input: (data) => data.props.setMinId(2),
          expected: {
            props: {
              minId: 2,
              setMinId: expect.any(Function),
              filteredItems: [{ id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }],
            },
          },
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('deeply', [
                  querySetGetChildOperation('nested', [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => gte(get(item, 'id'), 2))),
                        ]),
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                          querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                      }),
                    ]),
                  ]),
                ]),
              ]),
            );
          },
        }),
      ],
    };
  });
});
