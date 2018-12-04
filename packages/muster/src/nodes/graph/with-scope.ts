import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';

/**
 * An instance of the [[withScope]] node.
 * See the [[withScope]] documentation to find out more.
 */
export interface WithScopeNode extends StatelessGraphNode<'withScope', WithScopeNodeProperties> {}

/**
 * A definition of the [[withScope]] node.
 * See the [[withScope]] documentation to find out more.
 */
export interface WithScopeNodeDefinition
  extends StatelessNodeDefinition<'withScope', WithScopeNodeProperties> {}

export interface WithScopeNodeProperties {
  target: NodeDefinition | GraphNode;
  expression: NodeDefinition;
}

/**
 * The implementation of the [[withScope]] node.
 * See the [[withScope]] documentation for more information.
 */
export const WithScopeNodeType: StatelessNodeType<
  'withScope',
  WithScopeNodeProperties
> = createNodeType<'withScope', WithScopeNodeProperties>('withScope', {
  shape: {
    target: types.oneOfType<NodeDefinition | GraphNode>([
      graphTypes.nodeDefinition,
      graphTypes.graphNode,
    ]),
    expression: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target, expression }: WithScopeNodeProperties): [NodeDependency] {
        return [{ target }];
      },
      run(node: WithScopeNode, options: never, [subjectNode]: [GraphNode]): GraphNode {
        const { expression } = node.definition.properties;
        return withScopeFrom(subjectNode, expression);
      },
    },
  },
});

/**
 * Creates an instance of a [[withScope]] node, which evaluates an expression within the supplied
 * target scope.
 *
 * This is typically used in combination with a [[scope]] node to restrict an arbitrary input
 * expression's access to a predefined 'safe' portion of the graph.
 *
 * @example **Sandboxing arbitrary expressions to a scoped sub-graph**
 * ```js
 * import muster, { arrayList, call, entries, fn, push, query, ref, root, scope, withScope, value } from '@dws/muster';
 *
 * const app = muster({
 *   private: value('secret'),
 *   sandboxed: scope({
 *     todos: arrayList([]),
 *     addTodo: fn((item) => push(ref('todos'), item)),
 *   }),
 * });
 *
 * const query1 = query(root(), {
 *   'todos': entries(),
 * });
 * app.resolve(withScope(ref('sandboxed'), query1)).subscribe((todos) => {
 *   console.log(todos);
 * });
 * // Console output:
 * // []
 *
 * const query2 = call('addTodo', ['First item']);
 * await withScope(ref('sandboxed'), query2);
 * // Console output:
 * // ['First item']
 *
 * const query3 = ref('private');
 * await withScope(ref('sandboxed'), query3); // Throws error: "Invalid child key: "private""
 * ```
 */
export function withScope(
  target: NodeDefinition | GraphNode | NodeLike,
  expression: NodeDefinition | NodeLike,
): WithScopeNodeDefinition {
  return createNodeDefinition(WithScopeNodeType, {
    target: toNode(target),
    expression: toNode(expression),
  } as WithScopeNodeProperties);
}

export function isWithScopeNodeDefinition(value: NodeDefinition): value is WithScopeNodeDefinition {
  return value.type === WithScopeNodeType;
}
