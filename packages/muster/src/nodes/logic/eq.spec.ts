import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { eq, EqNodeType } from './eq';

describe('eq', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct graph node', () => {
      expect(eq(true, false)).toEqual(
        createNodeDefinition(EqNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct graph node', () => {
      expect(eq(value(true), value(false))).toEqual(
        createNodeDefinition(EqNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });
});

describe('eq integration', () => {
  describe('WHEN the graph contains the eq node as a root', () => {
    describe('AND comparing same type values', () => {
      runScenario({
        description: 'AND the values are same numbers',
        graph: () => muster(eq(value(1), value(1))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });

      runScenario({
        description: 'AND the values are same strings',
        graph: () => muster(eq(value('some value'), value('some value'))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });

      runScenario({
        description: 'AND the values are different numbers',
        graph: () => muster(eq(value(2), value(3))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });

      runScenario({
        description: 'AND the values are different strings',
        graph: () => muster(eq(value('some value'), value('other value'))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });
    });

    describe('AND comparing different type values', () => {
      runScenario({
        description: 'AND the values are same numbers but different types',
        graph: () => muster(eq(value(1), value('1'))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });
    });
  });

  describe('WHEN the eq node is part of a bigger graph', () => {
    runScenario({
      description: 'AND some values are references to other parts of the graph',
      graph: () =>
        muster({
          firstNumber: value(123),
          secondNumber: value(312),
          firstString: value('first string'),
          secondString: value('second string'),
          compareSameNumbers: eq(ref('firstNumber'), value(123)),
          compareSameNumbersRef: eq(ref('firstNumber'), ref('firstNumber')),
          compareDifferentNumbers: eq(ref('secondNumber'), value(56)),
          compareDifferentNumbersRef: eq(ref('firstNumber'), ref('secondNumber')),
          compareSameStrings: eq(ref('firstString'), value('first string')),
          compareSameStringsRef: eq(ref('firstString'), ref('firstString')),
          compareDifferentStrings: eq(ref('secondString'), value('haha')),
          compareDifferentStringsRef: eq(ref('firstString'), ref('secondString')),
        }),
      operations: [
        operation({
          description: 'SHOULD return true for `compareSameNumbers`',
          input: ref('compareSameNumbers'),
          expected: value(true),
        }),
        operation({
          description: 'SHOULD return true for `compareSameNumbersRef`',
          input: ref('compareSameNumbersRef'),
          expected: value(true),
        }),
        operation({
          description: 'SHOULD return true for `compareDifferentNumbers`',
          input: ref('compareDifferentNumbers'),
          expected: value(false),
        }),
        operation({
          description: 'SHOULD return true for `compareDifferentNumbersRef`',
          input: ref('compareDifferentNumbersRef'),
          expected: value(false),
        }),
        operation({
          description: 'SHOULD return true for `compareSameStrings`',
          input: ref('compareSameStrings'),
          expected: value(true),
        }),
        operation({
          description: 'SHOULD return true for `compareSameStringsRef`',
          input: ref('compareSameStringsRef'),
          expected: value(true),
        }),
        operation({
          description: 'SHOULD return true for `compareDifferentStrings`',
          input: ref('compareDifferentStrings'),
          expected: value(false),
        }),
        operation({
          description: 'SHOULD return true for `compareDifferentStringsRef`',
          input: ref('compareDifferentStringsRef'),
          expected: value(false),
        }),
      ],
    });
  });
});
