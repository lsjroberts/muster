import muster, { action, array, call, ref, set, value, variable } from '../..';
import { operation, runScenario } from '../../test';
import { parallel } from './parallel';

describe('parallel()', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        action: action(() => value('test action')),
        value: value('test value'),
      }),
    operations: [
      operation({
        description: 'WHEN the query is made to multiple nodes',
        input: parallel([call('action'), ref('value')]),
        expected: array([value('test action'), value('test value')]),
      }),
    ],
  });
  runScenario({
    description: 'GIVEN a muster graph containing a stateful node that emit multiple values',
    graph: () =>
      muster({
        value: variable('initial'),
      }),
    operations: [
      operation({
        description: 'AND a parallel node that depends on the stateful node is resolved',
        input: parallel([ref('value'), value('static')]),
        expected: array([value('initial'), value('static')]),
        operations: (subscriber) => [
          operation({
            description: 'AND the stateful node re-emits',
            input: set('value', 'updated'),
            expected: value('updated'),
            before() {
              jest.clearAllMocks();
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
