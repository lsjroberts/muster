import {
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';

/**
 * An instance of the [[root]] node.
 * See the [[root]] documentation to find out more.
 */
export interface RootNode extends StatelessGraphNode<'root'> {}

/**
 * A definition of the [[root]] node.
 * See the [[root]] documentation to find out more.
 */
export interface RootNodeDefinition extends StatelessNodeDefinition<'root'> {}

export const ROOT_CONTEXT_NAME = Symbol('ROOT');

/**
 * The implementation of the [[root]] node.
 * See the [[root]] documentation to learn more.
 */
export const RootNodeType: StatelessNodeType<'root'> = createNodeType<'root'>('root', {
  operations: {
    evaluate: {
      run(node: RootNode): GraphNode {
        return node.context.values[ROOT_CONTEXT_NAME as any];
      },
    },
  },
});

const INSTANCE = createNodeDefinition(RootNodeType, {});

/**
 * Creates a new instance of a [[root]] node, which is used when you want to get the instance of the root graph node.
 * Resolving this node gets the top-most node of the graph.
 *
 *
 * @example **Get the root node**
 * ```js
 * import muster, { computed, root, value } from '@dws/muster';
 *
 * const app = muster(value('World'));
 *
 * const greeting = await app.resolve(
 *   computed([root()], (name) => `Hello, ${name}`),
 * );
 * // greeting === 'Hello, World'
 * ```
 * This example shows how to use the [[root]] to get access to the root node of the graph.
 */
export function root(): RootNodeDefinition {
  return INSTANCE;
}

export function isRootNodeDefinition(value: NodeDefinition): value is RootNodeDefinition {
  return value.type === RootNodeType;
}
