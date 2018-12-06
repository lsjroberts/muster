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
import { skip } from './skip';

describe('skip()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          filteredNumbers: applyTransforms(ref('numbers'), [skip(2)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([3, 4, 5, 6]),
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
          filteredProducts: applyTransforms(ref('products'), [skip(2)]),
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
          expected: value([{ name: 'Pear' }, { name: 'Kiwi' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with a skip() using a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: applyTransforms(ref('products'), [skip(ref('skipCount'))]),
          skipCount: variable(2),
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
          expected: value([{ name: 'Pear' }, { name: 'Kiwi' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the skipCount to 1',
              before() {
                jest.clearAllMocks();
              },
              input: set('skipCount', 1),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([{ name: 'Bicycle' }, { name: 'Pear' }, { name: 'Kiwi' }]),
                );
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
          filteredNumbers: iterate(ref('numbers'), [skip(2)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of filtered numbers',
          input: query(ref('filteredNumbers'), entries()),
          expected: value([3, 4, 5, 6]),
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
          filteredProducts: iterate(ref('products'), [skip(2)]),
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
          expected: value([{ name: 'Pear' }, { name: 'Kiwi' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with a skip() using a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: iterate(ref('products'), [skip(ref('skipCount'))]),
          skipCount: variable(2),
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
          expected: value([{ name: 'Pear' }, { name: 'Kiwi' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the skipCount to 1',
              before() {
                jest.clearAllMocks();
              },
              input: set('skipCount', 1),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([{ name: 'Bicycle' }, { name: 'Pear' }, { name: 'Kiwi' }]),
                );
              },
            }),
          ],
        }),
      ],
    });
  });
});
