import mapValues from 'lodash/mapValues';
import {
  evaluateOperation,
  EvaluateOperation,
  supportsEvaluateOperation,
} from '../../operations/evaluate';
import {
  ContextDependency,
  ContextName,
  Dependency,
  GraphAction,
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeLike,
  NodeName,
  NodeProperties,
  SerializedNodeProperties,
  StatefulGraphNode,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
  StatelessOperationHandler,
} from '../../types/graph';
import { createContext } from '../../utils/create-context';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import isStatefulNodeType from '../../utils/is-stateful-node-type';
import parseNodeDependency from '../../utils/parse-node-dependency';
import shallow from '../../utils/shallow';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { value } from './value';

/**
 * An instance of the [[injectDependencies]] node.
 * See the [[injectDependencies]] documentation to find out more.
 */
export interface InjectDependenciesNode<T extends NodeDefinition>
  extends StatelessGraphNode<'inject-dependencies', InjectDependenciesNodeProperties<T>> {}

/**
 * A definition of the [[injectDependencies]] node.
 * See the [[injectDependencies]] documentation to find out more.
 */
export interface InjectDependenciesNodeDefinition<T extends NodeDefinition>
  extends StatelessNodeDefinition<'inject-dependencies', InjectDependenciesNodeProperties<T>> {}

export interface InjectDependenciesNodeProperties<T extends NodeDefinition> {
  context?: { [key in ContextName]: NodeDefinition };
  dependencies: Array<NodeDefinition | GraphNode | undefined>;
  target: T;
}

/**
 * An implementation of the [[injectDependencies]] node.
 * See the [[injectDependencies]] documentation to find out more.
 */
export const InjectDependenciesNodeType: StatelessNodeType<
  'inject-dependencies',
  InjectDependenciesNodeProperties<NodeDefinition>
> = createNodeType('inject-dependencies', {
  shape: {
    context: types.optional(types.objectOf(graphTypes.nodeDefinition)),
    dependencies: types.arrayOf(
      types.optional(
        types.oneOfType<NodeDefinition | GraphNode>([
          graphTypes.nodeDefinition,
          graphTypes.graphNode,
        ]),
      ),
    ),
    target: graphTypes.nodeDefinition,
  },
  serialize: false,
  deserialize: false,
  operations: {
    evaluate: {
      cacheable: true,
      getDependencies<T extends NodeDefinition>(
        properties: InjectDependenciesNodeProperties<T>,
        operation: EvaluateOperation,
      ): Array<Dependency> {
        const { target } = properties;
        if (!supportsEvaluateOperation(target)) {
          return [];
        }
        const evaluateOperationHandler = target.type.operations.evaluate;
        return getDependencies(properties, evaluateOperationHandler, operation);
      },
      getContextDependencies<T extends NodeDefinition>(
        properties: InjectDependenciesNodeProperties<T>,
        operation: EvaluateOperation,
      ): Array<ContextDependency> {
        const { target } = properties;
        if (!supportsEvaluateOperation(target)) {
          return [];
        }
        const evaluateOperationHandler = target.type.operations.evaluate;
        return getContextDependencies(properties, evaluateOperationHandler, operation);
      },
      run<T extends NodeDefinition>(
        node: InjectDependenciesNode<T>,
        operation: EvaluateOperation,
        dependencies: Array<GraphNode>,
        contextDependencies: Array<GraphNode>,
      ): GraphNode | GraphAction {
        const { target, context } = node.definition.properties;
        if (!supportsEvaluateOperation(target)) {
          return withScopeFrom(node, target);
        }
        const nodeType = target.type;
        const {
          dependencies: resolvedDependencies,
          contextDependencies: resolvedContextDependencies,
        } = getResolvedDependencies(
          node.definition,
          nodeType.operations.evaluate,
          operation,
          dependencies,
          contextDependencies,
        );
        const targetContext = context
          ? createContext(node.context, mapValues(context, (value) => withScopeFrom(node, value)))
          : node.context;
        const targetNode = createGraphNode(node.scope, targetContext, target);
        if (isStatefulNodeType(nodeType)) {
          return nodeType.operations.evaluate.run(
            targetNode,
            evaluateOperation(),
            resolvedDependencies,
            resolvedContextDependencies,
            node.scope.store.getNodeState(targetNode as StatefulGraphNode),
          );
        }
        return nodeType.operations.evaluate.run(
          targetNode,
          evaluateOperation(),
          resolvedDependencies,
          resolvedContextDependencies,
          undefined,
        );
      },
    },
  },
});

