import muster, { nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { pow } from './pow';

describe('pow', () => {
  runScenario({
    description: 'GIVEN an empty muster graph',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN calling pow with two numbers',
        input: pow(5, 2),
        expected: value(25),
      }),
      operation({
        description: 'WHEN calling pow with number and value',
        input: pow(5, value(2)),
        expected: value(25),
      }),
      operation({
        description: 'WHEN calling pow with value and number',
        input: pow(value(5), 2),
        expected: value(25),
      }),
      operation({
        description: 'WHEN calling pow with two values',
        input: pow(value(5), value(2)),
        expected: value(25),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing numbers',
    graph: () =>
      muster({
        five: 5,
        two: 2,
      }),
    operations: [
      operation({
        description: 'WHEN calling pow with two refs',
        input: pow(ref('five'), ref('two')),
        expected: value(25),
      }),
    ],
  });
});
