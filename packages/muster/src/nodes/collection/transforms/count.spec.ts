import muster, {
  applyTransforms,
  entries,
  first,
  key,
  query,
  ref,
  root,
  value,
  withTransforms,
} from '../../..';
import { operation, runScenario } from '../../../test';
import { count } from './count';

describe('count()', () => {
  runScenario({
    description: 'GIVEN a graph containing a collection of numbers',
    graph: () =>
      muster({
        numbers: [5, 3, 4, 1, 2],
        numbersCount: applyTransforms(ref('numbers'), [count()]),
      }),
    operations: [
      operation({
        description: 'WHEN counting items through a collection transform passed in a query',
        input: query(root(), {
          numbers: key('numbers', withTransforms([count()], entries())),
        }),
        expected: value({
          numbers: [5],
        }),
      }),
      operation({
        description: 'WHEN counting items through a collection with a count transform',
        input: query(root(), {
          numbersCount: key('numbersCount', entries()),
        }),
        expected: value({
          numbersCount: [5],
        }),
      }),
      operation({
        description: 'WHEN counting items though a ref to a collection with a count transform',
        input: ref('numbersCount', first()),
        expected: value(5),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection of strings',
    graph: () =>
      muster({
        strings: ['first', 'second', 'third'],
        stringsCount: applyTransforms(ref('strings'), [count()]),
      }),
    operations: [
      operation({
        description: 'WHEN counting items through a collection transform passed in a query',
        input: query(root(), {
          numbers: key('strings', withTransforms([count()], entries())),
        }),
        expected: value({
          numbers: [3],
        }),
      }),
      operation({
        description: 'WHEN counting items through a collection with a count transform',
        input: query(root(), {
          numbersCount: key('stringsCount', entries()),
        }),
        expected: value({
          numbersCount: [3],
        }),
      }),
      operation({
        description: 'WHEN counting items though a ref to a collection with a count transform',
        input: ref('stringsCount', first()),
        expected: value(3),
      }),
    ],
  });
});
