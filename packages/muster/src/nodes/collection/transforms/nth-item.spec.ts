import muster, {
  applyTransforms,
  entries,
  iterate,
  query,
  ref,
  set,
  value,
  variable,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { nthItem } from './nth-item';

describe('nthItem()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          filteredNumbers: applyTransforms(ref('numbers'), [nthItem(1)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([2]),
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
          filteredProducts: applyTransforms(ref('products'), [nthItem(1)]),
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
          expected: value([{ name: 'Bicycle' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with a filter using a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: applyTransforms(ref('products'), [nthItem(ref('itemIndex'))]),
          itemIndex: variable(1),
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
          expected: value([{ name: 'Bicycle' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then the itemIndex is changed',
              before() {
                jest.clearAllMocks();
              },
              input: set('itemIndex', 2),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([{ name: 'Pear' }]));
              },
            }),
          ],
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
          filteredNumbers: iterate(ref('numbers'), [nthItem(1)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([2]),
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
          filteredProducts: iterate(ref('products'), [nthItem(1)]),
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
          expected: value([{ name: 'Bicycle' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with a filter using a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: iterate(ref('products'), [nthItem(ref('itemIndex'))]),
          itemIndex: variable(1),
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
          expected: value([{ name: 'Bicycle' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then the itemIndex is changed',
              before() {
                jest.clearAllMocks();
              },
              input: set('itemIndex', 2),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([{ name: 'Pear' }]));
              },
            }),
          ],
        }),
      ],
    });
  });
});
