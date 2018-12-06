import muster, { action, array, call, ref, set, value, variable } from '../..';
import { operation, runScenario } from '../../test';
import { combineLatest } from './combine-latest';

describe('combineLatest()', () => {
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
        input: combineLatest([call('action'), ref('value')]),
        expected: array([value('test action'), value('test value')]),
      }),
    ],
  });
  runScenario({
    description: 'GIVEN a muster graph containing stateful nodes',
    graph: () =>
      muster({
        value: variable('initial'),
      }),
    operations: [
      operation({
        description: 'AND a combineLatest node that depends on to the stateful node',
        input: combineLatest([ref('value'), value('static')]),
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
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                array([value('updated'), value('static')]),
              );
            },
          }),
        ],
      }),
    ],
  });
});
