import muster, { ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { min } from './min';

describe('min()', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        one: 1,
        minusThreePointFive: -3.5,
      }),
    operations: [
      operation({
        description: 'WHEN calling min with no parameters',
        input: min(),
        expected: value(0),
      }),
      operation({
        description: 'WHEN calling min with one number',
        input: min(1),
        expected: value(1),
      }),
      operation({
        description: 'WHEN calling min with two numbers',
        input: min(2, 1.5),
        expected: value(1.5),
      }),
      operation({
        description: 'WHEN calling min with three numbers',
        input: min(2, 1.5, 3, -112),
        expected: value(-112),
      }),
      operation({
        description: 'WHEN calling with numbers and refs',
        input: min(1, 2, ref('minusThreePointFive'), ref('one')),
        expected: value(-3.5),
      }),
    ],
  });
});
