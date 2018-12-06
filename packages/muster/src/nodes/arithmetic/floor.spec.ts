import muster, { ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { floor } from './floor';

describe('floor()', () => {
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
        input: floor(5),
        expected: value(5),
      }),
      operation({
        description: 'WHEN the number is a float (value)',
        input: floor(3.3),
        expected: value(3),
      }),
      operation({
        description: 'WHEN the number is an integer (ref)',
        input: floor(ref('one')),
        expected: value(1),
      }),
      operation({
        description: 'WHEN the number is a float (ref)',
        input: floor(ref('tenPointFive')),
        expected: value(10),
      }),
    ],
  });
});
