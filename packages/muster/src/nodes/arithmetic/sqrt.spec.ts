import muster, { nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { sqrt } from './sqrt';

describe('sqrt', () => {
  runScenario({
    description: 'GIVEN an empty muster graph',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN calling sqrt with number',
        input: sqrt(4),
        expected: value(2),
      }),
      operation({
        description: 'WHEN calling sqrt with value',
        input: sqrt(value(4)),
        expected: value(2),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing numbers',
    graph: () =>
      muster({
        four: 4,
      }),
    operations: [
      operation({
        description: 'WHEN calling sqrt with ref',
        input: sqrt(ref('four')),
        expected: value(2),
      }),
    ],
  });
});
