import {
  Dependency,
  GraphAction,
  GraphNode,
  isGraphAction,
  isGraphNode,
  isNodeDefinition,
  NODE_TYPE,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import * as graphTypes from '../../utils/graph-types';
import * as hash from '../../utils/hash';
import parseNodeDependency from '../../utils/parse-node-dependency';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';

/**
 * An instance of the [[resolve]] node.
 * See the [[resolve]] documentation to find out more.
 */
export interface ResolveNode extends StatelessGraphNode<'resolve', ResolveNodeProperties> {}

/**
 * A definition of the [[resolve]] node.
 * See the [[resolve]] documentation to find out more.
 */
export interface ResolveNodeDefinition
  extends StatelessNodeDefinition<'resolve', ResolveNodeProperties> {}

export interface ResolveNodeProperties {
  dependencies: Array<NodeDependency | GraphAction>;
  combine: (values: Array<GraphNode>) => GraphNode | GraphAction | NodeDefinition;
}

const EMPTY_CONTEXT_DEPENDENCIES: Array<never> = [];

const RESOLVE_NODE_SHAPE = {
  dependencies: types.arrayOf(
    types.oneOfType<NodeDependency | GraphAction>([
      types.shape({
        target: types.oneOfType<NodeDefinition | GraphNode>([
          graphTypes.graphNode,
          graphTypes.nodeDefinition,
        ]),
        allowErrors: types.optional(types.bool),
        allowPending: types.optional(types.bool),
        acceptNil: types.optional(types.bool),
        once: types.optional(types.bool),
        until: types.optional(
          types.shape({
            predicate: types.saveHash(types.func),
            errorMessage: types.optional(
              types.oneOfType<string | Function>([types.string, types.saveHash(types.func)]),
            ),
          }),
        ),
      }),
      graphTypes.graphAction,
    ]),
  ),
  combine: types.saveHash(types.func),
};

/**
 * The implementation of the [[resolve]] node.
 * See the [[resolve]] documentation to learn more.
 */
export const ResolveNodeType: StatelessNodeType<'resolve', ResolveNodeProperties> = {
  [NODE_TYPE]: true,
  name: 'resolve',
  shape: types.shape(RESOLVE_NODE_SHAPE),
  is(value: GraphNode): value is ResolveNode {
    return isGraphNode(value) && value.definition.type === ResolveNodeType;
  },
  hash: hash.shape(RESOLVE_NODE_SHAPE),
  serialize: false as false,
  deserialize: false as false,
  operations: {
    evaluate: {
      cacheable: true,
      getDependencies(definition: ResolveNodeDefinition): Array<Dependency> {
        const { dependencies } = definition.properties;
        return dependencies.map(
          (dependency) =>
            isGraphAction(dependency)
              ? {
                  target: dependency.node,
                  operation: dependency.operation,
                  allowErrors: true,
                  allowPending: true,
                  invalidate: false,
                }
              : parseNodeDependency(dependency.target, dependency),
        );
      },
      getContextDependencies(): Array<never> {
        return EMPTY_CONTEXT_DEPENDENCIES;
      },
      run(
        node: ResolveNode,
        options: never,
        dependencies: Array<GraphNode>,
      ): GraphNode | GraphAction {
        const { combine } = node.definition.properties;
        const result = combine(dependencies);
        return isNodeDefinition(result) ? withScopeFrom(node, result) : result;
      },
    },
  },
};

/**
 * Creates a new instance of a [[resolve]] node, which is useful when you need to change the resolution scope or when
 * the default end condition must be changed. The [[resolve]] works in the same way as the
 * [[computed]] but allows for more fine-grained control over the scopes and dependencies.
 * See the [[NodeDependency]] interface to find out more about available properties.
 *
 * The node is mainly used as part of the implementation of other Muster graph nodes. Examples of graph
 * nodes that use the [[resolve]]:
 * - [[context]]
 * - [[extend]]
 * - [[set]]
 * - and many more
 *
 * Using this node outside a [[NodeDefinition]] implementation is hard because the
 * [[ResolverScope]] needed to declare dependencies is easily available outside the
 * Muster implementation.
 *
 * See the above-mentioned graph nodes to learn how to use the [[resolve]].
 */
export function resolve(
  dependencies: ResolveNodeProperties['dependencies'],
  combine: ResolveNodeProperties['combine'],
): ResolveNodeDefinition {
  return createNodeDefinition(ResolveNodeType, {
    dependencies,
    combine,
  });
}

export function isResolveNodeDefinition(value: NodeDefinition): value is ResolveNodeDefinition {
  return value.type === ResolveNodeType;
}
