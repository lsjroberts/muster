import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { or, OrNodeType } from './or';

describe('or', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct graph node', () => {
      expect(or(5, 'test')).toEqual(
        createNodeDefinition(OrNodeType, {
          operands: [value(5), value('test')],
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct graph node', () => {
      expect(or(value(5), value('test'))).toEqual(
        createNodeDefinition(OrNodeType, {
          operands: [value(5), value('test')],
        }),
      );
    });
  });
});

describe('or integration', () => {
  describe('WHEN the `or` node is the root of the graph', () => {
    runScenario({
      description: 'AND both conditions evaluate to true',
      graph: () => muster(or(value(true), value('truthy'))),
      operations: [
        operation({
          description: 'SHOULD return true',
          input: root(),
          expected: value(true),
        }),
      ],
    });

    runScenario({
      description: 'AND when only one condition evaluates to true',
      graph: () => muster(or(value(true), value(false))),
      operations: [
        operation({
          description: 'SHOULD return true',
          input: root(),
          expected: value(true),
        }),
      ],
    });

    runScenario({
      description: 'AND both conditions evaluate to false',
      graph: () => muster(or(value(null), value(false))),
      operations: [
        operation({
          description: 'SHOULD return false',
          input: root(),
          expected: value(false),
        }),
      ],
    });
  });

  runScenario({
    description: 'WHEN the `not` node is part of a larger graph',
    graph: () =>
      muster({
        trueValue: value(true),
        falseValue: value(false),
        allAreTrue: or(ref('trueValue'), value('truthy')),
        someAreTrue: or(ref('falseValue'), value('truthy')),
        allAreFalse: or(ref('falseValue'), value(null)),
      }),
    operations: [
      operation({
        description: 'SHOULD return true for `allAreTrue`',
        input: ref('allAreTrue'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `someAreTrue`',
        input: ref('someAreTrue'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return false for `allAreFalse`',
        input: ref('allAreFalse'),
        expected: value(false),
      }),
    ],
  });
});
