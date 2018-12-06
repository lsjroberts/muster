import muster, { arrayList, entries, key, ok, query, ref, toNode, value } from '../..';
import { operation, runScenario } from '../../test';
import { push } from './push';

describe('push()', () => {
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
            description: 'AND the new number is pushed to the collection',
            before() {
              jest.clearAllMocks();
            },
            input: push(ref('numbers'), -5),
            expected: ok(),
            assert() {
              expect(subscriber1().next).toHaveBeenCalledTimes(1);
              expect(subscriber1().next).toHaveBeenCalledWith(value([1, 2, 3, -5]));
            },
            operations: (subscriber2) => [
              operation({
                description: 'AND the numbers get re-requested (with previous subscription open)',
                before() {
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([1, 2, 3, -5]),
              }),
              operation({
                description: 'AND the numbers get re-requested (with previous subscription closed)',
                before() {
                  subscriber1().subscription.unsubscribe();
                  subscriber2().subscription.unsubscribe();
                  jest.clearAllMocks();
                },
                input: query(ref('numbers'), entries()),
                expected: value([1, 2, 3, -5]),
              }),
              operation({
                description: 'AND another number is pushed to the collection',
                before() {
                  jest.clearAllMocks();
                },
                input: push(ref('numbers'), -5),
                expected: ok(),
                assert() {
                  expect(subscriber1().next).toHaveBeenCalledTimes(1);
                  expect(subscriber1().next).toHaveBeenCalledWith(value([1, 2, 3, -5, -5]));
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
            description: 'AND a new person is pushed to the collection',
            before() {
              jest.clearAllMocks();
            },
            input: push(ref('people'), toNode({ firstName: 'Genevieve', lastName: 'Patrick' })),
            expected: ok(),
            assert() {
              expect(subscriber1().next).toHaveBeenCalledTimes(1);
              expect(subscriber1().next).toHaveBeenCalledWith(
                value([
                  { firstName: 'Lizzie', lastName: 'Ramirez' },
                  { firstName: 'Charlotte', lastName: 'Schneider' },
                  { firstName: 'Genevieve', lastName: 'Patrick' },
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
                  { firstName: 'Charlotte', lastName: 'Schneider' },
                  { firstName: 'Genevieve', lastName: 'Patrick' },
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
                  { firstName: 'Charlotte', lastName: 'Schneider' },
                  { firstName: 'Genevieve', lastName: 'Patrick' },
                ]),
              }),
              operation({
                description: 'AND another number is pushed to the collection',
                before() {
                  jest.clearAllMocks();
                },
                input: push(ref('people'), toNode({ firstName: 'Genevieve', lastName: 'Patrick' })),
                expected: ok(),
                assert() {
                  expect(subscriber1().next).toHaveBeenCalledTimes(1);
                  expect(subscriber1().next).toHaveBeenCalledWith(
                    value([
                      { firstName: 'Lizzie', lastName: 'Ramirez' },
                      { firstName: 'Charlotte', lastName: 'Schneider' },
                      { firstName: 'Genevieve', lastName: 'Patrick' },
                      { firstName: 'Genevieve', lastName: 'Patrick' },
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
