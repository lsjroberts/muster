import muster, { and, fn, gt, lt, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { some } from './some';

describe('contains()', () => {
  runScenario({
    description: 'GIVEN a collection containing numbers',
    graph: () =>
      muster({
        numbers: [1, 2, 3, 4, 5],
      }),
    operations: [
      operation({
        description: 'WHEN checking for an existing number',
        input: some(ref('numbers'), 1),
        expected: value(true),
      }),
      operation({
        description: 'WHEN checking for a non-existing number',
        input: some(ref('numbers'), 6),
        expected: value(false),
      }),
      operation({
        description: 'WHEN checking for a matching predicate',
        input: some(ref('numbers'), fn((item) => and(gt(item, 2), lt(item, 4)))),
        expected: value(true),
      }),
      operation({
        description: 'WHEN checking for a non-matching predicate',
        input: some(ref('numbers'), fn((item) => gt(item, 5))),
        expected: value(false),
      }),
    ],
  });
});
