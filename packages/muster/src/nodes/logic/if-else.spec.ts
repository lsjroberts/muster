import muster, { eq, gt, ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { ifElse, IfElseNodeType } from './if-else';

describe('ifElse', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD return correct graph node', () => {
      expect(
        ifElse({
          if: true,
          then: 'left',
          else: 'right',
        }),
      ).toEqual(
        createNodeDefinition(IfElseNodeType, {
          if: value(true),
          then: value('left'),
          else: value('right'),
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD return correct graph node', () => {
      expect(
        ifElse({
          if: value(true),
          then: value('left'),
          else: value('right'),
        }),
      ).toEqual(
        createNodeDefinition(IfElseNodeType, {
          if: value(true),
          then: value('left'),
          else: value('right'),
        }),
      );
    });
  });
});

describe('ifElse integration', () => {
  describe('WHEN the `ifElse` node is the root node of the graph', () => {
    runScenario({
      description: 'AND the ifElse returns true',
      graph: () =>
        muster(
          ifElse({
            if: value(true),
            then: value('True case'),
            else: value('False case'),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD return `True case`',
          input: root(),
          expected: value('True case'),
        }),
      ],
    });

    runScenario({
      description: 'AND the ifElse returns false',
      graph: () =>
        muster(
          ifElse({
            if: value(false),
            then: value('True case'),
            else: value('False case'),
          }),
        ),
      operations: [
        operation({
          description: 'SHOULD return `False case`',
          input: root(),
          expected: value('False case'),
        }),
      ],
    });
  });

  runScenario({
    description: 'WHEN the `ifElse` is part of a larger graph',
    graph: () =>
      muster({
        falseValue: value(false),
        evaluatesToTrue: eq(ref('falseValue'), value(false)),
        evaluatesToFalse: gt(value(10), value(15)),
        trueCaseStr: value('True case response'),
        falseCaseStr: value('False case response'),
        trueBoolCondition: ifElse({
          if: ref('evaluatesToTrue'),
          then: ref('trueCaseStr'),
          else: ref('falseCaseStr'),
        }),
        falseBoolCondition: ifElse({
          if: ref('evaluatesToFalse'),
          then: ref('trueCaseStr'),
          else: ref('falseCaseStr'),
        }),
      }),
    operations: [
      operation({
        description: 'SHOULD return `trueCaseStr` for `trueBoolCondition`',
        input: ref('trueBoolCondition'),
        expected: value('True case response'),
      }),
      {
        description: 'SHOULD return `falseCaseStr` for `falseBoolCondition`',
        input: ref('falseBoolCondition'),
        expected: value('False case response'),
      },
    ],
  });
});
