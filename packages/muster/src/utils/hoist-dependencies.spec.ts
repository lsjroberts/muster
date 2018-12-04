import {
  context,
  createNodeDefinition,
  default as muster,
  eq,
  fn,
  FnNodeType,
  NodeDefinition,
  ref,
  resolve,
  root,
  value,
  withScopeFrom,
} from '../';
import { add } from '../nodes/arithmetic/add';
import { filter, FilterNodeType } from '../nodes/collection/transforms/filter';
import { operation, runScenario } from '../test';
import hoistDependencies from './hoist-dependencies';

function inlineDependencies(node: NodeDefinition): NodeDefinition {
  return resolve([{ target: root() }], ([rootNode]) =>
    hoistDependencies(withScopeFrom(rootNode, node)),
  );
}

describe('hoistDependencies', () => {
  runScenario({
    description: 'GIVEN a muster graph containing a few nodes',
    graph: () =>
      muster({
        testString: value('Test string'),
        testNumber: value(15),
        refTestNumber: ref('testNumber'),
      }),
    operations: [
      operation({
        description: 'WHEN extracting dependencies for a simple expression',
        input: inlineDependencies(value(true)),
        expected: value(true),
      }),
      operation({
        description: 'WHEN extracting dependencies for a simple ref',
        input: inlineDependencies(ref('testString')),
        expected: value('Test string'),
      }),
      operation({
        description: 'WHEN extracting dependencies for a simple filter',
        input: inlineDependencies(filter((item: NodeDefinition) => eq(item, value(5)))),
        expected: createNodeDefinition(FilterNodeType, {
          predicate: createNodeDefinition(FnNodeType, {
            argIds: ['$$arg:1'],
            body: eq(context('$$arg:1'), value(5)) as NodeDefinition,
            hasNamedArgs: false,
          }) as NodeDefinition,
        }),
      }),
      operation({
        description: 'WHEN extracting dependencies for a simple filter with a ref',
        input: inlineDependencies(filter((item: NodeDefinition) => eq(item, ref('testNumber')))),
        expected: createNodeDefinition(FilterNodeType, {
          predicate: createNodeDefinition(FnNodeType, {
            argIds: ['$$arg:2'],
            body: eq(context('$$arg:2'), value(15)) as NodeDefinition,
            hasNamedArgs: false,
          }) as NodeDefinition,
        }),
      }),
      operation({
        description: 'WHEN extracting dependencies for a simple filter with a ref to a ref',
        input: inlineDependencies(filter((item: NodeDefinition) => eq(item, ref('refTestNumber')))),
        expected: createNodeDefinition(FilterNodeType, {
          predicate: createNodeDefinition(FnNodeType, {
            argIds: ['$$arg:3'],
            body: eq(context('$$arg:3'), value(15)) as NodeDefinition,
            hasNamedArgs: false,
          }) as NodeDefinition,
        }),
      }),
      operation({
        description: 'WHEN extracting dependencies for a filter containing add operation',
        input: inlineDependencies(filter((item: NodeDefinition) => add(item, value(5)))),
        expected: createNodeDefinition(FilterNodeType, {
          predicate: createNodeDefinition(FnNodeType, {
            argIds: ['$$arg:4'],
            body: add(context('$$arg:4'), value(5)) as NodeDefinition,
            hasNamedArgs: false,
          }) as NodeDefinition,
        }),
      }),
      operation({
        description: 'WHEN extracting dependencies for a filter containing add operation with ref',
        input: inlineDependencies(filter((item: NodeDefinition) => add(item, ref('testNumber')))),
        expected: createNodeDefinition(FilterNodeType, {
          predicate: createNodeDefinition(FnNodeType, {
            argIds: ['$$arg:5'],
            body: add(context('$$arg:5'), value(15)) as NodeDefinition,
            hasNamedArgs: false,
          }) as NodeDefinition,
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph with a value node in the root',
    graph: () => muster(value('foo')),
    operations: [
      operation({
        description: 'WHEN extracting dependencies for a simple function with a root reference',
        input: inlineDependencies(fn((item) => eq(item, root()))),
        expected: createNodeDefinition(FnNodeType, {
          argIds: ['$$arg:6'],
          body: eq(context('$$arg:6'), value('foo')) as NodeDefinition,
          hasNamedArgs: false,
        }),
      }),
    ],
  });
});
