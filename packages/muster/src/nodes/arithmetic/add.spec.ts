import muster, { nil, ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import { add } from './add';

describe('add', () => {
  runScenario({
    description: 'GIVEN an empty graph',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN calling add with numbers',
        input: add(5, 2),
        expected: value(7),
      }),
      operation({
        description: 'WHEN calling add with number and value',
        input: add(5, value(2)),
        expected: value(7),
      }),
      operation({
        description: 'WHEN calling add with value and number',
        input: add(value(5), 2),
        expected: value(7),
      }),
      operation({
        description: 'WHEN calling add with values',
        input: add(value(5), value(2)),
        expected: value(7),
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
        description: 'WHEN calling add with refs',
        input: add(ref('five'), ref('two')),
        expected: value(7),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an add node with no operands',
    graph: () => muster(add()),
    operations: [
      operation({
        description: 'SHOULD resolve to 0',
        input: root(),
        expected: value(0),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an add node with one integer operand',
    graph: () => muster(add(value(123))),
    operations: [
      operation({
        description: 'SHOULD resolve to 123',
        input: root(),
        expected: value(123),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an add node with two integer operands',
    graph: () => muster(add(value(123), value(234))),
    operations: [
      operation({
        description: 'SHOULD resolve to 357',
        input: root(),
        expected: value(357),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an add node with three integer operands',
    graph: () => muster(add(value(123), value(234), value(345))),
    operations: [
      operation({
        description: 'SHOULD resolve to 702',
        input: root(),
        expected: value(702),
      }),
    ],
  });
});
