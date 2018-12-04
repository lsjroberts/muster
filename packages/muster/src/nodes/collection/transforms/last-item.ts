import {
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import { value } from '../../graph/value';
import { nodeList } from '../node-list';
import { ResultOperation } from '../operations/result';
import { StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import { transduce } from '../transduce';

/**
 * An instance of the [[lastItem]] node.
 * See the [[lastItem]] documentation to find out more.
 */
export interface LastItemNode extends StatelessGraphNode<'lastItem', LastItemNodeProperties> {}

/**
 * A definition of the [[lastItem]] node.
 * See the [[lastItem]] documentation to find out more.
 */
export interface LastItemNodeDefinition
  extends StatelessNodeDefinition<'lastItem', LastItemNodeProperties> {}

export interface LastItemNodeProperties {}

/**
 * The implementation of the [[lastItem]] node.
 * See the [[lastItem]] documentation to learn more.
 */
export const LastItemNodeType: StatelessNodeType<
  'lastItem',
  LastItemNodeProperties
> = createNodeType('lastItem', {
  operations: {
    transformItems: {
      run(node: LastItemNode, operation: TransformItemsOperation): NodeDefinition {
        return nodeList(operation.properties.items.slice(-1));
      },
    },
    init: {
      run(node: LastItemNode): NodeDefinition {
        return value(undefined);
      },
    },
    step: {
      run(node: LastItemNode, operation: StepOperation<any>): NodeDefinition {
        return value(operation.properties.item);
      },
    },
    result: {
      run(node: LastItemNode, operation: ResultOperation<any>): NodeDefinition {
        const { acc, next } = operation.properties;
        const finalValue = nodeList(acc ? [acc] : []);
        return next ? value(transduce(finalValue, [next])) : value(finalValue);
      },
    },
  },
});

const INSTANCE = createNodeDefinition(LastItemNodeType, {});

/**
 * Creates a new instance of a [[lastItem]] node, which is a type of collection transform used when taking
 * the last item out of a collection.
 * It also comes with a shorthand version to be used in the [ref](_utils_ref_.html#ref). See the **References to
 * items in collections** example from the [ref](_utils_ref_.html#ref) documentation.
 *
 *
 * @example **Take last item (using transform)**
 * ```js
 * import muster, { entries, query, ref, lastItem, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const item = await app.resolve(query(ref('numbers'), withTransforms([
 *   lastItem(),
 * ], entries())));
 * // item === [5]
 * ```
 * This example shows how to use the [[lastItem]] transform to take the last item out of a
 * collection.
 */
export function lastItem(): LastItemNodeDefinition {
  return INSTANCE;
}
