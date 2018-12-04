import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { gt, GtNodeType } from './gt';

describe('gt', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct graph node', () => {
      expect(gt(true, false)).toEqual(
        createNodeDefinition(GtNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct graph node', () => {
      expect(gt(value(true), value(false))).toEqual(
        createNodeDefinition(GtNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });
});

describe('gt E2E', () => {
  describe('WHEN the graph contains gt node as a root of the graph', () => {
    describe('AND comparing nodes of type `number`', () => {
      runScenario({
        description: 'AND the left value is smaller than the right',
        graph: () => muster(gt(value(10), value(11))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is equal to the right',
        graph: () => muster(gt(value(10), value(10))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is greater than the right',
        graph: () => muster(gt(value(13), value(11))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });
    });

    describe('AND comparing nodes of type `string`', () => {
      runScenario({
        description: 'AND the left value is smaller than the right',
        graph: () => muster(gt(value('bbb'), value('bbc'))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is equal to the right',
        graph: () => muster(gt(value('bbb'), value('bbb'))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(false),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is greater than the right',
        graph: () => muster(gt(value('bbc'), value('bbb'))),
        operations: [
          operation({
            description: 'SHOULD return true',
            input: root(),
            expected: value(true),
          }),
        ],
      });
    });
  });

  runScenario({
    description: 'WHEN the `gt` node is part of a larger graph',
    graph: () =>
      muster({
        smallNum: value(41),
        largeNum: value(213),
        smallString: value('ggg'),
        largeString: value('zzz'),
        smallerLeftNum: gt(value(4), value(41)),
        smallerLeftNumRef: gt(ref('smallNum'), ref('largeNum')),
        smallerLeftStr: gt(value('aaa'), value('bbb')),
        smallerLeftStrRef: gt(ref('smallString'), ref('largeString')),
        equalNum: gt(value(124), value(124)),
        equalNumRef: gt(ref('largeNum'), ref('largeNum')),
        equalStr: gt(value('hello'), value('hello')),
        equalStrRef: gt(ref('smallString'), ref('smallString')),
        largerLeftNum: gt(value(51), value(50)),
        largerLeftNumRef: gt(ref('largeNum'), ref('smallNum')),
        largerLeftStr: gt(value('bbb'), value('aaa')),
        largerLeftStrRef: gt(ref('largeString'), ref('smallString')),
      }),
    operations: [
      operation({
        description: 'SHOULD return false for `smallerLeftNum`',
        input: ref('smallerLeftNum'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `smallerLeftNumRef`',
        input: ref('smallerLeftNumRef'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `smallerLeftStr`',
        input: ref('smallerLeftStr'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `smallerLeftStrRef`',
        input: ref('smallerLeftStrRef'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `equalNum`',
        input: ref('equalNum'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `equalNumRef`',
        input: ref('equalNumRef'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `equalStr`',
        input: ref('equalStr'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return false for `equalStrRef`',
        input: ref('equalStrRef'),
        expected: value(false),
      }),
      operation({
        description: 'SHOULD return true for `largerLeftNum`',
        input: ref('largerLeftNum'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `largerLeftNumRef`',
        input: ref('largerLeftNumRef'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `largerLeftStr`',
        input: ref('largerLeftStr'),
        expected: value(true),
      }),
      operation({
        description: 'SHOULD return true for `largerLeftStrRef`',
        input: ref('largerLeftStrRef'),
        expected: value(true),
      }),
    ],
  });
});
