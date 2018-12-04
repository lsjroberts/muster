import muster, {
  applyTransforms,
  ascending,
  descending,
  entries,
  get,
  iterate,
  query,
  ref,
  sort,
  value,
} from '../../..';
import { operation, runScenario } from '../../../test';

describe('sort()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [3, 1, 5, 6, 2, 4],
          ascendingNumbers: applyTransforms(ref('numbers'), [sort(ascending())]),
          descendingNumbers: applyTransforms(ref('numbers'), [sort(descending())]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of ascending numbers',
          input: query(ref('ascendingNumbers'), entries()),
          expected: value([1, 2, 3, 4, 5, 6]),
        }),
        operation({
          description: 'WHEN getting a list of descending numbers',
          input: query(ref('descendingNumbers'), entries()),
          expected: value([6, 5, 4, 3, 2, 1]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          ascendingNameProducts: applyTransforms(ref('products'), [
            sort(ascending((item) => get(item, 'name'))),
          ]),
          descendingNameProducts: applyTransforms(ref('products'), [
            sort(descending((item) => get(item, 'name'))),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting an ascending list of products',
          input: query(
            ref('ascendingNameProducts'),
            entries({
              name: true,
              category: true,
            }),
          ),
          expected: value([
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Kiwi', category: 'Fruit' },
            { name: 'Pear', category: 'Fruit' },
          ]),
        }),
        operation({
          description: 'WHEN getting a descending list of products',
          input: query(
            ref('descendingNameProducts'),
            entries({
              name: true,
              category: true,
            }),
          ),
          expected: value([
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Apple', category: 'Fruit' },
          ]),
        }),
      ],
    });
  });

  describe('Using iterators', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [3, 1, 5, 6, 2, 4],
          ascendingNumbers: iterate(ref('numbers'), [sort(ascending())]),
          descendingNumbers: iterate(ref('numbers'), [sort(descending())]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of ascending numbers',
          input: query(ref('ascendingNumbers'), entries()),
          expected: value([1, 2, 3, 4, 5, 6]),
        }),
        operation({
          description: 'WHEN getting a list of descending numbers',
          input: query(ref('descendingNumbers'), entries()),
          expected: value([6, 5, 4, 3, 2, 1]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          ascendingNameProducts: iterate(ref('products'), [
            sort(ascending((item) => get(item, 'name'))),
          ]),
          descendingNameProducts: iterate(ref('products'), [
            sort(descending((item) => get(item, 'name'))),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting an ascending list of products',
          input: query(
            ref('ascendingNameProducts'),
            entries({
              name: true,
              category: true,
            }),
          ),
          expected: value([
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Kiwi', category: 'Fruit' },
            { name: 'Pear', category: 'Fruit' },
          ]),
        }),
        operation({
          description: 'WHEN getting a descending list of products',
          input: query(
            ref('descendingNameProducts'),
            entries({
              name: true,
              category: true,
            }),
          ),
          expected: value([
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Apple', category: 'Fruit' },
          ]),
        }),
      ],
    });
  });
});
