import muster, { createNodeDefinition, error, nil, ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from '../graph/error';
import { subtract, SubtractNodeType } from './subtract';

describe('subtract', () => {
  describe('WHEN calling subtract with zero args', () => {
    it('SHOULD throw an error', () => {
      expect(() => subtract()).toThrowError('Subtraction requires at least two operands');
    });
  });

  describe('WHEN calling subtract with one arg', () => {
    it('SHOULD throw an error', () => {
      expect(() => subtract(5)).toThrowError('Subtraction requires at least two operands');
    });
  });

  runScenario({
    description: 'GIVEN an empty graph',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN calling subtract with two numbers',
        input: subtract(5, 2),
        expected: value(3),
      }),
      operation({
        description: 'WHEN calling subtract with three numbers',
        input: subtract(5, 2, 1),
        expected: value(2),
      }),
      operation({
        description: 'WHEN calling subtract with number and value',
        input: subtract(5, value(2)),
        expected: value(3),
      }),
      operation({
        description: 'WHEN calling subtract with value and number',
        input: subtract(value(5), 2),
        expected: value(3),
      }),
      operation({
        description: 'WHEN calling subtract with two values',
        input: subtract(value(5), value(2)),
        expected: value(3),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing numbers',
    graph: () =>
      muster({
        five: 5,
        two: 2,
      }),
    operations: [
      operation({
        description: 'WHEN calling subtract with two refs',
        input: subtract(ref('five'), ref('two')),
        expected: value(3),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a subtract node with no operands',
    graph: () =>
      muster(
        createNodeDefinition(SubtractNodeType as any, {
          operands: [],
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD error',
        input: root(),
        expected: withErrorPath(error('Subtraction requires at least two operands'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a subtract node with one integer operand',
    graph: () =>
      muster(
        createNodeDefinition(SubtractNodeType as any, {
          operands: [value(123)],
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD error',
        input: root(),
        expected: withErrorPath(error('Subtraction requires at least two operands'), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a subtract node with two integer operands',
    graph: () => muster(subtract(value(123), value(234))),
    operations: [
      operation({
        description: 'SHOULD resolve to -111',
        input: root(),
        expected: value(-111),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a subtract node with three integer operands',
    graph: () => muster(subtract(value(123), value(234), value(345))),
    operations: [
      operation({
        description: 'SHOULD resolve to -456',
        input: root(),
        expected: value(-456),
      }),
    ],
  });
});
