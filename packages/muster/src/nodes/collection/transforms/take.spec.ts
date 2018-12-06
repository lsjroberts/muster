import muster, { applyTransforms, entries, iterate, query, ref, take, value } from '../../..';
import { operation, runScenario } from '../../../test';

describe('take()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          threeFirstNumbers: applyTransforms(ref('numbers'), [take(3)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of three first items',
          input: query(ref('threeFirstNumbers'), entries()),
          expected: value([1, 2, 3]),
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
          threeFirstProducts: applyTransforms(ref('products'), [take(3)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of three first products',
          input: query(
            ref('threeFirstProducts'),
            entries({
              name: true,
              category: true,
            }),
          ),
          expected: value([
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
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
          numbers: [1, 2, 3, 4, 5, 6],
          threeFirstNumbers: iterate(ref('numbers'), [take(3)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of three first items',
          input: query(ref('threeFirstNumbers'), entries()),
          expected: value([1, 2, 3]),
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
          threeFirstProducts: iterate(ref('products'), [take(3)]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of three first products',
          input: query(
            ref('threeFirstProducts'),
            entries({
              name: true,
              category: true,
            }),
          ),
          expected: value([
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
          ]),
        }),
      ],
    });
  });
});
