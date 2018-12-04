import muster, { array, arrayList, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { head } from './head';

describe('head()', () => {
  runScenario({
    description: 'GIVEN an array() containing numbers',
    graph: () =>
      muster({
        numbers: array([3, 2, 1]),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the first item',
        input: head(ref('numbers')),
        expected: value(3),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an arrayList() containing numbers',
    graph: () =>
      muster({
        numbers: arrayList([3, 2, 1]),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the first item',
        input: head(ref('numbers')),
        expected: value(3),
      }),
    ],
  });
});
