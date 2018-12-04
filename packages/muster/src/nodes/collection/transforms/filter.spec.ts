import muster, {
  applyTransforms,
  entries,
  eq,
  get,
  iterate,
  mod,
  NodeDefinition,
  query,
  ref,
  set,
  value,
  variable,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { filter } from './filter';

describe('filter', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a basic filter',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          evenNumbers: applyTransforms(ref('numbers'), [
            filter((item: NodeDefinition) => eq(mod(item, 2), 0)),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of even numbers',
          input: query(ref('evenNumbers'), entries()),
          expected: value([2, 4, 6]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a filter with a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: applyTransforms(ref('products'), [
            filter((item: NodeDefinition) => eq(get(item, 'category'), ref('categoryName'))),
          ]),
          categoryName: variable('Fruit'),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of fruits',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }, { name: 'Pear' }, { name: 'Kiwi' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the categoryName to `Toy`',
              before() {
                jest.clearAllMocks();
              },
              input: set('categoryName', 'Toy'),
              assert() {
                expect(subscriber().next).toHaveReturnedTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([{ name: 'Bicycle' }]));
              },
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a filter used as a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: applyTransforms(ref('products'), [ref('productFilter')]),
          productFilter: filter((item: NodeDefinition) =>
            eq(get(item, 'category'), ref('categoryName')),
          ),
          categoryName: variable('Fruit'),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of fruits',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }, { name: 'Pear' }, { name: 'Kiwi' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the categoryName to `Toy`',
              before() {
                jest.clearAllMocks();
              },
              input: set('categoryName', 'Toy'),
              assert() {
                expect(subscriber().next).toHaveReturnedTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([{ name: 'Bicycle' }]));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('Using iterators', () => {
    runScenario({
      description: 'GIVEN a basic filter',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          evenNumbers: iterate(ref('numbers'), [
            filter((item: NodeDefinition) => eq(mod(item, 2), 0)),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of even numbers',
          input: query(ref('evenNumbers'), entries()),
          expected: value([2, 4, 6]),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a filter with a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: iterate(ref('products'), [
            filter((item: NodeDefinition) => eq(get(item, 'category'), ref('categoryName'))),
          ]),
          categoryName: variable('Fruit'),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of fruits',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }, { name: 'Pear' }, { name: 'Kiwi' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the categoryName to `Toy`',
              before() {
                jest.clearAllMocks();
              },
              input: set('categoryName', 'Toy'),
              assert() {
                expect(subscriber().next).toHaveReturnedTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([{ name: 'Bicycle' }]));
              },
            }),
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a filter used as a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          filteredProducts: iterate(ref('products'), [ref('productFilter')]),
          productFilter: filter((item: NodeDefinition) =>
            eq(get(item, 'category'), ref('categoryName')),
          ),
          categoryName: variable('Fruit'),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of fruits',
          input: query(
            ref('filteredProducts'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'Apple' }, { name: 'Pear' }, { name: 'Kiwi' }]),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the categoryName to `Toy`',
              before() {
                jest.clearAllMocks();
              },
              input: set('categoryName', 'Toy'),
              assert() {
                expect(subscriber().next).toHaveReturnedTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([{ name: 'Bicycle' }]));
              },
            }),
          ],
        }),
      ],
    });
  });
});
