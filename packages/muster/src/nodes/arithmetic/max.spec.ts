import muster, { ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { max } from './max';

describe('max()', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        one: 1,
        minusThreePointFive: -3.5,
        five: 5.0,
      }),
    operations: [
      operation({
        description: 'WHEN calling max with no parameters',
        input: max(),
        expected: value(0),
      }),
      operation({
        description: 'WHEN calling max with one number',
        input: max(1),
        expected: value(1),
      }),
      operation({
        description: 'WHEN calling max with two numbers',
        input: max(2, 1.5),
        expected: value(2),
      }),
      operation({
        description: 'WHEN calling max with three numbers',
        input: max(2, 1.5, 3, -112),
        expected: value(3),
      }),
      operation({
        description: 'WHEN calling with numbers and refs',
        input: max(1, 2, ref('minusThreePointFive'), ref('one'), ref('five')),
        expected: value(5.0),
      }),
    ],
  });
});
