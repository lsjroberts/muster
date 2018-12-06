import muster, { GraphNode, invalidate, ok, root, value } from '../..';
import { operation, runScenario } from '../../test';
import { factory } from './factory';

describe('factory', () => {
  let nodeFactory: () => GraphNode;
  let currentValue: any;
  beforeEach(() => {
    nodeFactory = jest.fn<GraphNode>(() => value(currentValue));
  });

  runScenario({
    description: 'GIVEN a factory root node',
    graph: () => muster(factory(nodeFactory)),
    operations: [
      operation({
        description: 'SHOULD NOT call the factory function when creating the node',
        assert() {
          expect(nodeFactory).toHaveBeenCalledTimes(0);
        },
      }),
      operation({
        description: 'SHOULD NOT call the factory function when unrelated nodes are evaluated',
        input: value('unrelated'),
        assert: () => {
          expect(nodeFactory).toHaveBeenCalledTimes(0);
        },
      }),
      operation({
        description: 'SHOULD return create a new instance when subscribed',
        input: root(),
        expected: value('foo'),
        before() {
          currentValue = 'foo';
          jest.clearAllMocks();
        },
        assert() {
          expect(nodeFactory).toHaveBeenCalledTimes(1);
        },
        operations: (subscriber) => [
          operation({
            description:
              'SHOULD create a new instance when the subscription is closed and reopened',
            input: root(),
            expected: value('bar'),
            before() {
              subscriber().subscription.unsubscribe();
              currentValue = 'bar';
              jest.clearAllMocks();
            },
            assert() {
              expect(nodeFactory).toHaveBeenCalledTimes(1);
            },
          }),
          operation({
            description: 'SHOULD create a new instance when invalidated',
            input: invalidate(root()),
            expected: ok(),
            before() {
              currentValue = 'bar';
              jest.clearAllMocks();
            },
            assert() {
              expect(nodeFactory).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('bar'));
            },
            operations: [
              operation({
                description:
                  'SHOULD create a new instance when the subscription is closed and reopened',
                input: root(),
                expected: value('baz'),
                before() {
                  subscriber().subscription.unsubscribe();
                  currentValue = 'baz';
                  jest.clearAllMocks();
                },
                assert() {
                  expect(nodeFactory).toHaveBeenCalledTimes(1);
                },
              }),
            ],
          }),
          operation({
            description: 'SHOULD NOT create a new instance when another subscription is opened',
            input: root(),
            expected: value('foo'),
            before() {
              currentValue = 'foo';
              jest.clearAllMocks();
            },
            assert: () => {
              expect(nodeFactory).toHaveBeenCalledTimes(0);
              expect(subscriber().next).toHaveBeenCalledTimes(0);
            },
          }),
        ],
      }),
    ],
  });
});
