import muster, { ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { round } from './round';

describe('round()', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        three: 3,
        threePointThree: 3.3,
        threePointSeven: 3.7,
      }),
    operations: [
      operation({
        description: 'WHEN the number is an integer (value)',
        input: round(5),
        expected: value(5),
      }),
      operation({
        description: 'WHEN the number is an integer (ref)',
        input: round(ref('three')),
        expected: value(3),
      }),
      operation({
        description: 'WHEN the number is closer to nearest integer less than the number (value)',
        input: round(5.4),
        expected: value(5),
      }),
      operation({
        description: 'WHEN the number is closer to nearest integer less than the number (ref)',
        input: round(ref('threePointThree')),
        expected: value(3),
      }),
      operation({
        description:
          'WHEN the number is closer to the nearest integer greater than the number (value)',
        input: round(5.6),
        expected: value(6),
      }),
      operation({
        description:
          'WHEN the number is closer to the nearest integer greater than the number (ref)',
        input: round(ref('threePointSeven')),
        expected: value(4),
      }),
    ],
  });
});
