import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { gte, GteNodeType } from './gte';

describe('gte', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct graph node', () => {
      expect(gte(true, false)).toEqual(
        createNodeDefinition(GteNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct graph node', () => {
      expect(gte(value(true), value(false))).toEqual(
        createNodeDefinition(GteNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });
});

describe('gte integration', () => {
  describe('WHEN the graph contains gte node as a root of the graph', () => {
    describe('AND comparing nodes of type `number`', () => {
      runScenario({
        description: 'AND the left value is smaller than the right',
        graph: () => muster(gte(value(10), value(11))),
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
        graph: () => muster(gte(value(10), value(10))),
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
        graph: () => muster(gte(value(13), value(11))),
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
        graph: () => muster(gte(value('bbb'), value('bbc'))),
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
        graph: () => muster(gte(value('bbb'), value('bbb'))),
        operations: [
          operation({
            description: 'SHOULD return false',
            input: root(),
            expected: value(true),
          }),
        ],
      });

      runScenario({
        description: 'AND the left value is greater than the right',
        graph: () => muster(gte(value('bbc'), value('bbb'))),
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
        smallerLeftNum: gte(value(4), value(41)),
        smallerLeftNumRef: gte(ref('smallNum'), ref('largeNum')),
        smallerLeftStr: gte(value('aaa'), value('bbb')),
        smallerLeftStrRef: gte(ref('smallString'), ref('largeString')),
        equalNum: gte(value(124), value(124)),
        equalNumRef: gte(ref('largeNum'), ref('largeNum')),
        equalStr: gte(value('hello'), value('hello')),
        equalStrRef: gte(ref('smallString'), ref('smallString')),
        largerLeftNum: gte(value(51), value(50)),
        largerLeftNumRef: gte(ref('largeNum'), ref('smallNum')),
        largerLeftStr: gte(value('bbb'), value('aaa')),
        largerLeftStrRef: gte(ref('largeString'), ref('smallString')),
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
