import { default as muster, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { stateful } from './stateful';

describe('stateful', () => {
  describe('Simple subscription to the stateful node', () => {
    const myValue = stateful(false);

    runScenario({
      description: 'GIVEN the graph that contains the stateful node',
      graph: () => muster({ myValue }),
      operations: [
        operation({
          description: 'AND the initial value is requested',
          input: ref('myValue'),
          expected: value(false),
          operations: (myValueSubscriber) => [
            operation({
              description: 'AND the stateful node is updated',
              before() {
                jest.clearAllMocks();
                myValue.update(true);
              },
              assert() {
                expect(myValueSubscriber().next).toHaveBeenCalledTimes(1);
                expect(myValueSubscriber().next).toHaveBeenCalledWith(value(true));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('Multiple subscriptions to the stateful node', () => {
    const myValue = stateful(false);

    runScenario({
      description: 'GIVEN the graph that contains the stateful node',
      graph: () => muster({ myValue }),
      operations: [
        operation({
          description: 'AND the initial value is requested for the first time',
          input: ref('myValue'),
          expected: value(false),
          operations: (firstSubscriber) => [
            operation({
              description: 'AND the initial value is requested for the second time',
              input: ref('myValue'),
              expected: value(false),
              operations: (secondSubscriber) => [
                operation({
                  description: 'AND the stateful node is updated',
                  before() {
                    jest.clearAllMocks();
                    myValue.update(true);
                  },
                  assert() {
                    expect(firstSubscriber().next).toHaveBeenCalledTimes(1);
                    expect(firstSubscriber().next).toHaveBeenCalledWith(value(true));
                    expect(secondSubscriber().next).toHaveBeenCalledTimes(1);
                    expect(secondSubscriber().next).toHaveBeenCalledWith(value(true));
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });
});
