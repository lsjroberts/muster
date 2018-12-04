import muster, { ref, root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { lt, LtNodeType } from './lt';

describe('lt', () => {
  describe('WHEN creating the node using simplified API', () => {
    it('SHOULD create correct graph node', () => {
      expect(lt(true, false)).toEqual(
        createNodeDefinition(LtNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });

  describe('WHEN creating the node using full API', () => {
    it('SHOULD create correct graph node', () => {
      expect(lt(value(true), value(false))).toEqual(
        createNodeDefinition(LtNodeType, {
          left: value(true),
          right: value(false),
        }),
      );
    });
  });
});

describe('lt E2E', () => {
  describe('WHEN the graph contains lt node as a root of the graph', () => {
    describe('AND comparing nodes of type `number`', () => {
      runScenario({
        description: 'AND the left value is smaller than the right',
        graph: () => muster(lt(value(10), value(11))),
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
        graph: () => muster(lt(value(10), value(10))),
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
        graph: () => muster(lt(value(13), value(11))),
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
        graph: () => muster(lt(value('bbb'), value('bbc'))),
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
        graph: () => muster(lt(value('bbb'), value('bbb'))),
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
        graph: () => muster(lt(value('bbc'), value('bbb'))),
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
    description: 'WHEN the `lt` node is part of a larger graph',
    graph: () =>
      muster({
        smallNum: value(41),
        largeNum: value(213),
        smallString: value('ggg'),
        largeString: value('zzz'),
        smallerLeftNum: lt(value(4), value(41)),
        smallerLeftNumRef: lt(ref('smallNum'), ref('largeNum')),
        smallerLeftStr: lt(value('aaa'), value('bbb')),
        smallerLeftStrRef: lt(ref('smallString'), ref('largeString')),
        equalNum: lt(value(124), value(124)),
        equalNumRef: lt(ref('largeNum'), ref('largeNum')),
        equalStr: lt(value('hello'), value('hello')),
        equalStrRef: lt(ref('smallString'), ref('smallString')),
        largerLeftNum: lt(value(51), value(50)),
        largerLeftNumRef: lt(ref('largeNum'), ref('smallNum')),
        largerLeftStr: lt(value('bbb'), value('aaa')),
        largerLeftStrRef: lt(ref('largeString'), ref('smallString')),
      }),
    operations: [
      operation({
        description: 'SHOULD return true for `smallerLeftNum`',
        input: ref('smallerLeftNum'),
        expected: value(true),
      }),
      {
        description: 'SHOULD return true for `smallerLeftNumRef`',
        input: ref('smallerLeftNumRef'),
        expected: value(true),
      },
      {
        description: 'SHOULD return true for `smallerLeftStr`',
        input: ref('smallerLeftStr'),
        expected: value(true),
      },
      {
        description: 'SHOULD return true for `smallerLeftStrRef`',
        input: ref('smallerLeftStrRef'),
        expected: value(true),
      },
      {
        description: 'SHOULD return false for `equalNum`',
        input: ref('equalNum'),
        expected: value(false),
      },
      {
        description: 'SHOULD return false for `equalNumRef`',
        input: ref('equalNumRef'),
        expected: value(false),
      },
      {
        description: 'SHOULD return false for `equalStr`',
        input: ref('equalStr'),
        expected: value(false),
      },
      {
        description: 'SHOULD return false for `equalStrRef`',
        input: ref('equalStrRef'),
        expected: value(false),
      },
      {
        description: 'SHOULD return false for `largerLeftNum`',
        input: ref('largerLeftNum'),
        expected: value(false),
      },
      {
        description: 'SHOULD return false for `largerLeftNumRef`',
        input: ref('largerLeftNumRef'),
        expected: value(false),
      },
      {
        description: 'SHOULD return false for `largerLeftStr`',
        input: ref('largerLeftStr'),
        expected: value(false),
      },
      {
        description: 'SHOULD return false for `largerLeftStrRef`',
        input: ref('largerLeftStrRef'),
        expected: value(false),
      },
    ],
  });
});
