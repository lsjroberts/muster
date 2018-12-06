import muster, { arrayList, entries, key, ok, query, ref, toNode, value } from '../..';
import { operation, runScenario } from '../../test';
import { addItemAt } from './add-item-at';

describe('addItemAt()', () => {
  runScenario({
    description: 'GIVEN an instance of muster containing a mutable collection of numbers',
    graph: () =>
      muster({
        numbers: arrayList([1, 2, 3]),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the initial value of collection',
        input: query(ref('numbers'), entries()),
        expected: value([1, 2, 3]),
        operations: (subscriber1) => [
          operation({
            description: 'AND the new number is inserted into the collection',
            before() {
              jest.clearAllMocks();
            },
            input: addItemAt(ref('numbers'), -5, 1),
            expected: ok(),
            assert() {
              expect(subscriber1().next).toHaveBeenCalledTimes(1);
              expect(subscriber1().next).toHaveBeenCalledWith(value([1, -5, 2, 3]));
            },
            operations: (subscriber2) => [
              operation({
                description: 'AND the numbers get re-requested (with previous subscription open)',
                before() {
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([1, -5, 2, 3]),
              }),
              operation({
                description: 'AND the numbers get re-requested (with previous subscription closed)',
                before() {
                  subscriber1().subscription.unsubscribe();
                  subscriber2().subscription.unsubscribe();
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([1, -5, 2, 3]),
              }),
              operation({
                description: 'AND another number is inserted into the collection',
                before() {
                  jest.clearAllMocks();
                },
                input: addItemAt(ref('numbers'), -5, 3),
                expected: ok(),
                assert() {
                  expect(subscriber1().next).toHaveBeenCalledTimes(1);
                  expect(subscriber1().next).toHaveBeenCalledWith(value([1, -5, 2, -5, 3]));
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an instance of muster containing a collection of branches',
    graph: () =>
      muster({
        people: arrayList([
          { firstName: 'Lizzie', lastName: 'Ramirez' },
          { firstName: 'Charlotte', lastName: 'Schneider' },
        ]),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the initial value of collection',
        input: query(
          ref('people'),
          entries({
            firstName: key('firstName'),
            lastName: key('lastName'),
          }),
        ),
        expected: value([
          { firstName: 'Lizzie', lastName: 'Ramirez' },
          { firstName: 'Charlotte', lastName: 'Schneider' },
        ]),
        operations: (subscriber1) => [
          operation({
            description: 'AND a new person is inserted into the collection',
            before() {
              jest.clearAllMocks();
            },
            input: addItemAt(
              ref('people'),
              toNode({ firstName: 'Genevieve', lastName: 'Patrick' }),
              1,
            ),
            expected: ok(),
            assert() {
              expect(subscriber1().next).toHaveBeenCalledTimes(1);
              expect(subscriber1().next).toHaveBeenCalledWith(
                value([
                  { firstName: 'Lizzie', lastName: 'Ramirez' },
                  { firstName: 'Genevieve', lastName: 'Patrick' },
                  { firstName: 'Charlotte', lastName: 'Schneider' },
                ]),
              );
            },
            operations: (subscriber2) => [
              operation({
                description:
                  'AND the collection get re-requested (with previous subscription open)',
                before() {
                  jest.clearAllMocks();
                },
                input: query(
                  ref('people'),
                  entries({
                    firstName: key('firstName'),
                    lastName: key('lastName'),
                  }),
                ),
                expected: value([
                  { firstName: 'Lizzie', lastName: 'Ramirez' },
                  { firstName: 'Genevieve', lastName: 'Patrick' },
                  { firstName: 'Charlotte', lastName: 'Schneider' },
                ]),
              }),
              operation({
                description:
                  'AND the collection get re-requested (with previous subscription closed)',
                before() {
                  subscriber1().subscription.unsubscribe();
                  subscriber2().subscription.unsubscribe();
                  jest.clearAllMocks();
                },
                input: query(
                  ref('people'),
                  entries({
                    firstName: key('firstName'),
                    lastName: key('lastName'),
                  }),
                ),
                expected: value([
                  { firstName: 'Lizzie', lastName: 'Ramirez' },
                  { firstName: 'Genevieve', lastName: 'Patrick' },
                  { firstName: 'Charlotte', lastName: 'Schneider' },
                ]),
              }),
              operation({
                description: 'AND another number is inserted to the collection',
                before() {
                  jest.clearAllMocks();
                },
                input: addItemAt(
                  ref('people'),
                  toNode({ firstName: 'Genevieve', lastName: 'Patrick' }),
                  2,
                ),
                expected: ok(),
                assert() {
                  expect(subscriber1().next).toHaveBeenCalledTimes(1);
                  expect(subscriber1().next).toHaveBeenCalledWith(
                    value([
                      { firstName: 'Lizzie', lastName: 'Ramirez' },
                      { firstName: 'Genevieve', lastName: 'Patrick' },
                      { firstName: 'Genevieve', lastName: 'Patrick' },
                      { firstName: 'Charlotte', lastName: 'Schneider' },
                    ]),
                  );
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
