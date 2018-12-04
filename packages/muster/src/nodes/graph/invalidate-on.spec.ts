import {
  action,
  call,
  computed,
  default as muster,
  dispatch,
  fromPromise,
  ifPending,
  MusterEvent,
  NodeDefinition,
  ref,
  root,
  value,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { invalidateOn } from './invalidate-on';

describe('invalidateOn()', () => {
  const EVENT_FOO = '$$event:foo';
  const EVENT_BAR = '$$event:bar';
  const EVENT_BAZ = '$$event:baz';

  let currentValue: string;
  let callback: jest.Mock<Promise<NodeDefinition>>;

  runTests('GIVEN an invalidateOn node with an event name as the invalidation trigger', EVENT_FOO);
  runTests('GIVEN an invalidateOn node with an array of event names as the invalidation trigger', [
    EVENT_BAZ,
    EVENT_FOO,
  ]);
  runTests(
    'GIVEN an invalidateOn node with a predicate function as the invalidation trigger',
    (event) => event.type === EVENT_FOO,
  );

  function runTests(
    description: string,
    trigger: MusterEvent['type'] | Array<MusterEvent['type']> | ((event: MusterEvent) => boolean),
  ) {
    describe(description, () => {
      runScenario({
        description: 'GIVEN a simple root node wrapped in an invalidateOn node',
        before: () => {
          currentValue = 'foo';
          callback = jest.fn(() => Promise.resolve(value(currentValue)));
        },
        graph: () => muster(invalidateOn(trigger, fromPromise(callback))),
        operations: [
          operation({
            description: 'AND a request is made for the root node',
            input: ifPending(() => value('PENDING'), root()),
            expected: [value('PENDING'), value('foo')],
            operations: (subscriber: () => MockSubscriber) => [
              operation({
                description: 'AND the current value is updated',
                before: () => {
                  jest.clearAllMocks();
                  currentValue = 'bar';
                },
                assert: () => {
                  expect(subscriber().next).toHaveBeenCalledTimes(0);
                  expect(callback).toHaveBeenCalledTimes(0);
                },
                operations: [
                  operation({
                    description: 'AND an invalidateOn event is dispatched',
                    before: () => {
                      jest.clearAllMocks();
                    },
                    input: dispatch({ type: EVENT_FOO, payload: undefined }),
                    assert: () => {
                      expect(callback).toHaveBeenCalledTimes(1);
                      expect(subscriber().next).toHaveBeenCalledTimes(2);
                      expect(subscriber().next).toHaveBeenCalledWith(value('PENDING'));
                      expect(subscriber().next).toHaveBeenLastCalledWith(value('bar'));
                    },
                    operations: [
                      operation({
                        description: 'AND another invalidateOn event is dispatched',
                        before: () => {
                          jest.clearAllMocks();
                        },
                        input: dispatch({ type: EVENT_FOO, payload: undefined }),
                        assert: () => {
                          expect(callback).toHaveBeenCalledTimes(1);
                          expect(subscriber().next).toHaveBeenCalledTimes(2);
                          expect(subscriber().next).toHaveBeenCalledWith(value('PENDING'));
                          expect(subscriber().next).toHaveBeenLastCalledWith(value('bar'));
                        },
                      }),
                    ],
                  }),
                  operation({
                    description: 'AND an unrecognised event is dispatched',
                    before: () => {
                      jest.clearAllMocks();
                    },
                    input: dispatch({ type: EVENT_BAR, payload: undefined }),
                    assert: () => {
                      expect(callback).toHaveBeenCalledTimes(0);
                      expect(subscriber().next).toHaveBeenCalledTimes(0);
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      runScenario({
        description: 'GIVEN a computed invalidatable root node wrapped in an invalidateOn node',
        before: () => {
          currentValue = 'foo';
          callback = jest.fn(() => Promise.resolve(value(currentValue)));
        },
        graph: () =>
          muster(invalidateOn(trigger, computed([value('foo')], () => fromPromise(callback)))),
        operations: [
          operation({
            description: 'AND a request is made for the root node',
            input: ifPending(() => value('PENDING'), root()),
            expected: [value('PENDING'), value('foo')],
            operations: (subscriber: () => MockSubscriber) => [
              operation({
                description: 'AND the current value is updated',
                before: () => {
                  jest.clearAllMocks();
                  currentValue = 'bar';
                },
                assert: () => {
                  expect(subscriber().next).toHaveBeenCalledTimes(0);
                  expect(callback).toHaveBeenCalledTimes(0);
                },
                operations: [
                  operation({
                    description: 'AND an invalidateOn event is dispatched',
                    before: () => {
                      jest.clearAllMocks();
                    },
                    input: dispatch({ type: EVENT_FOO, payload: undefined }),
                    assert: () => {
                      expect(callback).toHaveBeenCalledTimes(1);
                      expect(subscriber().next).toHaveBeenCalledTimes(2);
                      expect(subscriber().next).toHaveBeenCalledWith(value('PENDING'));
                      expect(subscriber().next).toHaveBeenLastCalledWith(value('bar'));
                    },
                    operations: [
                      operation({
                        description: 'AND another invalidateOn event is dispatched',
                        before: () => {
                          jest.clearAllMocks();
                        },
                        input: dispatch({ type: EVENT_FOO, payload: undefined }),
                        assert: () => {
                          expect(callback).toHaveBeenCalledTimes(1);
                          expect(subscriber().next).toHaveBeenCalledTimes(2);
                          expect(subscriber().next).toHaveBeenCalledWith(value('PENDING'));
                          expect(subscriber().next).toHaveBeenLastCalledWith(value('bar'));
                        },
                      }),
                    ],
                  }),
                  operation({
                    description: 'AND an unrecognised event is dispatched',
                    before: () => {
                      jest.clearAllMocks();
                    },
                    input: dispatch({ type: EVENT_BAR, payload: undefined }),
                    assert: () => {
                      expect(callback).toHaveBeenCalledTimes(0);
                      expect(subscriber().next).toHaveBeenCalledTimes(0);
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });
  }

  describe('GIVEN an action which dispatches invalidate event', () => {
    let mockAction: jest.Mock<any>;
    let testValue: any = 'Initial value';

    beforeEach(() => {
      mockAction = jest.fn(function*() {
        testValue = 'Updated value';
        yield dispatch({ type: EVENT_FOO, payload: undefined });
      });
    });

    runScenario({
      description: 'WHEN the invalidation is triggered from the action',
      graph: () =>
        muster({
          branch: {
            testValue: invalidateOn(EVENT_FOO, fromPromise(() => Promise.resolve(testValue))),
            testAction: action(mockAction),
          },
        }),
      before: () => {
        jest.clearAllMocks();
      },
      operations: [
        operation({
          description: 'AND the test value is requested',
          input: ref('branch', 'testValue'),
          expected: value('Initial value'),
          operations: (testValueSubscriber: () => MockSubscriber) => [
            operation({
              description: 'AND the action gets called',
              input: call(ref('branch', 'testAction')),
              before: () => {
                jest.clearAllMocks();
              },
              assert: () => {
                expect(mockAction).toHaveBeenCalledTimes(1);
                expect(testValueSubscriber().next).toHaveBeenCalledTimes(1);
                expect(testValueSubscriber().next).toHaveBeenLastCalledWith(value('Updated value'));
              },
            }),
          ],
        }),
      ],
    });
  });
});
