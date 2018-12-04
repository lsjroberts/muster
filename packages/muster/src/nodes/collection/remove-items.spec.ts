import muster, {
  arrayList,
  entries,
  eq,
  fn,
  get,
  gt,
  key,
  mod,
  ok,
  query,
  ref,
  startsWith,
  value,
} from '../..';
import { operation, runScenario } from '../../test';
import { removeItems } from './remove-items';

describe('removeItems()', () => {
  runScenario({
    description: 'GIVEN an instance of muster containing a mutable collection of numbers',
    graph: () =>
      muster({
        numbers: arrayList([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the initial value of collection',
        input: query(ref('numbers'), entries()),
        expected: value([1, 2, 3, 4, 5, 6, 7, 8, 9]),
        operations: (subscriber1) => [
          operation({
            description: 'AND numbers greater than five are removed from the collection',
            before() {
              jest.clearAllMocks();
            },
            input: removeItems(ref('numbers'), fn((item) => gt(item, 5))),
            expected: ok(),
            assert() {
              expect(subscriber1().next).toHaveBeenCalledTimes(1);
              expect(subscriber1().next).toHaveBeenCalledWith(value([1, 2, 3, 4, 5]));
            },
            operations: (subscriber2) => [
              operation({
                description: 'AND the numbers get re-requested (with previous subscription open)',
                before() {
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([1, 2, 3, 4, 5]),
              }),
              operation({
                description: 'AND the numbers get re-requested (with previous subscription closed)',
                before() {
                  subscriber1().subscription.unsubscribe();
                  subscriber2().subscription.unsubscribe();
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([1, 2, 3, 4, 5]),
              }),
              operation({
                description: 'AND odd numbers are removed from the collection',
                before() {
                  jest.clearAllMocks();
                },
                input: removeItems(ref('numbers'), fn((item) => eq(mod(item, 2), 1))),
                expected: ok(),
                assert() {
                  expect(subscriber1().next).toHaveBeenCalledTimes(1);
                  expect(subscriber1().next).toHaveBeenCalledWith(value([2, 4]));
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
          { firstName: 'Craig', lastName: 'Glover' },
          { firstName: 'Nathan', lastName: 'Ritchie' },
          { firstName: 'George', lastName: 'Jacobs' },
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
          { firstName: 'Craig', lastName: 'Glover' },
          { firstName: 'Nathan', lastName: 'Ritchie' },
          { firstName: 'George', lastName: 'Jacobs' },
        ]),
        operations: (subscriber1) => [
          operation({
            description: 'AND people are removed from the collection',
            before() {
              jest.clearAllMocks();
            },
            input: removeItems(
              ref('people'),
              fn((item) => startsWith('C', get(item, 'firstName'))),
            ),
            expected: ok(),
            assert() {
              expect(subscriber1().next).toHaveBeenCalledTimes(1);
              expect(subscriber1().next).toHaveBeenCalledWith(
                value([
                  { firstName: 'Lizzie', lastName: 'Ramirez' },
                  { firstName: 'Nathan', lastName: 'Ritchie' },
                  { firstName: 'George', lastName: 'Jacobs' },
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
                  { firstName: 'Nathan', lastName: 'Ritchie' },
                  { firstName: 'George', lastName: 'Jacobs' },
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
                  { firstName: 'Nathan', lastName: 'Ritchie' },
                  { firstName: 'George', lastName: 'Jacobs' },
                ]),
              }),
              operation({
                description: 'AND more items are removed from the collection',
                before() {
                  jest.clearAllMocks();
                },
                input: removeItems(
                  ref('people'),
                  fn((item) => startsWith('R', get(item, 'lastName'))),
                ),
                expected: ok(),
                assert() {
                  expect(subscriber1().next).toHaveBeenCalledTimes(1);
                  expect(subscriber1().next).toHaveBeenCalledWith(
                    value([{ firstName: 'George', lastName: 'Jacobs' }]),
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
