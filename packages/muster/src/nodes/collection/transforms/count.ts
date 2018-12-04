import {
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import withScopeFrom from '../../../utils/with-scope-from';
import { value } from '../../graph/value';
import { array } from '../array';
import { nodeList } from '../node-list';
import { ResultOperation } from '../operations/result';
import { StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import { transduce } from '../transduce';

/**
 * An instance of the [[count]] node.
 * See the [[count]] documentation to find out more.
 */
export interface CountNode extends StatelessGraphNode<'count', CountNodeProperties> {}

/**
 * A definition of the [[count]] node.
 * See the [[count]] documentation to find out more.
 */
export interface CountNodeDefinition
  extends StatelessNodeDefinition<'count', CountNodeProperties> {}

export interface CountNodeProperties {}

/**
 * The implementation of the [[count]] node.
 * See the [[count]] documentation for more information.
 */
export const CountNodeType: StatelessNodeType<'count', CountNodeProperties> = createNodeType(
  'count',
  {
    operations: {
      transformItems: {
        run(node: CountNode, operation: TransformItemsOperation): NodeDefinition {
          return nodeList([withScopeFrom(node, value(operation.properties.items.length))]);
        },
      },
      init: {
        run(node: CountNode): NodeDefinition {
          const initialState = 0;
          return value(initialState);
        },
      },
      step: {
        run(node: CountNode, operation: StepOperation<number>): NodeDefinition {
          return value(operation.properties.acc + 1);
        },
      },
      result: {
        run(node: CountNode, operation: ResultOperation<number>): NodeDefinition {
          const { acc, next } = operation.properties;
          const finalValue = array([value(acc)]);
          return next ? value(transduce(finalValue, [next])) : value(finalValue);
        },
      },
    },
  },
);

const INSTANCE = createNodeDefinition(CountNodeType, {});

/**
 * Creates a new instance of a [[count]] node, which is a type of [[count]] transform. It is used when counting items in a collection.
 * Applying this transform resolves the collection into a collection with a single [[count]] which contains the original items count.
 *
 * The count transform is useful if you need to refer to the current number of items from within a
 * chain of collection transformations. If the result does not need to be passed on to another
 * transform, it is usually easier to use the [[length]] helper within a [ref](_utils_ref_.html#ref) path.
 *
 * @example **Basic use of the count transform**
 * ```js
 * import muster, { applyTransforms, count, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: applyTransforms(
 *     [1, 2, 3, 4],
 *     [count()],
 *   ),
 * });
 *
 * const numbersCount = await app.resolve(query(ref('numbers'), entries()));
 * // numbersCounts === [4]
 * ```
 * This example shows the basic use case for the [[count]] node. It counts the number of items
 * present in the collection and returns a collection with one item containing the count.
 *
 *
 * @example **Applying count in a query**
 * ```js
 * import muster, { count, entries, query, ref, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4],
 * });
 *
 * const numbersCount = await app.resolve(
 *   query(ref('numbers'), withTransforms([count()], entries()))
 * );
 * // numbersCount === [4]
 * ```
 * Just like any transform, the [[count]] transform can be applied from within a
 * [[query]].
 *
 * @example **Counting items using a ref**
 * ```js
 * import muster, { length, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4],
 * });
 *
 * const numbersCount = await app.resolve(ref('numbers', length()));
 * // numbersCount === 4
 * ```
 * The [[count]] node comes with a handy utility ([[length]]) you can use as a part of a [ref](_utils_ref_.html#ref)
 * path. See the [ref](_utils_ref_.html#ref) documentation to learn more about [[length]] and other path
 * utilities.
 */
export function count(): CountNodeDefinition {
  return INSTANCE;
}
