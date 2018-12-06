import muster, { action, call, GraphNode, ref, resolve, set, value, variable } from '../..';
import { operation, runScenario } from '../../test';
import { takeLast } from './take-last';

describe('takeLast()', () => {
  runScenario({
    description: 'GIVEN a graph containing a variable and action',
    graph: () =>
      muster({
        name: variable('initial name'),
        updateName: action(function*(name) {
          yield set('name', name);
        }),
      }),
    operations: [
      operation({
        description: 'WHEN calling `updateName` and then retrieving `name`',
        input: takeLast([call('updateName', ['updated name']), ref('name')]),
        expected: value('updated name'),
      }),
    ],
  });

  runScenario(() => {
    let callback: jest.Mock<GraphNode>;
    return {
      description: 'GIVEN a takeLast dependency that depends on a variable',
      before() {
        callback = jest.fn(([value]: [GraphNode]) => value);
      },
      graph: () =>
        muster({
          name: variable('initial'),
          input: takeLast([ref('name'), value('result')]),
          output: resolve([{ target: ref('input') }], callback),
        }),
      operations: [
        operation({
          description: 'AND a subscription is created to the output value',
          input: ref('output'),
          expected: value('result'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(callback).toHaveBeenCalledTimes(1);
          },
          operations: [
            operation({
              description: 'AND the ignored node is updated',
              before() {
                jest.clearAllMocks();
              },
              input: set('name', 'updated'),
              assert() {
                expect(callback).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    };
  });
});
