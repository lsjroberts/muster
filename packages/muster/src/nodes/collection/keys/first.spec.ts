import muster, { ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { first } from './first';

describe('first()', () => {
  runScenario({
    description: 'GIVEN a graph containing a collection with numbers',
    graph: () =>
      muster({
        numbers: [1, 2, 3, 4, 5],
      }),
    operations: [
      operation({
        description: 'WHEN requesting a first item through a ref',
        input: ref('numbers', first()),
        expected: value(1),
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
        description: 'WHEN requesting a first item through a ref',
        input: ref('names', first()),
        expected: value('first'),
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
        description: 'WHEN requesting a first name through a ref',
        input: ref('people', first(), 'name'),
        expected: value('Bob'),
      }),
    ],
  });
});
