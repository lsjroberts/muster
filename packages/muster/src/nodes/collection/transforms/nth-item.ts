import {
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import * as graphTypes from '../../../utils/graph-types';
import { untilPositiveIntegerValueNode } from '../../../utils/is-positive-integer-value-node';
import { done } from '../../graph/done';
import { value, ValueNode } from '../../graph/value';
import { nodeList } from '../node-list';
import { ResultOperation } from '../operations/result';
import { StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import { transduce } from '../transduce';

/**
 * An instance of the [[nthItem]] node.
 * See the [[nthItem]] documentation to find out more.
 */
export interface NthItemNode extends StatelessGraphNode<'nthItem', NthItemNodeProperties> {}

/**
 * A definition of the [[nthItem]] node.
 * See the [[nthItem]] documentation to find out more.
 */
export interface NthItemNodeDefinition
  extends StatelessNodeDefinition<'nthItem', NthItemNodeProperties> {}

export interface NthItemNodeProperties {
  index: NodeDefinition;
}

/**
 * The implementation of the [[nthItem]] node.
 * See the [[nthItem]] documentation to learn more.
 */
export const NthItemNodeType: StatelessNodeType<'nthItem', NthItemNodeProperties> = createNodeType(
  'nthItem',
  {
    shape: {
      index: graphTypes.nodeDefinition,
    },
    operations: {
      transformItems: {
        getDependencies({ index }: NthItemNodeProperties): Array<NodeDependency> {
          return [
            {
              target: index,
              until: untilIsPositiveIntegerValueNode,
            },
          ];
        },
        run(
          node: NthItemNode,
          operation: TransformItemsOperation,
          [index]: [ValueNode<number>],
        ): NodeDefinition {
          const { value: indexValue } = index.definition.properties;
          return nodeList(operation.properties.items.slice(indexValue, indexValue + 1));
        },
      },
      init: {
        run(node: NthItemNode): NodeDefinition {
          return value(0);
        },
      },
      step: {
        getDependencies({ index }: NthItemNodeProperties): Array<NodeDependency> {
          return [
            {
              target: index,
              until: untilIsPositiveIntegerValueNode,
            },
          ];
        },
        run(
          node: NthItemNode,
          operation: StepOperation<number>,
          [target]: [ValueNode<number>],
        ): NodeDefinition {
          const { acc, item } = operation.properties;
          const { value: targetIndex } = target.definition.properties;
          const currentIndex = acc;
          if (currentIndex === targetIndex) {
            return done(value(item));
          }
          return value(currentIndex + 1);
        },
      },
      result: {
        run(node: NthItemNode, operation: ResultOperation<number | GraphNode>): NodeDefinition {
          const { acc, next } = operation.properties;
          const finalValue = nodeList(isGraphNode(acc) ? [acc] : []);
          return next ? value(transduce(finalValue, [next])) : value(finalValue);
        },
      },
    },
  },
);

const untilIsPositiveIntegerValueNode = untilPositiveIntegerValueNode(NthItemNodeType, 'index');

/**
 * Creates a new instance of a [[nthItem]] node, which is a type of collection transform used to take a specific item out of a collection.
 * The items are zero-index based so in order to take the first item you have to call `nthItem(0)`,
 * second item is `nthItem(1)` and so on.
 * As with most nodes, a value will be implicitly mapped to a value node if it isn't
 * a [[NodeDefinition]] already. This means the index can be a reference to another node in the graph.
 * It also comes with a shorthand version to be used in the [ref](_utils_ref_.html#ref). See the **References to
 * items in collections** example from the [ref](_utils_ref_.html#ref) documentation.
 *
 *
 * @example **Take third item (using transform)**
 * ```js
 * import muster, { entries, query, ref, nthItem, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const thirdItem = await app.resolve(query(ref('numbers'), withTransforms([
 *   nthItem(2),
 * ], entries())));
 * // thirdItem === [3]
 * ```
 * This example shows how to use a [[nthItem]] transform to take the third item out of a
 * collection.
 */
export function nthItem(index: NodeDefinition | NodeLike): NthItemNodeDefinition {
  return createNodeDefinition(NthItemNodeType, {
    index: isNodeDefinition(index) ? index : value(index),
  });
}
