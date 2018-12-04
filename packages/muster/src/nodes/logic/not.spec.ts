import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { not, NotNodeType } from './not';

describe('not', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct graph node', () => {
      expect(not(true)).toEqual(
        createNodeDefinition(NotNodeType, {
          condition: value(true),
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct graph node', () => {
      expect(not(value(true))).toEqual(
        createNodeDefinition(NotNodeType, {
          condition: value(true),
        }),
      );
    });
  });
});

describe('not integration', () => {
  describe('WHEN `not` is the root node of the graph', () => {
    runScenario({
      description: 'AND the value is true',
      graph: () => muster(not(value(true))),
      operations: [
        operation({
          description: 'SHOULD return false',
          input: root(),
          expected: value(false),
        }),
      ],
    });

    runScenario({
      description: 'AND the value is truthy',
      graph: () => muster(not(value('asdf'))),
      operations: [
        operation({
          description: 'SHOULD return false',
          input: root(),
          expected: value(false),
        }),
      ],
    });

    runScenario({
      description: 'AND the value is false',
      graph: () => muster(not(value(false))),
      operations: [
        operation({
          description: 'SHOULD return true',
          input: root(),
          expected: value(true),
        }),
      ],
    });

    runScenario({
      description: 'AND the value is falsy',
      graph: () => muster(not(value(null))),
      operations: [
        operation({
          description: 'SHOULD return true',
          input: root(),
          expected: value(true),
        }),
      ],
    });
  });

  runScenario({
    description: 'WHEN the `not` node is part of a larger graph',
    graph: () =>
      muster({
        trueValue: value(true),
        truthyValue: value('asdf'),
        falseValue: value(false),
        falsyValue: value(null),
        negateTrueValue: not(ref('trueValue')),
        negateTruthyValue: not(ref('truthyValue')),
        negateFalseValue: not(ref('falseValue')),
        negateFalsyValue: not(ref('falsyValue')),
      }),
    operations: [
      operation({
        description: 'SHOULD return false for `negateTrueValue`',
        input: ref('negateTrueValue'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `negateTruthyValue`',
        input: ref('negateTruthyValue'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return true for `negateFalseValue`',
        input: ref('negateFalseValue'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `negateFalsyValue`',
        input: ref('negateFalsyValue'),
        expected: value(true),
      }),
    ],
  });
});
