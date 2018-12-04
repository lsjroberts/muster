import muster, { arrayList, entries, ok, query, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { clear } from './clear';

describe('clear()', () => {
  runScenario({
    description: 'GIVEN an instance of muster containing a mutable collection of numbers',
    graph: () =>
      muster({
        numbers: arrayList([1, 2, 3]),
      }),
    operations: [
      operation({
        description: 'AND a subscription is created to the collection',
        input: query(ref('numbers'), entries()),
        expected: value([1, 2, 3]),
        operations: (subscriber1) => [
          operation({
            description: 'AND the collection is cleared',
            before() {
              jest.clearAllMocks();
            },
            input: clear(ref('numbers')),
            expected: ok(),
            assert() {
              expect(subscriber1().next).toHaveBeenCalledTimes(1);
              expect(subscriber1().next).toHaveBeenCalledWith(value([]));
            },
            operations: (subscriber2) => [
              operation({
                description: 'AND the numbers get re-requested (with previous subscription open)',
                before() {
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([]),
              }),
              operation({
                description: 'AND the numbers get re-requested (with previous subscription closed)',
                before() {
                  subscriber1().subscription.unsubscribe();
                  subscriber2().subscription.unsubscribe();
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([]),
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
