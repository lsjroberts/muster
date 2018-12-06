import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { and, AndNodeType } from './and';

describe('and', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct `and` node', () => {
      expect(and('condition 1', 'condition 2')).toEqual(
        createNodeDefinition(AndNodeType, {
          operands: [value('condition 1'), value('condition 2')],
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct `and` node', () => {
      expect(and(value('condition 1'), value('condition 2'))).toEqual(
        createNodeDefinition(AndNodeType, {
          operands: [value('condition 1'), value('condition 2')],
        }),
      );
    });
  });
});

describe('and integration', () => {
  describe('WHEN a graph consist of only the `and` node', () => {
    runScenario({
      description: 'AND an `and` node evaluates to true',
      graph: () => muster(and(value(true))),
      operations: [
        operation({
          description: 'SHOULD return `true` value',
          input: root(),
          expected: value(true),
        }),
      ],
    });

    runScenario({
      description: 'AND an `and` node evaluates to a truthy value',
      graph: () => muster(and(value('truthy value'))),
      operations: [
        operation({
          description: 'SHOULD return `true` value',
          input: root(),
          expected: value(true),
        }),
      ],
    });

    runScenario({
      description: 'AND an `and` node evaluates to false',
      graph: () => muster(and(value(false))),
      operations: [
        operation({
          description: 'SHOULD return `false` value',
          input: root(),
          expected: value(false),
        }),
      ],
    });

    runScenario({
      description: 'AND an `and` node evaluates to a falsy value',
      graph: () => muster(and(value(null))),
      operations: [
        operation({
          description: 'SHOULD return `false` value',
          input: root(),
          expected: value(false),
        }),
      ],
    });

    runScenario({
      description: 'AND an all of the operands return true',
      graph: () => muster(and(value(true), value('truthy value'))),
      operations: [
        operation({
          description: 'SHOULD return `true` value',
          input: root(),
          expected: value(true),
        }),
      ],
    });

    runScenario({
      description: 'AND an one of the operands return false',
      graph: () => muster(and(value(false), value('truthy value'))),
      operations: [
        operation({
          description: 'SHOULD return `false` value',
          input: root(),
          expected: value(false),
        }),
      ],
    });

    runScenario({
      description: 'AND an all of the operands return false',
      graph: () => muster(and(value(false), value(undefined))),
      operations: [
        operation({
          description: 'SHOULD return `false` value',
          input: root(),
          expected: value(false),
        }),
      ],
    });
  });

  describe('WHEN the graph is nested', () => {
    runScenario({
      description: 'AND all of the operands are simple values',
      graph: () =>
        muster({
          allAreTrue: and(value(true), value('truthy value')),
          someAreFalse: and(value(true), value(null)),
          allAreFalse: and(value(false), value(null)),
        }),
      operations: [
        operation({
          description: 'SHOULD return `true` when all are true',
          input: ref('allAreTrue'),
          expected: value(true),
        }),
        {
          description: 'SHOULD return `false` when some are false',
          input: ref('someAreFalse'),
          expected: value(false),
        },
        {
          description: 'SHOULD return `false` when all are false',
          input: ref('allAreFalse'),
          expected: value(false),
        },
      ],
    });

    runScenario({
      description: 'AND some of the operands are refs',
      graph: () =>
        muster({
          trueValue: value(true),
          truthyValue: value('truthy value'),
          falseValue: value(false),
          falsyValue: value(null),
          isRefTrue: and(ref('trueValue')),
          allAreTrue: and(ref('trueValue'), ref('truthyValue')),
          someAreFalse: and(ref('truthyValue'), ref('falsyValue')),
          allAreFalse: and(ref('falseValue'), ref('falsyValue')),
        }),
      operations: [
        operation({
          description: 'SHOULD return `true` when all are true (single ref)',
          input: ref('isRefTrue'),
          expected: value(true),
        }),
        operation({
          description: 'SHOULD return `true` when all are true',
          input: ref('allAreTrue'),
          expected: value(true),
        }),
        {
          description: 'SHOULD return `false` when some are false',
          input: ref('someAreFalse'),
          expected: value(false),
        },
        {
          description: 'SHOULD return `false` when all are false',
          input: ref('allAreFalse'),
          expected: value(false),
        },
      ],
    });
  });
});
