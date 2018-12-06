import flatMap from 'lodash/flatMap';
import fromPairs from 'lodash/fromPairs';
import toPairs from 'lodash/toPairs';
import zip from 'lodash/zip';
import { resolve } from '../nodes/graph/resolve';
import { withContext } from '../nodes/graph/with-context';
import { evaluateOperation, supportsEvaluateOperation } from '../operations/evaluate';
import {
  ContextDependency,
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  StatelessOperationHandler,
} from '../types/graph';
import createNodeDefinition from './create-node-definition';
import getOperationHandler from './get-operation-handler';
import withScopeFrom from './with-scope-from';

export default function hoistDependencies(node: GraphNode): GraphNode {
  const { dependencies, factory } = extractDependencies(node);
  if (dependencies.length === 0) return factory([]);
  return withScopeFrom(node, resolve(dependencies, (res) => factory(res)));
}

interface NodeFactory {
  dependencies: Array<NodeDependency>;
  factory: (dependencies: Array<GraphNode>) => GraphNode;
}

function extractDependencies(node: GraphNode): NodeFactory {
  if (supportsEvaluateOperation(node) && canBeResolved(node)) {
    return {
      dependencies: [{ target: node }],
      factory: ([resolvedNode]) => resolvedNode,
    };
  }
  const nodeProps = toPairs(node.definition.properties).filter(
    ([key, value]) =>
      isNodeDefinition(value) || (Array.isArray(value) && value.every(isNodeDefinition)),
  ) as Array<[string, NodeDefinition | Array<NodeDefinition>]>;
  const children = nodeProps.map(
    ([key, value]) =>
      [
        key,
        {
          multiple: Array.isArray(value),
          factories: (Array.isArray(value) ? value : [value]).map((childNodeDefinition) =>
            extractDependencies(withScopeFrom(node, childNodeDefinition)),
          ),
        },
      ] as [string, { multiple: boolean; factories: Array<NodeFactory> }],
  );
  return {
    dependencies: flatMap(children, ([key, { factories }]) =>
      flatMap(factories, ({ dependencies }) => dependencies),
    ),
    factory: (flattenedDependencies: Array<GraphNode>): GraphNode => {
      const resolvedChildren = children.reduce(
        (acc, [key, { multiple, factories }]) => {
          const { children, remainingDependencies } = factories.reduce(
            (acc, { factory, dependencies }) => {
              const [childDependencies, remainingDependencies] = partitionAtIndex(
                acc.remainingDependencies,
                dependencies.length,
              );
              const childNode = factory(childDependencies);
              return {
                remainingDependencies,
                children: [...acc.children, childNode],
              };
            },
            {
              remainingDependencies: acc.resolvedDependencies,
              children: [],
            },
          );
          return {
            resolvedDependencies: remainingDependencies,
            children: [...acc.children, multiple ? children : children[0]],
          };
        },
        {
          resolvedDependencies: flattenedDependencies,
          children: [],
        },
      ).children;
      const rewrittenNode = createNodeDefinition(node.definition.type, {
        ...node.definition.properties,
        ...fromPairs(
          (zip<[string, NodeDefinition | Array<NodeDefinition>] | GraphNode | Array<GraphNode>>(
            nodeProps,
            resolvedChildren,
          ) as Array<
            [[string, NodeDefinition | Array<NodeDefinition>], GraphNode | Array<GraphNode>]
          >).map(([[key], value]) => [
            key,
            Array.isArray(value) ? value.map((node) => node.definition) : value.definition,
          ]),
        ),
      });
      const contextDeps = getContextDependencies(node);
      const existingContextDeps = contextDeps.filter(({ name }) => name in node.context.values);
      const existingContextValues =
        existingContextDeps.length > 0
          ? // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
            fromPairs(
              existingContextDeps.map(({ name }) => [name, node.context.values[name as any]]),
            )
          : undefined;
      return withScopeFrom(
        node,
        existingContextValues ? withContext(existingContextValues, rewrittenNode) : rewrittenNode,
      );
    },
  };
}

function canBeResolved(node: GraphNode): boolean {
  if (!hasAllContextDependencies(node)) return false;
  return canResolveDependencies(node);
}

function canResolveDependencies(node: GraphNode): boolean {
  const operation = evaluateOperation();
  const evaluateHandler = getOperationHandler(node, operation);
  if (!evaluateHandler) return true;
  const dependencies = (evaluateHandler as StatelessOperationHandler).getDependencies(
    node.definition,
    operation,
  );
  return dependencies.every(({ target }) =>
    canBeResolved(isGraphNode(target) ? target : withScopeFrom(node, target)),
  );
}

function getContextDependencies(node: GraphNode): Array<ContextDependency> {
  const operation = evaluateOperation();
  const evaluateHandler = getOperationHandler(node, operation);
  if (!evaluateHandler) return [];
  return (evaluateHandler as StatelessOperationHandler).getContextDependencies(
    node.definition,
    operation,
  );
}

function hasAllContextDependencies(node: GraphNode): boolean {
  return getContextDependencies(node)
    .filter((dependency) => Boolean(dependency.required))
    .every((dependency) => dependency.name in node.context.values);
}

function partitionAtIndex<T>(items: Array<T>, splitStartIndex: number): [Array<T>, Array<T>] {
  return [items.slice(0, splitStartIndex), items.slice(splitStartIndex)];
}
