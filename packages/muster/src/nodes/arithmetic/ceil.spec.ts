import muster, { ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { ceil } from './ceil';

describe('ceil()', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        one: 1,
        tenPointFive: 10.5,
      }),
    operations: [
      operation({
        description: 'WHEN the number is an integer (value)',
        input: ceil(5),
        expected: value(5),
      }),
      operation({
        description: 'WHEN the number is a float (value)',
        input: ceil(3.3),
        expected: value(4),
      }),
      operation({
        description: 'WHEN the number is an integer (ref)',
        input: ceil(ref('one')),
        expected: value(1),
      }),
      operation({
        description: 'WHEN the number is a float (ref)',
        input: ceil(ref('tenPointFive')),
        expected: value(11),
      }),
    ],
  });
});
