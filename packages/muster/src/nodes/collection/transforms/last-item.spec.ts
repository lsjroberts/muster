import muster, { applyTransforms, entries, iterate, query, ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { lastItem } from './last-item';

describe('lastItem()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          filteredNumbers: applyTransforms(ref('numbers'), [lastItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([6]),
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
          filteredProducts: applyTransforms(ref('products'), [lastItem()]),
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
          expected: value([{ name: 'Kiwi' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with ref to a filter',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: applyTransforms(ref('products'), [ref('lastItemFilter')]),
          lastItemFilter: lastItem(),
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
          expected: value([{ name: 'Kiwi' }]),
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
          filteredNumbers: iterate(ref('numbers'), [lastItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([6]),
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
          filteredProducts: iterate(ref('products'), [lastItem()]),
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
          expected: value([{ name: 'Kiwi' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with ref to a filter',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: iterate(ref('products'), [ref('lastItemFilter')]),
          lastItemFilter: lastItem(),
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
          expected: value([{ name: 'Kiwi' }]),
        }),
      ],
    });
  });
});
