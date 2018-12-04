import {
  ContextDependency,
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import shallow from '../../utils/shallow';
import * as types from '../../utils/types';

/**
 * An instance of the [context](../modules/_nodes_graph_context_.html#context) node.
 * See the [context](../modules/_nodes_graph_context_.html#context) documentation to find out more.
 */
export interface ContextNode extends StatelessGraphNode<'context', ContextNodeProperties> {}

/**
 * A definition of the [context](../modules/_nodes_graph_context_.html#context) node.
 * See the [context](../modules/_nodes_graph_context_.html#context) documentation to find out more.
 */
export interface ContextNodeDefinition
  extends StatelessNodeDefinition<'context', ContextNodeProperties> {}

export interface ContextNodeProperties {
  name: string | symbol;
}

/**
 * The implementation of the [context](../modules/_nodes_graph_context_.html#context) node.
 * See the [context](../modules/_nodes_graph_context_.html#context) documentation to learn more.
 */
export const ContextNodeType: StatelessNodeType<'context', ContextNodeProperties> = createNodeType<
  'context',
  ContextNodeProperties
>('context', {
  shape: {
    name: types.oneOfType<string | symbol>([types.string, types.symbol]),
  },
  operations: {
    evaluate: {
      getContextDependencies({ name }: ContextNodeProperties): [ContextDependency] {
        return [{ name, required: true, until: shallow }];
      },
      run(
        node: ContextNode,
        options: never,
        dependencies: Array<never>,
        [contextNode]: [GraphNode],
      ): GraphNode {
        return contextNode;
      },
    },
  },
});

/**
 * Creates a new instance of a [[context]] node, which is a type of [[NodeDefinition]] used to access nodes
 * stored on the current scope. The nodes can be added to the scope by the following [[NodeDefinition]]s:
 * - [[scope]]
 * - [[withContext]]
 *
 * There's a significant difference between the [[scope]] and the [[withContext]].
 * The [[withContext]] node enables the ability of storing nodes on the scope. The [[scope]] does
 * the same thing and additionally every node defined within that scope is locked to it. Nodes
 * defined inside of the [[scope]] cannot access any node outside it. Such limitation does not
 * exist for nodes defined inside the [[withContext]].
 *
 *
 * @example **Extract value from `scope`**
 * ```js
 * import muster, { computed, context, ref, scope, value } from '@dws/muster';
 *
 * const app = muster({
 *   innerScope: scope({
 *     greeting: computed([context('name')], (name) =>
 *       `Hello, ${name}`,
 *     ),
 *   }, {
 *     name: value('Bob'),
 *   }),
 * });
 *
 * const greeting = await app.resolve(ref('innerScope', 'greeting'));
 * // greeting === 'Hello, Bob'
 * ```
 * This example shows how to use the [[context]] to gain access to the nodes available on the
 * scope. See the [[scope]] documentation to learn more about scopes.
 *
 *
 * @example **Extract value from `withContext`**
 * ```js
 * import muster, { computed, context, ref, value, withContext } from '@dws/muster';
 *
 * const app = muster({
 *   inner: withContext({
 *     name: value('Bob'),
 *   }, {
 *     greeting: computed([context('name')], (name) =>
 *       `Hello, ${name}`,
 *     ),
 *   }),
 * });
 *
 * const greeting = await app.resolve(ref('inner', 'greeting'));
 * // greeting === 'Hello, Bob';
 * ```
 * This example shows how to use the [[context]] to gain access to the nodes available on the
 * scope. See the [[withContext]] documentation to learn more.
 */
export function context(name: string | symbol): ContextNodeDefinition {
  return createNodeDefinition(ContextNodeType, {
    name,
  });
}

export function isContextNodeDefinition(value: NodeDefinition): value is ContextNodeDefinition {
  return value.type === ContextNodeType;
}
