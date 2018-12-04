import muster, {
  CallNodeType,
  EntriesNodeType,
  FieldsNodeType,
  FirstItemNodeType,
  FnNodeType,
  getMusterOperationTypesMap,
  GetNodeType,
  KeyNodeType,
  NilNodeType,
  NodeDefinition,
  QueryNodeType,
  ref,
  RootNodeType,
  SeriesNodeType,
  SetNodeType,
  toNode,
  TreeNodeType,
  value,
  ValueNodeType,
} from '..';
import { ArithmeticNodeTypes } from '../nodes/arithmetic/nodes';
import { TransformsNodeTypes } from '../nodes/collection/transforms/nodes';
import { LogicNodeTypes } from '../nodes/logic/nodes';
import { StringNodeTypes } from '../nodes/string/nodes';
import { operation, runScenario } from '../test';
import { deserialize } from './deserialize';
import * as graphTypes from './graph-types';
import { serialize } from './serialize';
import * as types from './types';
import { buildNodeTypesMap } from './types-registry';

const DEFAULT_WHITELISTED_NODE_TYPES = buildNodeTypesMap([
  ...ArithmeticNodeTypes,
  ...TransformsNodeTypes,
  ...LogicNodeTypes,
  ...StringNodeTypes,
  FirstItemNodeType,
  CallNodeType,
  FieldsNodeType,
  FnNodeType,
  GetNodeType,
  KeyNodeType,
  EntriesNodeType,
  NilNodeType,
  QueryNodeType,
  RootNodeType,
  SeriesNodeType,
  SetNodeType,
  TreeNodeType,
  ValueNodeType,
]);

describe('serialize', () => {
  let initialGraph: NodeDefinition;
  let deserializedTree: NodeDefinition;

  beforeEach(() => {
    initialGraph = toNode(
      {
        name: 'Bob',
      },
      { catchAll: true },
    );
    const serializedGraph = serialize(initialGraph);
    deserializedTree = deserialize(
      DEFAULT_WHITELISTED_NODE_TYPES,
      getMusterOperationTypesMap(),
      JSON.parse(serializedGraph),
    );
  });

  runScenario({
    description: 'GIVEN a graph containing the original tree with catchAll',
    graph: () => muster(initialGraph),
    operations: [
      operation({
        description: 'WHEN requesting a name',
        input: ref('name'),
        expected: value('Bob'),
      }),
      operation({
        description: 'WHEN requesting anything else',
        input: ref('anything-else'),
        expected: value(undefined),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a deserialized tree with catchAll',
    graph: () => muster(deserializedTree),
    operations: [
      operation({
        description: 'WHEN requesting a name',
        input: ref('name'),
        expected: value('Bob'),
      }),
      operation({
        description: 'WHEN requesting anything else',
        input: ref('anything-else'),
        expected: value(undefined),
      }),
    ],
  });

  describe('MusterTypes', () => {
    function deserializeType(serialized: string): any {
      return deserialize(
        DEFAULT_WHITELISTED_NODE_TYPES,
        getMusterOperationTypesMap(),
        JSON.parse(serialized),
      );
    }

    const basicTypes = [
      types.any,
      types.ignore,
      types.empty,
      types.nil,
      types.bool,
      types.number,
      types.integer,
      types.string,
      types.date,
      types.func,
      types.symbol,
      types.object,
      types.matcher,
      types.array,
      graphTypes.context,
      graphTypes.scope,
      graphTypes.nodeType,
      graphTypes.nodeDefinition,
      graphTypes.graphNode,
      graphTypes.operationType,
      graphTypes.graphOperation,
      graphTypes.graphAction,
      graphTypes.event,
    ];
    basicTypes.map((type) => {
      describe(type.metadata.name, () => {
        it('SHOULD correctly serialise and then de-serialise type', () => {
          const initial = type;
          const serialized = serialize(initial);
          const deserialized = deserializeType(serialized);
          expect(initial).toBe(deserialized);
        });
      });
    });

    describe('instanceOf', () => {
      const instanceOfTypes = [Boolean, Number, String, Function, Symbol, Object, Array];
      instanceOfTypes.forEach((type) => {
        describe(`WHEN called with ${type.name}`, () => {
          it('SHOULD correctly serialise and then de-serialise type', () => {
            const initial = types.instanceOf(type);
            const serialized = serialize(initial);
            const deserialized = deserializeType(serialized);
            expect(deserialized.metadata.name).toBe(initial.metadata.name);
            expect(deserialized.metadata.type).toBe(initial.metadata.type);
            expect(deserialized.metadata.options).toEqual(initial.metadata.options);
          });
        });
      });
    });

    const complexTypes = [
      types.instance({
        first: types.string,
        second: types.number,
      }),
      types.oneOf(['first', 2, true]),
      types.shape({
        first: types.bool,
        second: types.string,
        third: types.number,
      }),
      types.arrayOf(types.string),
      types.objectOf(types.number),
      types.oneOfType([types.string, types.number, types.bool]),
      types.optional(types.string),
      types.saveHash(types.bool),
    ];
    complexTypes.forEach((type) => {
      describe(type.metadata.name, () => {
        it('SHOULD correctly serialise and then de-serialise type', () => {
          const initial = type;
          const serialized = serialize(initial);
          const deserialized = deserializeType(serialized);
          expect(deserialized.metadata.name).toBe(initial.metadata.name);
          expect(deserialized.metadata.type).toBe(initial.metadata.type);
          expect(deserialized.metadata.options).toEqual(initial.metadata.options);
        });
      });
    });
  });
});
