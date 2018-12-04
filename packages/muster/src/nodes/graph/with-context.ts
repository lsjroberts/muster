import fromPairs from 'lodash/fromPairs';
import {
  ContextName,
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import { createContext } from '../../utils/create-context';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';

/**
 * An instance of the [[withContext]] node.
 * See the [[withContext]] documentation to find out more.
 */
export interface WithContextNode
  extends StatelessGraphNode<'withContext', WithContextNodeProperties> {}

/**
 * A definition of the [[withContext]] node.
 * See the [[withContext]] documentation to find out more.
 */
export interface WithContextNodeDefinition
  extends StatelessNodeDefinition<'withContext', WithContextNodeProperties> {}

export interface WithContextNodeProperties {
  values: { [key in ContextName]: GraphNode | NodeDefinition };
  target: NodeDefinition;
}

/**
 * The implementation of the [[withContext]] node.
 * See the [[withContext]] documentation to learn more.
 */
export const WithContextNodeType: StatelessNodeType<
  'withContext',
  WithContextNodeProperties
> = createNodeType<'withContext', WithContextNodeProperties>('withContext', {
  shape: {
    values: types.objectOf(
      types.oneOfType<NodeDefinition | GraphNode>([
        graphTypes.nodeDefinition,
        graphTypes.graphNode,
      ]),
    ),
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      run(node: WithContextNode): GraphNode {
        const { target, values } = node.definition.properties;
        const boundContextValues = fromPairs(
          [...Object.getOwnPropertySymbols(values), ...Object.keys(values)].map(
            (contextKey): [string | symbol, GraphNode] => {
              // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
              const value = values[contextKey as any];
              return [contextKey, isGraphNode(value) ? value : withScopeFrom(node, value)];
            },
          ),
        );
        const childContext = createContext(node.context, boundContextValues);
        return createGraphNode(node.scope, childContext, target);
      },
    },
  },
});

/**
 * Creates a new instance of a [[withContext]] node, which is used when there's a need of storing some data on the context.
 * Used internally by the [[hoistDependencies]] utility when sending the data to the remote muster
 * instance.
 *
 *
 * @example **Store and access data from context**
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
 * This example shows how to use the [[withContext]] to store data on the context and how
 * to access it with the help of the [[context]].
 */
export function withContext(
  values: { [key in ContextName]: GraphNode | NodeDefinition },
  target: NodeDefinition | NodeLike,
): WithContextNodeDefinition {
  return createNodeDefinition(WithContextNodeType, {
    values,
    target: toNode(target),
  });
}

export function isWithContextNodeDefinition(
  value: NodeDefinition,
): value is WithContextNodeDefinition {
  return value.type === WithContextNodeType;
}
