import muster, { createNodeDefinition, error, nil, ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { divide, DivideNodeType } from './divide';

describe('divide', () => {
  runScenario({
    description: 'GIVEN an empty graph',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN called divide with numbers',
        input: divide(14, 2),
        expected: value(7),
      }),
      operation({
        description: 'WHEN called divide with number and value',
        input: divide(14, value(2)),
        expected: value(7),
      }),
      operation({
        description: 'WHEN called divide with value and number',
        input: divide(value(14), 2),
        expected: value(7),
      }),
      operation({
        description: 'WHEN called divide with values',
        input: divide(value(14), value(2)),
        expected: value(7),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing numbers',
    graph: () =>
      muster({
        fourteen: 14,
        two: 2,
      }),
    operations: [
      operation({
        description: 'WHEN calling divide with refs',
        input: divide(ref('fourteen'), ref('two')),
        expected: value(7),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an divide node with no operands',
    graph: () =>
      muster(
        createNodeDefinition(DivideNodeType as any, {
          operands: [],
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD error',
        input: root(),
        expected: withErrorPath(error('Division requires at least two operands'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an divide node with one integer operand',
    graph: () =>
      muster(
        createNodeDefinition(DivideNodeType as any, {
          operands: [value(123)],
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD error',
        input: root(),
        expected: withErrorPath(error('Division requires at least two operands'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an divide node with two integer operands',
    graph: () => muster(divide(27, 3)),
    operations: [
      operation({
        description: 'SHOULD resolve to 9',
        input: root(),
        expected: value(27 / 3),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an divide node with three integer operands',
    graph: () => muster(divide(27, 3, 2)),
    operations: [
      operation({
        description: 'SHOULD resolve to 4.5',
        input: root(),
        expected: value(27 / 3 / 2),
      }),
    ],
  });
});
