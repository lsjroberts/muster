import muster, { ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { nth } from './nth';

describe('nth()', () => {
  runScenario({
    description: 'GIVEN a graph containing a collection with numbers',
    graph: () =>
      muster({
        numbers: [1, 2, 3, 4, 5],
      }),
    operations: [
      operation({
        description: 'WHEN requesting a nth(3) item through a ref',
        input: ref('numbers', nth(3)),
        expected: value(4),
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
        description: 'WHEN requesting a nth(1) item through a ref',
        input: ref('names', nth(1)),
        expected: value('second'),
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
        description: 'WHEN requesting a nth name through a ref',
        input: ref('people', nth(1), 'name'),
        expected: value('Hannah'),
      }),
    ],
  });
});
