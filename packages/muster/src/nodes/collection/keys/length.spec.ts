import muster, { ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { length } from './length';

describe('length()', () => {
  runScenario({
    description: 'GIVEN a graph containing a collection with numbers',
    graph: () =>
      muster({
        numbers: [1, 2, 3, 4, 5],
      }),
    operations: [
      operation({
        description: 'WHEN requesting a length through a ref',
        input: ref('numbers', length()),
        expected: value(5),
      }),
      operation({
        description: 'WHEN requesting a length as a getLength node',
        input: length(ref('numbers')),
        expected: value(5),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection with strings',
    graph: () =>
      muster({
        names: ['first', 'second', 'third'],
      }),
    operations: [
      operation({
        description: 'WHEN requesting a length through a ref',
        input: ref('names', length()),
        expected: value(3),
      }),
      operation({
        description: 'WHEN requesting a length as a getLength node',
        input: length(ref('names')),
        expected: value(3),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection of trees',
    graph: () =>
      muster({
        people: [{ name: 'Bob' }, { name: 'Hannah' }, { name: 'Joseph' }],
      }),
    operations: [
      operation({
        description: 'WHEN requesting a length through a ref',
        input: ref('people', length()),
        expected: value(3),
      }),
      operation({
        description: 'WHEN requesting a length as a getLength node',
        input: length(ref('people')),
        expected: value(3),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a string node',
    graph: () =>
      muster({
        name: 'Bob',
      }),
    operations: [
      operation({
        description: 'WHEN requesting a length through a ref',
        input: ref('name', length()),
        expected: value(3),
      }),
      operation({
        description: 'WHEN requesting a length as a getLength node',
        input: length(ref('name')),
        expected: value(3),
      }),
    ],
  });
});
