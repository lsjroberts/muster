import muster, {
  applyTransforms,
  entries,
  format,
  get,
  iterate,
  NodeDefinition,
  query,
  ref,
  set,
  toString,
  value,
  variable,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { map } from './map';

describe('map()', () => {
  describe('Using getItems operation', () => {
    runScenario({
      description: 'GIVEN a collection of numbers',
      graph: () =>
        muster({
          numbers: [1, 2, 3, 4, 5, 6],
          mappedNumbers: applyTransforms(ref('numbers'), [
            map((num: NodeDefinition) => format('Number ${num}', { num: toString(num) })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of mapped numbers',
          input: query(ref('mappedNumbers'), entries()),
          expected: value(['Number 1', 'Number 2', 'Number 3', 'Number 4', 'Number 5', 'Number 6']),
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
          mappedProducts: applyTransforms(ref('products'), [
            map((item: NodeDefinition) => get(item, 'name')),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of mapped products',
          input: query(ref('mappedProducts'), entries()),
          expected: value(['Apple', 'Bicycle', 'Pear', 'Kiwi']),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with a map containing a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          mappedProducts: applyTransforms(ref('products'), [
            map((item: NodeDefinition) => get(item, ref('fieldName'))),
          ]),
          fieldName: variable('name'),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of mapped products',
          input: query(ref('mappedProducts'), entries()),
          expected: value(['Apple', 'Bicycle', 'Pear', 'Kiwi']),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the fieldName',
              before() {
                jest.clearAllMocks();
              },
              input: set('fieldName', 'category'),
              assert() {
                expect(subscriber().next).toHaveReturnedTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value(['Fruit', 'Toy', 'Fruit', 'Fruit']),
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
          mappedNumbers: iterate(ref('numbers'), [
            map((num: NodeDefinition) => format('Number ${num}', { num: toString(num) })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of mapped numbers',
          input: query(ref('mappedNumbers'), entries()),
          expected: value(['Number 1', 'Number 2', 'Number 3', 'Number 4', 'Number 5', 'Number 6']),
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
          mappedProducts: iterate(ref('products'), [
            map((item: NodeDefinition) => get(item, 'name')),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of mapped products',
          input: query(ref('mappedProducts'), entries()),
          expected: value(['Apple', 'Bicycle', 'Pear', 'Kiwi']),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a collection of products with a map containing a ref',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Kiwi', category: 'Fruit' },
          ],
          mappedProducts: iterate(ref('products'), [
            map((item: NodeDefinition) => get(item, ref('fieldName'))),
          ]),
          fieldName: variable('name'),
        }),
      operations: [
        operation({
          description: 'WHEN getting a list of mapped products',
          input: query(ref('mappedProducts'), entries()),
          expected: value(['Apple', 'Bicycle', 'Pear', 'Kiwi']),
          operations: (subscriber) => [
            operation({
              description: 'AND then changing the fieldName',
              before() {
                jest.clearAllMocks();
              },
              input: set('fieldName', 'category'),
              assert() {
                expect(subscriber().next).toHaveReturnedTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value(['Fruit', 'Toy', 'Fruit', 'Fruit']),
                );
              },
            }),
          ],
        }),
      ],
    });
  });
});