/**
 * Creates a new instance of the [[injectDependencies]] node, which can be used when creating partially resolved nodes.
 * This node allows supplying some or all of the context and node dependencies of a given node.
 *
 *
 * @example **Call inject dependencies on a computed node - no injected dependencies**
 * ```js
 * import muster, {
 *   computed,
 *   injectDependencies,
 *   ref,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   two: 2,
 *   four: 4,
 * });
 *
 * await app.resolve(injectDependencies(
 *   computed(
 *     [ref('four'), ref('two')],
 *     (left, right) => left * right,
 *   ),
 *   [], // Dependencies to override
 * )); // === 8
 * ```
 * In this example we have created a computed node with two dependencies:
 *   - ref('four')
 *   - ref('two')
 *
 * When resolved against the graph above this produces 8. Because in our example we have not overridden any dependencies
 * through the `injectDependencies`, the node end up resolving to 8 as well.
 *
 *
 * @example **Call inject dependencies on a computed node - change both dependencies**
 * ```js
 * import muster, {
 *   computed,
 *   injectDependencies,
 *   ref,
 *   value,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   two: 2,
 *   four: 4,
 * });
 *
 * await app.resolve(injectDependencies(
 *   computed(
 *     [ref('four'), ref('two')],
 *     (left, right) => left * right,
 *   ),
 *   [value(5), value(3)], // Dependencies to override
 * )); // === 15
 * ```
 * This example re-uses the code from the previous example with a notable difference of having defined dependency overrides.
 * Note that the values used as overrides are now 5 and 3. Due to the way the [[computed]] node is implemented
 * the order of these values matches the order of arguments in the `combine` function of the computed, meaning that
 * `left = 5` and `right = 3`.
 *
 *
 * @example **Call inject dependencies on a computed node - change only the last argument**
 * ```js
 * import muster, {
 *   computed,
 *   injectDependencies,
 *   ref,
 *   value,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   two: 2,
 *   four: 4,
 * });
 *
 * await app.resolve(injectDependencies(
 *   computed(
 *     [ref('four'), ref('two')],
 *     (left, right) => left * right,
 *   ),
 *   [undefined, value(3)], // Dependencies to override
 * )); // === 12
 * ```
 * Apart from being able to override all dependencies, [[injectDependencies]] node enables the developers with ability to
 * override a specific dependency. In the example code above the first dependency was set to `undefined`, which tells
 * the [[injectDependencies]] node that this is not a real value, and it should resolve it as normally, but the second
 * dependency is defined. This means that the `combine` function of the [[computed]] node is called with
 * `left = ref('four') => 4` and `right = 3`.
 */
export function injectDependencies(
  target: NodeDefinition,
  dependencies: Array<NodeDefinition | NodeLike>,
  context?: { [name: string]: NodeDefinition | NodeLike },
): InjectDependenciesNodeDefinition<NodeDefinition> {
  return createNodeDefinition(InjectDependenciesNodeType, {
    target,
    dependencies: dependencies.map((dependency) =>
      isNodeDefinition(dependency)
        ? dependency
        : dependency === undefined
        ? undefined
        : value(dependency),
    ),
    context:
      context &&
      mapValues(context, (contextValue) =>
        isNodeDefinition(contextValue) ? contextValue : value(contextValue),
      ),
  } as InjectDependenciesNodeProperties<NodeDefinition>);
}

