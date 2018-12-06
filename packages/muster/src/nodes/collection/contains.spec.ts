import muster, { array, arrayList, eq, fn, get, ref, toNode, value } from '../..';
import { operation, runScenario } from '../../test';
import { contains } from './contains';

describe('contains()', () => {
  describe('with default comparator', () => {
    runScenario({
      description: 'GIVEN an array() containing numbers',
      graph: () =>
        muster({
          numbers: array([3, 2, 1]),
        }),
      operations: [
        operation({
          description: 'WHEN checking if it contains one of its values',
          input: contains(ref('numbers'), 3),
          expected: value(true),
        }),
        operation({
          description: 'WHEN checking if it contains another value',
          input: contains(ref('numbers'), 5),
          expected: value(false),
        }),
      ],
    });
  });

  runScenario({
    description: 'GIVEN an arrayList() containing numbers',
    graph: () =>
      muster({
        numbers: arrayList([3, 2, 1]),
      }),
    operations: [
      operation({
        description: 'WHEN checking if it contains one of its values',
        input: contains(ref('numbers'), 3),
        expected: value(true),
      }),
      operation({
        description: 'WHEN checking if it contains another value',
        input: contains(ref('numbers'), 5),
        expected: value(false),
      }),
    ],
  });

  describe('with custom comparator', () => {
    runScenario({
      description: 'GIVEN an array() containing objects',
      graph: () =>
        muster({
          products: [
            { name: 'Apple', category: 'Fruit' },
            { name: 'Bicycle', category: 'Toy' },
            { name: 'Pear', category: 'Fruit' },
            { name: 'Banana', category: 'Fruit' },
          ],
        }),
      operations: [
        operation({
          description: 'WHEN checking if it contains a specific value',
          input: contains(
            ref('products'),
            'Banana',
            fn((left, right) => eq(get(left, 'name'), right)),
          ),
          expected: value(true),
        }),
        operation({
          description: 'WHEN checking if it contains one of its items',
          input: contains(
            ref('products'),
            toNode({ name: 'Banana' }),
            fn((left, right) => eq(get(left, 'name'), get(right, 'name'))),
          ),
          expected: value(true),
        }),
        operation({
          description: 'WHEN checking if it contains another value',
          input: contains(
            ref('products'),
            'Chaffinch',
            fn((left, right) => eq(get(left, 'name'), right)),
          ),
          expected: value(false),
        }),
        operation({
          description: 'WHEN checking if it contains another item',
          input: contains(
            ref('products'),
            toNode({ name: 'Chaffinch' }),
            fn((left, right) => eq(get(left, 'name'), get(right, 'name'))),
          ),
          expected: value(false),
        }),
      ],
    });
  });

  runScenario({
    description: 'GIVEN an arrayList() containing objects',
    graph: () =>
      muster({
        products: arrayList([
          { name: 'Apple', category: 'Fruit' },
          { name: 'Bicycle', category: 'Toy' },
          { name: 'Pear', category: 'Fruit' },
          { name: 'Banana', category: 'Fruit' },
        ]),
      }),
    operations: [
      operation({
        description: 'WHEN checking if it contains a specific value',
        input: contains(
          ref('products'),
          'Banana',
          fn((left, right) => eq(get(left, 'name'), right)),
        ),
        expected: value(true),
      }),
      operation({
        description: 'WHEN checking if it contains one of its items',
        input: contains(
          ref('products'),
          toNode({ name: 'Banana' }),
          fn((left, right) => eq(get(left, 'name'), get(right, 'name'))),
        ),
        expected: value(true),
      }),
      operation({
        description: 'WHEN checking if it contains another value',
        input: contains(
          ref('products'),
          'Chaffinch',
          fn((left, right) => eq(get(left, 'name'), right)),
        ),
        expected: value(false),
      }),
      operation({
        description: 'WHEN checking if it contains another item',
        input: contains(
          ref('products'),
          toNode({ name: 'Chaffinch' }),
          fn((left, right) => eq(get(left, 'name'), get(right, 'name'))),
        ),
        expected: value(false),
      }),
    ],
  });
});
