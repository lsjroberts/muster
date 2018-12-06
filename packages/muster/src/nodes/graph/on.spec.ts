import muster, {
  dispatch,
  fields,
  isNodeDefinition,
  key,
  match,
  MusterEvent,
  NodeDefinition,
  ok,
  param,
  Params,
  query,
  reset,
  root,
  types,
  value,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { on } from './on';

describe('on', () => {
  describe('GIVEN an event handler that returns any node payloads', () => {
    let callback: jest.Mock<NodeDefinition | undefined>;

    runScenario({
      description: 'AND an event handler root node',
      before() {
        callback = jest.fn<NodeDefinition | undefined>(
          (event: MusterEvent): NodeDefinition | undefined =>
            isNodeDefinition(event.payload) ? event.payload : undefined,
        );
      },
      graph: () => muster(on(callback, value('foo'))),
      operations: [
        operation({
          description: 'AND a subscription is created to the root node',
          input: root(),
          expected: value('foo'),
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'AND an event is dispatched with an empty payload',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'event:foo', payload: undefined }),
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(1);
                expect(callback).toHaveBeenCalledWith(
                  { type: 'event:foo', payload: undefined },
                  expect.anything(),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
            operation({
              description: 'AND an event is dispatched with a non-empty payload',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'event:foo', payload: 'payload:foo' }),
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(1);
                expect(callback).toHaveBeenCalledWith(
                  { type: 'event:foo', payload: 'payload:foo' },
                  expect.anything(),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
            operation({
              description: 'AND an event is dispatched with a payload that causes a value update',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'event:foo', payload: value('bar') }),
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(1);
                expect(callback).toHaveBeenCalledWith(
                  { type: 'event:foo', payload: value('bar') },
                  expect.anything(),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('bar'));
              },
              operations: [
                operation({
                  description: 'AND the event handler node is reset',
                  before: () => jest.clearAllMocks(),
                  input: reset(root()),
                  expected: ok(),
                  assert: () => {
                    expect(callback).toHaveBeenCalledTimes(0);
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(value('foo'));
                  },
                  operations: [
                    operation({
                      description: 'AND the root node is fetched again',
                      before: () => {
                        subscriber().subscription.unsubscribe();
                      },
                      input: root(),
                      expected: value('foo'),
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

  describe('GIVEN an event handler that optionally updates a node based on parameters', () => {
    let callback: jest.Mock<NodeDefinition | undefined>;

    runScenario({
      description: 'AND a nested event handler node',
      before() {
        callback = jest.fn(
          (event: MusterEvent, params: Params): NodeDefinition | void => {
            if (event.type !== 'event:update') {
              return;
            }
            const { id, data } = event.payload;
            if (id !== params.id) {
              return;
            }
            return value(data);
          },
        );
      },
      graph: () =>
        muster({
          items: {
            [match(types.string, 'id')]: on(callback, param('id')),
          },
        }),
      operations: [
        operation({
          description: 'AND a subscription is created to multiple nodes',
          input: query(
            root(),
            fields({
              returnedItems: key(value('items'), {
                'item:0': key(value('item:0')),
                'item:1': key(value('item:1')),
                'item:2': key(value('item:2')),
              }),
            }),
          ),
          expected: value({
            returnedItems: {
              'item:0': 'item:0',
              'item:1': 'item:1',
              'item:2': 'item:2',
            },
          }),
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'AND an event is dispatched with a payload that causes a value update',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'event:update', payload: { id: 'item:1', data: 'foo' } }),
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(3);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    returnedItems: {
                      'item:0': 'item:0',
                      'item:1': 'foo',
                      'item:2': 'item:2',
                    },
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND an another value update event is dispatched',
                  before: () => jest.clearAllMocks(),
                  input: dispatch({ type: 'event:update', payload: { id: 'item:2', data: 'bar' } }),
                  assert: () => {
                    expect(callback).toHaveBeenCalledTimes(3);
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        returnedItems: {
                          'item:0': 'item:0',
                          'item:1': 'foo',
                          'item:2': 'bar',
                        },
                      }),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND one of the event handler nodes is reset',
                      before: () => {
                        jest.clearAllMocks();
                      },
                      input: reset('items', 'item:2'),
                      expected: ok(),
                      assert: () => {
                        expect(callback).toHaveBeenCalledTimes(0);
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            returnedItems: {
                              'item:0': 'item:0',
                              'item:1': 'foo',
                              'item:2': 'item:2',
                            },
                          }),
                        );
                      },
                    }),
                  ],
                }),
              ],
            }),
            operation({
              description: 'AND an event is dispatched with an ignored payload',
              before: () => jest.clearAllMocks(),
              input: dispatch({
                type: 'event:update',
                payload: { id: 'item:missing', data: 'foo' },
              }),
              assert: () => {
                expect(callback).toHaveBeenCalledTimes(3);
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    });
  });
});
