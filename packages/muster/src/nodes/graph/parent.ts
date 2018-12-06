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
import { error } from './error';
import { PARENT } from './get';

/**
 * An instance of the [[parent]] node.
 * See the [[parent]] documentation to find out more.
 */
export interface ParentNode extends StatelessGraphNode<'parent'> {}

/**
 * A definition of the [[parent]] node.
 * See the [[parent]] documentation to find out more.
 */
export interface ParentNodeDefinition extends StatelessNodeDefinition<'parent'> {}

/**
 * The implementation of the [[parent]] node.
 * See the [[parent]] documentation to learn more.
 */
export const ParentNodeType: StatelessNodeType<'parent'> = createNodeType<'parent'>('parent', {
  operations: {
    evaluate: {
      getContextDependencies(): [ContextDependency] {
        return [
          {
            name: PARENT,
            required: false,
            until: shallow,
            defaultValue: error('Cannot resolve parent of root node'),
          },
        ];
      },
      run(
        node: ParentNode,
        options: never,
        dependencies: Array<never>,
        [parentNode]: [GraphNode],
      ): GraphNode {
        return parentNode;
      },
    },
  },
});

const INSTANCE = createNodeDefinition(ParentNodeType, {});

/**
 * Creates a new instance of a [[parent]] node, which is used to retrieve the parent of a given node.
 * The [[parent]] returns a [[NodeDefinition]] that is a parent in terms of the path in the
 * graph. Imagine that there's a node you can access using a following [[ref]]:
 * `ref('deeply', 'nested', 'node')`. If the `node` addressed by that ref used a [[parent]] it
 * would have returned the same node as the node addressed by `ref('deeply', 'nested')`.
 *
 *
 * @example **Retrieve a value of a sibling**
 * ```js
 * import muster, { get, parent, ref } from '@dws/muster';
 *
 * const app = muster({
 *   something: get(parent(), 'other'),
 *   other: 'other value',
 * });
 *
 * const something = await app.resolve(ref('something'));
 * // something === 'other value'
 * ```
 * This example shows how to use the [[parent]] to retrieve the value of a sibling node.
 *
 *
 * @example **Retrieve a sibling from a computed node**
 * ```js
 * import muster, { computed, get, parent, ref } from '@dws/muster';
 *
 * const app = muster({
 *   something: computed([], () =>
 *     get(parent(), 'other'),
 *   ),
 *   other: 'other value',
 * });
 *
 * const something = await app.resolve(ref('something'));
 * // something === 'other value'
 * ```
 * This example shows that the [[parent]] can be used within a [[computed]].
 */
export function parent(): ParentNodeDefinition {
  return INSTANCE;
}

export function isParentNodeDefinition(value: NodeDefinition): value is ParentNodeDefinition {
  return value.type === ParentNodeType;
}
