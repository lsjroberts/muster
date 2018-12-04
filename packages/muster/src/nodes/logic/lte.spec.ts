import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { lte, LteNodeType } from './lte';

describe('lte', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct graph node', () => {
      expect(lte(true, false)).toEqual(
        createNodeDefinition(LteNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct graph node', () => {
      expect(lte(value(true), value(false))).toEqual(
        createNodeDefinition(LteNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });
});

describe('lte E2E', () => {
  describe('WHEN the graph contains lte node as a root of the graph', () => {
    describe('AND comparing nodes of type `number`', () => {
      runScenario({
        description: 'AND the left value is smaller than the right',
        graph: () => muster(lte(value(10), value(11))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is equal to the right',
        graph: () => muster(lte(value(10), value(10))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is greater than the right',
        graph: () => muster(lte(value(13), value(11))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });
    });

    describe('AND comparing nodes of type `string`', () => {
      runScenario({
        description: 'AND the left value is smaller than the right',
        graph: () => muster(lte(value('bbb'), value('bbc'))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is equal to the right',
        graph: () => muster(lte(value('bbb'), value('bbb'))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is greater than the right',
        graph: () => muster(lte(value('bbc'), value('bbb'))),
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

  runScenario({
    description: 'WHEN the `lte` node is part of a larger graph',
    graph: () =>
      muster({
        smallNum: value(41),
        largeNum: value(213),
        smallString: value('ggg'),
        largeString: value('zzz'),
        smallerLeftNum: lte(value(4), value(41)),
        smallerLeftNumRef: lte(ref('smallNum'), ref('largeNum')),
        smallerLeftStr: lte(value('aaa'), value('bbb')),
        smallerLeftStrRef: lte(ref('smallString'), ref('largeString')),
        equalNum: lte(value(124), value(124)),
        equalNumRef: lte(ref('largeNum'), ref('largeNum')),
        equalStr: lte(value('hello'), value('hello')),
        equalStrRef: lte(ref('smallString'), ref('smallString')),
        largerLeftNum: lte(value(51), value(50)),
        largerLeftNumRef: lte(ref('largeNum'), ref('smallNum')),
        largerLeftStr: lte(value('bbb'), value('aaa')),
        largerLeftStrRef: lte(ref('largeString'), ref('smallString')),
      }),
    operations: [
      operation({
        description: 'SHOULD return true for `smallerLeftNum`',
        input: ref('smallerLeftNum'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `smallerLeftNumRef`',
        input: ref('smallerLeftNumRef'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `smallerLeftStr`',
        input: ref('smallerLeftStr'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `smallerLeftStrRef`',
        input: ref('smallerLeftStrRef'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `equalNum`',
        input: ref('equalNum'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `equalNumRef`',
        input: ref('equalNumRef'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `equalStr`',
        input: ref('equalStr'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `equalStrRef`',
        input: ref('equalStrRef'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return false for `largerLeftNum`',
        input: ref('largerLeftNum'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `largerLeftNumRef`',
        input: ref('largerLeftNumRef'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `largerLeftStr`',
        input: ref('largerLeftStr'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `largerLeftStrRef`',
        input: ref('largerLeftStrRef'),
        expected: value(false),
      }),
    ],
  });
});
