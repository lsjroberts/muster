import muster, { applyTransforms, entries, iterate, query, ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { firstItem } from './first-item';

describe('firstItem()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          filteredNumbers: applyTransforms(ref('numbers'), [firstItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered items',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([1]),
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
          filteredProducts: applyTransforms(ref('products'), [firstItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered products',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }]),
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
          filteredProducts: applyTransforms(ref('products'), [ref('firstItemFilter')]),
          firstItemFilter: firstItem(),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered products',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }]),
        }),
      ],
    });
  });

  describe('Using iterators', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          filteredNumbers: iterate(ref('numbers'), [firstItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered items',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([1]),
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
          filteredProducts: iterate(ref('products'), [firstItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered products',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }]),
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
          filteredProducts: iterate(ref('products'), [ref('firstItemFilter')]),
          firstItemFilter: firstItem(),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered products',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }]),
        }),
      ],
    });
  });
});