export function isInjectDependenciesNodeDefinition(
  value: NodeDefinition,
): value is InjectDependenciesNodeDefinition<NodeDefinition> {
  return value.type === InjectDependenciesNodeType;
}

interface EvaluateOperationHandler
  extends StatelessOperationHandler<
      NodeName,
      NodeProperties,
      SerializedNodeProperties,
      'evaluate',
      EvaluateOperation
    > {}

function getDependencies(
  properties: InjectDependenciesNodeProperties<NodeDefinition>,
  handler: EvaluateOperationHandler,
  operation: EvaluateOperation,
): Array<Dependency> {
  const { target, dependencies: suppliedDependencies, context: suppliedContext } = properties;
  const targetDependencies = handler.getDependencies(target, operation);
  const dependencies = targetDependencies.map((dependency, index) => {
    const suppliedValue = suppliedDependencies[index];
    if (!suppliedValue) {
      return dependency;
    }
    return {
      target: suppliedValue,
      operation: dependency.operation,
      allowErrors: dependency.allowErrors,
      allowPending: dependency.allowPending,
      invalidate: dependency.invalidate,
    };
  });
  const targetContextDependencies = handler.getContextDependencies(target, operation);
  if (!suppliedContext) {
    return dependencies;
  }
  const suppliedContextDependencies = targetContextDependencies
    .filter((dependency) => dependency.name in suppliedContext)
    .map(
      (dependency) =>
        // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
        [dependency, suppliedContext[dependency.name as any]] as [
          ContextDependency,
          NodeDefinition
        ],
    )
    .map(([dependency, suppliedValue]) => parseNodeDependency(suppliedValue, dependency));
  return [...dependencies, ...suppliedContextDependencies];
}

function getContextDependencies(
  properties: InjectDependenciesNodeProperties<NodeDefinition>,
  handler: EvaluateOperationHandler,
  operation: EvaluateOperation,
): Array<ContextDependency> {
  const { target, context: suppliedContext = {} } = properties;
  const requiredContextDependencies = handler.getContextDependencies(target, operation);
  const missingContextDependencies = requiredContextDependencies
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    .filter((dependency, index) => !suppliedContext[dependency.name as any])
    .map((dependency) => ({ ...dependency, until: shallow }));
  return missingContextDependencies;
}

function getResolvedDependencies(
  definition: InjectDependenciesNodeDefinition<NodeDefinition>,
  handler: EvaluateOperationHandler,
  operation: EvaluateOperation,
  dependencies: Array<GraphNode>,
  contextDependencies: Array<GraphNode>,
): { dependencies: Array<GraphNode>; contextDependencies: Array<GraphNode> } {
  const { target, context: suppliedContext = {} } = definition.properties;
  const targetDependencies = handler.getDependencies(target, operation);
  const targetContextDependencies = handler.getContextDependencies(target, operation);
  const resolvedDependencies = dependencies.slice(0, targetDependencies.length);
  const resolvedSuppliedContextDependencies = dependencies.slice(targetDependencies.length);
  const resolvedContextDependencies = targetContextDependencies.reduce(
    (acc, dependency, index) =>
      // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
      suppliedContext[dependency.name as any]
        ? {
            ...acc,
            dependencies: [...dependencies, resolvedSuppliedContextDependencies[acc.suppliedIndex]],
            suppliedIndex: acc.suppliedIndex + 1,
          }
        : {
            ...acc,
            dependencies: [...dependencies, contextDependencies[acc.resolvedIndex]],
            resolvedIndex: acc.resolvedIndex + 1,
          },
    { suppliedIndex: 0, resolvedIndex: 0, dependencies: [] },
  ).dependencies;
  return {
    dependencies: resolvedDependencies,
    contextDependencies: resolvedContextDependencies,
  };
}
