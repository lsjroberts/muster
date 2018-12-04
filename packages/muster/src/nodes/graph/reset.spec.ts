import muster, { action, call, ok, ref, series, set, value, variable } from '../..';
import { operation, runScenario } from '../../test';
import { reset } from './reset';

describe('reset()', () => {
  runScenario({
    description: 'GIVEN a muster graph containing a variable',
    graph: () =>
      muster({
        variable: variable('initial'),
        variableRef: ref('variable'),
      }),
    operations: [
      operation({
        description: 'WHEN the variable gets reset',
        input: reset(ref('variable')),
        expected: ok(),
        operations: [
          operation({
            description: 'AND then the value gets requested',
            input: ref('variable'),
            expected: value('initial'),
          }),
        ],
      }),
      operation({
        description: 'WHEN the variable gets requested',
        input: ref('variable'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the variable gets reset',
            before() {
              jest.clearAllMocks();
            },
            input: reset(ref('variable')),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(0);
            },
          }),
        ],
      }),
      operation({
        description: 'WHEN the variable gets requested',
        input: ref('variable'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the variable gets set',
            before() {
              jest.clearAllMocks();
            },
            input: set(ref('variable'), 'updated'),
            expected: value('updated'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
            operations: [
              operation({
                description: 'AND the variable gets reset',
                before() {
                  jest.clearAllMocks();
                },
                input: reset(ref('variable')),
                expected: ok(),
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value('initial'));
                },
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN the variable gets set',
        input: set(ref('variable'), 'updated'),
        expected: value('updated'),
        operations: [
          operation({
            description: 'AND the variable gets requested',
            input: ref('variable'),
            expected: value('updated'),
            operations: (subscriber) => [
              operation({
                description: 'AND the variable gets reset',
                before() {
                  jest.clearAllMocks();
                },
                input: reset(ref('variable')),
                expected: ok(),
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value('initial'));
                },
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN the variable is set and reset from a series',
        input: series([set(ref('variable'), 'updated'), reset(ref('variable')), ref('variable')]),
        expected: value('initial'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a variable and an action',
    graph: () =>
      muster({
        variable: variable('initial'),
        variableRef: ref('variable'),
        action: action(function*() {
          yield set(ref('variable'), 'updated');
          yield reset(ref('variable'));
          return yield ref('variable');
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the action is getting called',
        input: call(ref('action')),
        expected: value('initial'),
      }),
    ],
  });
});
