import muster, { ref, toNode, value } from '../..';
import { operation, runScenario } from '../../test';
import { nil } from './nil';

describe('nil', () => {
  runScenario({
    description: 'GIVEN a graph containing a bunch of nil nodes',
    graph: () =>
      muster(
        toNode({
          nil: nil(),
          value: value('1'),
          nested: {
            nil: nil(),
            value: value('2'),
          },
          deeply: {
            nested: {
              nil: nil(),
              value: value('3'),
            },
          },
        }),
      ),
    operations: [
      operation({
        description: 'WHEN requesting a nil',
        input: ref('nil'),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN requesting a value',
        input: ref('value'),
        expected: value('1'),
      }),
      operation({
        description: 'WHEN requesting a child of a nil',
        input: ref('nil', 'nested'),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN requesting a nested nil',
        input: ref('nested', 'nil'),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN requesting a nested value',
        input: ref('nested', 'value'),
        expected: value('2'),
      }),
      operation({
        description: 'WHEN requesting a child of a nested nil',
        input: ref('nested', 'nil', 'child'),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN requesting a deeply nested nil',
        input: ref('deeply', 'nested', 'nil'),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN requesting a deeply nested value',
        input: ref('deeply', 'nested', 'value'),
        expected: value('3'),
      }),
      operation({
        description: 'WHEN requesting a child of a deeply nested nil',
        input: ref('deeply', 'nested', 'nil', 'child'),
        expected: value(undefined),
      }),
    ],
  });
});
