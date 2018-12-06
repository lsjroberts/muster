import muster, { error, ref, root, value, variable, withErrorPath } from '../..';
import { operation, runScenario } from '../../test';
import { decrement } from './decrement';

describe('decrement()', () => {
  runScenario({
    description: 'GIVEN a graph with a nested numeric variable',
    graph: () =>
      muster({
        currentValue: variable(3),
      }),
    operations: [
      operation({
        description: 'AND the current value is retrieved',
        input: ref('currentValue'),
        expected: value(3),
        operations: (subscriber) => [
          operation({
            description: 'AND the value is decremented',
            input: decrement(ref('currentValue')),
            expected: value(2),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value(2));
            },
            operations: [
              operation({
                description: 'AND the value is decremented again',
                input: decrement(ref('currentValue')),
                expected: value(1),
                before() {
                  jest.clearAllMocks();
                },
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value(1));
                },
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN calling decrement with a ref',
        input: decrement(ref('currentValue')),
        expected: value(2),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(2),
          }),
          operation({
            description: 'AND the value is decremented again',
            input: decrement(ref('currentValue')),
            expected: value(1),
          }),
        ],
      }),
      operation({
        description: 'WHEN calling decrement with a path',
        input: decrement('currentValue'),
        expected: value(2),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(2),
          }),
          operation({
            description: 'AND the value is decremented again',
            input: decrement('currentValue'),
            expected: value(1),
          }),
        ],
      }),
      operation({
        description: 'WHEN calling decrement with a path array',
        input: decrement(['currentValue']),
        expected: value(2),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(2),
          }),
          operation({
            description: 'AND the value is decremented again',
            input: decrement(['currentValue']),
            expected: value(1),
          }),
        ],
      }),
      operation({
        description: 'WHEN calling decrement with a { root, path } object',
        input: decrement({ root: root(), path: ['currentValue'] }),
        expected: value(2),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(2),
          }),
          operation({
            description: 'AND the value is decremented again',
            input: decrement({ root: root(), path: ['currentValue'] }),
            expected: value(1),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a non-numeric variable',
    graph: () => muster(variable('foo')),
    operations: [
      operation({
        description: 'AND the variable is decremented',
        input: decrement(root()),
        expected: withErrorPath(
          error(
            [
              "'subtract' node expected 'operand' to resolve to a numeric value() node.",
              ' Expected:',
              '  value()',
              ' Received:',
              '  value("foo")',
            ].join('\n'),
          ),
          { path: [] },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a non-settable value',
    graph: () => muster(value(3)),
    operations: [
      operation({
        description: 'AND the value is decremented',
        input: decrement(root()),
        expected: withErrorPath(
          error(['Target node is not settable', ' Received:', '  value(3)'].join('\n')),
          { path: [] },
        ),
      }),
    ],
  });
});
