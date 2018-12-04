import muster, { nil, ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import { multiply } from './multiply';

describe('multiply', () => {
  runScenario({
    description: 'GIVEN an empty muster graph',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN calling multiply with two numbers',
        input: multiply(5, 2),
        expected: value(10),
      }),
      operation({
        description: 'WHEN calling multiply with thee numbers',
        input: multiply(5, 2, 3),
        expected: value(30),
      }),
      operation({
        description: 'WHEN calling multiply with number and value',
        input: multiply(5, value(2)),
        expected: value(10),
      }),
      operation({
        description: 'WHEN calling multiply with value and number',
        input: multiply(value(5), 2),
        expected: value(10),
      }),
      operation({
        description: 'WHEN calling multiply with two values',
        input: multiply(value(5), value(2)),
        expected: value(10),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing numbers',
    graph: () =>
      muster({
        five: 5,
        two: 2,
        three: 3,
      }),
    operations: [
      operation({
        description: 'WHEN calling multiply with two refs',
        input: multiply(ref('five'), ref('two')),
        expected: value(10),
      }),
      operation({
        description: 'WHEN calling multiply with three refs',
        input: multiply(ref('three'), ref('two'), ref('five')),
        expected: value(30),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a multiply node with no operands',
    graph: () => muster(multiply()),
    operations: [
      operation({
        description: 'SHOULD resolve to 1',
        input: root(),
        expected: value(1),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a multiply node with one integer operand',
    graph: () => muster(multiply(value(123))),
    operations: [
      operation({
        description: 'SHOULD resolve to 123',
        input: root(),
        expected: value(123),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a multiply node with two integer operands',
    graph: () => muster(multiply(value(123), value(234))),
    operations: [
      operation({
        description: `SHOULD resolve to ${123 * 234}`,
        input: root(),
        expected: value(123 * 234),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a multiply node with three integer operands',
    graph: () => muster(multiply(value(123), value(234), value(345))),
    operations: [
      operation({
        description: `SHOULD resolve to ${123 * 234 * 345}`,
        input: root(),
        expected: value(123 * 234 * 345),
      }),
    ],
  });
});
