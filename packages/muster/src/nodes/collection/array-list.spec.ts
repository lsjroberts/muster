import muster, {
  arrayList,
  clear,
  entries,
  head,
  ok,
  push,
  query,
  ref,
  set,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';

describe('arrayList()', () => {
  runScenario({
    description: 'GIVEN an array list containing three variables',
    graph: () =>
      muster({
        list: arrayList([variable('initial'), variable('initial'), variable('initial')]),
      }),
    operations: [
      operation({
        description: 'WHEN making a query to get these variables',
        input: query(ref('list'), entries()),
        expected: value(['initial', 'initial', 'initial']),
        operations: (subscriber) => [
          operation({
            description: 'AND the first variable is set to `updated`',
            before() {
              jest.clearAllMocks();
            },
            input: set(head(ref('list')), 'updated'),
            expected: value('updated'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value(['updated', 'initial', 'initial']),
              );
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an array list containing no items',
    graph: () =>
      muster({
        list: arrayList([]),
      }),
    operations: [
      operation({
        description: 'WHEN the list of item is requested',
        input: query(ref('list'), entries()),
        expected: value([]),
        operations: (subscriber) => [
          operation({
            description: 'AND an item gets added to the list',
            before() {
              jest.clearAllMocks();
            },
            input: push(ref('list'), 1),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value([1]));
            },
            operations: [
              operation({
                description: 'AND the array is cleared',
                before() {
                  jest.clearAllMocks();
                },
                input: clear(ref('list')),
                expected: ok(),
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value([]));
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
