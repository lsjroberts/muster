import muster, {
  applyTransforms,
  arrayList,
  entries,
  eq,
  filter,
  get,
  head,
  NodeDefinition,
  ok,
  query,
  ref,
  removeItem,
  value,
} from '../..';
import { operation, runScenario } from '../../test';

describe('removeItem()', () => {
  runScenario({
    description: 'GIVEN an arrayList with numbers',
    graph: () =>
      muster({
        numbers: arrayList([1, 2, 3]),
      }),
    operations: [
      operation({
        description: 'WHEN the list of items is requested',
        input: query(ref('numbers'), entries()),
        expected: value([1, 2, 3]),
        operations: (subscriber) => [
          operation({
            description: 'AND an item 1 is removed',
            before() {
              jest.clearAllMocks();
            },
            input: removeItem(
              ref('numbers'),
              head(
                applyTransforms(ref('numbers'), [filter((item: NodeDefinition) => eq(item, 1))]),
              ),
            ),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value([2, 3]));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an array list with trees',
    graph: () =>
      muster({
        people: arrayList([
          { id: 1, name: 'Charlotte' },
          { id: 2, name: 'Jane' },
          { id: 3, name: 'Kate' },
        ]),
      }),
    operations: [
      operation({
        description: 'WHEN the list of people is requested',
        input: query(
          ref('people'),
          entries({
            id: true as true,
            name: true as true,
          }),
        ),
        expected: value([
          { id: 1, name: 'Charlotte' },
          { id: 2, name: 'Jane' },
          { id: 3, name: 'Kate' },
        ]),
        operations: (subscriber) => [
          operation({
            description: 'AND Jane is removed',
            before() {
              jest.clearAllMocks();
            },
            input: removeItem(
              ref('people'),
              head(
                applyTransforms(ref('people'), [
                  filter((item: NodeDefinition) => eq(get(item, 'name'), 'Jane')),
                ]),
              ),
            ),
            expected: ok(),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value([{ id: 1, name: 'Charlotte' }, { id: 3, name: 'Kate' }]),
              );
            },
          }),
        ],
      }),
    ],
  });
});
