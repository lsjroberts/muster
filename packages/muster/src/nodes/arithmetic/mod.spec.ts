import muster, { createNodeDefinition, error, nil, ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { mod, ModNodeType } from './mod';

describe('mod', () => {
  runScenario({
    description: 'GIVEN a mod node with no operands',
    graph: () =>
      muster(
        createNodeDefinition(ModNodeType as any, {
          operands: [],
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD error',
        input: root(),
        expected: withErrorPath(error('Modulo requires at least two operands'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a mod node with one integer operand',
    graph: () =>
      muster(
        createNodeDefinition(ModNodeType as any, {
          operands: [value(123)],
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD error',
        input: root(),
        expected: withErrorPath(error('Modulo requires at least two operands'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an empty graph',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN called mod with numbers',
        input: mod(5, 3),
        expected: value(2),
      }),
      operation({
        description: 'WHEN called mod with value and number',
        input: mod(value(5), 3),
        expected: value(2),
      }),
      operation({
        description: 'WHEN called mod with number and value',
        input: mod(5, value(3)),
        expected: value(2),
      }),
      operation({
        description: 'WHEN called mod with values',
        input: mod(value(5), value(3)),
        expected: value(2),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing numbers',
    graph: () =>
      muster({
        five: 5,
        three: 3,
      }),
    operations: [
      operation({
        description: 'WHEN called mod with refs',
        input: mod(ref('five'), ref('three')),
        expected: value(2),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a mod node with two integer operands',
    graph: () => muster(mod(value(27), value(4))),
    operations: [
      operation({
        description: 'SHOULD resolve to 0',
        input: root(),
        expected: value(27 % 4),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a mod node with three integer operands',
    graph: () => muster(mod(value(27), value(4), value(2))),
    operations: [
      operation({
        description: 'SHOULD resolve to 3',
        input: root(),
        expected: value((27 % 4) % 2),
      }),
    ],
  });
});
