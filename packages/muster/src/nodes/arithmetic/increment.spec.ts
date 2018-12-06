import muster, { error, ref, root, value, variable, withErrorPath } from '../..';
import { operation, runScenario } from '../../test';
import { increment } from './increment';

describe('increment()', () => {
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
            description: 'AND the value is incremented',
            input: increment(ref('currentValue')),
            expected: value(4),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value(4));
            },
            operations: [
              operation({
                description: 'AND the value is incremented again',
                input: increment(ref('currentValue')),
                expected: value(5),
                before() {
                  jest.clearAllMocks();
                },
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value(5));
                },
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN calling increment with a ref',
        input: increment(ref('currentValue')),
        expected: value(4),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(4),
          }),
          operation({
            description: 'AND the value is incremented again',
            input: increment(ref('currentValue')),
            expected: value(5),
          }),
        ],
      }),
      operation({
        description: 'WHEN calling increment with a path',
        input: increment('currentValue'),
        expected: value(4),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(4),
          }),
          operation({
            description: 'AND the value is incremented again',
            input: increment('currentValue'),
            expected: value(5),
          }),
        ],
      }),
      operation({
        description: 'WHEN calling increment with a path array',
        input: increment(['currentValue']),
        expected: value(4),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(4),
          }),
          operation({
            description: 'AND the value is incremented again',
            input: increment(['currentValue']),
            expected: value(5),
          }),
        ],
      }),
      operation({
        description: 'WHEN calling increment with a { root, path } object',
        input: increment({ root: root(), path: ['currentValue'] }),
        expected: value(4),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: ref('currentValue'),
            expected: value(4),
          }),
          operation({
            description: 'AND the value is incremented again',
            input: increment({ root: root(), path: ['currentValue'] }),
            expected: value(5),
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
        input: increment(root()),
        expected: withErrorPath(
          error(
            [
              "'add' node expected 'operand' to resolve to a numeric value() node.",
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
        input: increment(root()),
        expected: withErrorPath(
          error(['Target node is not settable', ' Received:', '  value(3)'].join('\n')),
          { path: [] },
        ),
      }),
    ],
  });
});
