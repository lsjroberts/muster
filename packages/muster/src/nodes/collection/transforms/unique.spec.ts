import muster, { applyTransforms, entries, get, iterate, query, ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { unique } from './unique';

describe('unique()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of identical numbers',
      graph: () =>
        muster({
          numbers: [1, 1, 1, 1],
          uniqueNumbers: applyTransforms(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([1]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an empty collection',
      graph: () =>
        muster({
          numbers: [],
          uniqueNumbers: applyTransforms(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of non-identical numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 1],
          uniqueNumbers: applyTransforms(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([1, 2, 3]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection with no repeating values',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          uniqueNumbers: applyTransforms(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([1, 2, 3, 4, 5, 6]),
        }),
      ],
    });
  });

  describe('unique(predicate)', () => {
    runScenario({
      description: 'GIVEN a collection of identical objects',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
          ],
          uniqueProducts: applyTransforms(ref('products'), [unique((item) => get(item, 'name'))]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items with a predicate',
          input: query(
            ref('uniqueProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of nonidentical objects',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
          ],
          uniqueProducts: applyTransforms(ref('products'), [unique((item) => get(item, 'name'))]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items with a predicate',
          input: query(
            ref('uniqueProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }, { name: 'Bicycle' }, { name: 'Pear' }]),
        }),
      ],
    });
  });

  describe('Using iterators', () => {
    runScenario({
      description: 'GIVEN a collection of identical numbers',
      graph: () =>
        muster({
          numbers: [1, 1, 1, 1],
          uniqueNumbers: iterate(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([1]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN an empty collection',
      graph: () =>
        muster({
          numbers: [],
          uniqueNumbers: iterate(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of non-identical numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 1],
          uniqueNumbers: iterate(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([1, 2, 3]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection with no repeating values',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          uniqueNumbers: iterate(ref('numbers'), [unique()]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items',
          input: query(ref('uniqueNumbers'), entries()),
          expected: value([1, 2, 3, 4, 5, 6]),
        }),
      ],
    });
  });

  describe('unique(predicate)', () => {
    runScenario({
      description: 'GIVEN a collection of identical objects',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
          ],
          uniqueProducts: iterate(ref('products'), [unique((item) => get(item, 'name'))]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items with a predicate',
          input: query(
            ref('uniqueProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of nonidentical objects',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Apple', category: 'Fruit' },
          ],
          uniqueProducts: iterate(ref('products'), [unique((item) => get(item, 'name'))]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of unique items with a predicate',
          input: query(
            ref('uniqueProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }, { name: 'Bicycle' }, { name: 'Pear' }]),
        }),
      ],
    });
  });
});
