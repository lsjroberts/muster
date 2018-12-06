import {
  apply,
  computed,
  default as muster,
  dispatch,
  fn,
  ref,
  reset,
  resetVariablesInScope,
  set,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import { ok } from './ok';
import { on } from './on';

describe('dispatch()', () => {
  runScenario({
    description: 'GIVEN the graph containing an `on` node',
    graph: () =>
      muster({
        first: on((event) => {
          if (event.type === 'update') return 'updated';
          return undefined;
        }, 'initial'),
      }),
    operations: [
      operation({
        description: 'WHEN the `first` is requested',
        input: ref('first'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the `update` event is dispatched',
            before() {
              jest.clearAllMocks();
            },
            input: dispatch('update'),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a variable',
    graph: () =>
      muster({
        myVariable: variable('initial value'),
      }),
    operations: [
      operation({
        description: 'WHEN the initial value gets requested',
        input: ref('myVariable'),
        expected: value('initial value'),
        operations: (initialSubscriber) => [
          operation({
            description: 'AND variable subscription gets unsubscribed before setting',
            before() {
              initialSubscriber().subscription.unsubscribe();
            },
            input: set(ref('myVariable'), 'updated value'),
            expected: value('updated value'),
            operations: [
              operation({
                description: 'AND the value of that variable gets requested',
                input: ref('myVariable'),
                expected: value('updated value'),
                operations: (updatedValueSubscriber) => [
                  operation({
                    description: 'AND the clear value event gets dispatched',
                    before() {
                      updatedValueSubscriber().subscription.unsubscribe();
                    },
                    input: dispatch(resetVariablesInScope()),
                    expected: ok(),
                    operations: [
                      operation({
                        description: 'AND the variable gets requested',
                        input: ref('myVariable'),
                        expected: value('initial value'),
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

  runScenario({
    description: 'GIVEN an event trigger variable, an event listener and an event dispatcher',
    graph: () =>
      muster({
        trigger: variable(undefined),
        dispatcher: fn((trigger) =>
          computed([trigger], (resolvedTrigger) =>
            dispatch({
              type: 'event:foo',
              payload: {
                value: resolvedTrigger,
              },
            }),
          ),
        ),
        output: on(
          (event) =>
            event.type === 'event:foo' ? value(`value:${event.payload.value}`) : undefined,
          value('value:initial'),
        ),
      }),
    operations: [
      operation({
        description: 'AND a subscription is created to the event listener',
        input: ref('output'),
        expected: value('value:initial'),
        operations: (outputSubscriber) => [
          operation({
            description: 'AND the trigger variable is hooked up to the event dispatcher',
            input: apply([ref('trigger')], ref('dispatcher')),
            expected: ok(),
            operations: (actionSubscriber) => [
              operation({
                description: 'AND the trigger variable is updated',
                input: set('trigger', value('foo')),
                expected: value('foo'),
                before() {
                  jest.clearAllMocks();
                },
                assert() {
                  expect(outputSubscriber().next).toHaveBeenCalledTimes(1);
                  expect(outputSubscriber().next).toHaveBeenCalledWith(value('value:foo'));
                  expect(actionSubscriber().next).toHaveBeenCalledTimes(0);
                },
                operations: [
                  operation({
                    description: 'AND the trigger variable is updated again',
                    input: set('trigger', value('bar')),
                    expected: value('bar'),
                    before() {
                      jest.clearAllMocks();
                    },
                    assert() {
                      expect(outputSubscriber().next).toHaveBeenCalledTimes(1);
                      expect(outputSubscriber().next).toHaveBeenCalledWith(value('value:bar'));
                      expect(actionSubscriber().next).toHaveBeenCalledTimes(0);
                    },
                  }),
                  operation({
                    description: 'AND the trigger variable is reset',
                    input: reset('trigger'),
                    expected: ok(),
                    before() {
                      jest.clearAllMocks();
                    },
                    assert() {
                      expect(outputSubscriber().next).toHaveBeenCalledTimes(1);
                      expect(outputSubscriber().next).toHaveBeenCalledWith(
                        value('value:undefined'),
                      );
                      expect(actionSubscriber().next).toHaveBeenCalledTimes(0);
                    },
                  }),
                ],
              }),
              operation({
                description: 'AND the trigger is set to the existing value',
                input: set('trigger', value(undefined)),
                expected: value(undefined),
                before() {
                  jest.clearAllMocks();
                },
                assert() {
                  expect(outputSubscriber().next).toHaveBeenCalledTimes(0);
                  expect(actionSubscriber().next).toHaveBeenCalledTimes(0);
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
