import muster, { ref, value } from '../../..';
import { operation, runScenario } from '../../../test';
import { last } from './last';

describe('last()', () => {
  runScenario({
    description: 'GIVEN a graph containing a collection with numbers',
    graph: () =>
      muster({
        numbers: [1, 2, 3, 4, 5],
      }),
    operations: [
      operation({
        description: 'WHEN requesting a last item through a ref',
        input: ref('numbers', last()),
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
        description: 'WHEN requesting a last item through a ref',
        input: ref('names', last()),
        expected: value('third'),
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
        description: 'WHEN requesting a last name through a ref',
        input: ref('people', last(), 'name'),
        expected: value('Joseph'),
      }),
    ],
  });
});
