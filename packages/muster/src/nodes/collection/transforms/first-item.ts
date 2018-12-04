import {
  GraphAction,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createGraphAction from '../../../utils/create-graph-action';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import { done } from '../../graph/done';
import { traverse } from '../../graph/traverse';
import { value } from '../../graph/value';
import { nodeList } from '../node-list';
import { init, InitOperation } from '../operations/init';
import { result, ResultOperation } from '../operations/result';
import { step, StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';

/**
 * An instance of the [[firstItem]] node.
 * See the [[firstItem]] documentation to find out more.
 */
export interface FirstItemNode extends StatelessGraphNode<'firstItem', FirstItemNodeProperties> {}

/**
 * A definition of the [[firstItem]] node.
 * See the [[firstItem]] documentation to find out more.
 */
export interface FirstItemNodeDefinition
  extends StatelessNodeDefinition<'firstItem', FirstItemNodeProperties> {}

export interface FirstItemNodeProperties {}

/**
 * The implementation of the [[firstItem]] node.
 * See the [[firstItem]] documentation to learn more.
 */
export const FirstItemNodeType: StatelessNodeType<
  'firstItem',
  FirstItemNodeProperties
> = createNodeType('firstItem', {
  operations: {
    transformItems: {
      run(node: FirstItemNode, operation: TransformItemsOperation): NodeDefinition {
        return nodeList(operation.properties.items.slice(0, 1));
      },
    },
    init: {
      run(node: FirstItemNode, operation: InitOperation): NodeDefinition | GraphAction {
        const { next } = operation.properties;
        return next ? createGraphAction(next, init()) : value(undefined);
      },
    },
    step: {
      run(node: FirstItemNode, operation: StepOperation<any>): NodeDefinition {
        const { acc, item, next } = operation.properties;
        return done(next ? traverse(next, step(acc, item)) : value(item));
      },
    },
    result: {
      run(node: FirstItemNode, operation: ResultOperation<any>): NodeDefinition | GraphAction {
        const { acc, next } = operation.properties;
        return next ? createGraphAction(next, result(acc)) : value(nodeList(acc ? [acc] : []));
      },
    },
  },
});

const INSTANCE = createNodeDefinition(FirstItemNodeType, {});

/**
 * Creates a new instance of a [[firstItem]] node, which is a type of collection transform used
 * when taking the first item out of a collection.
 * This node serves as a fast implementation of the `take(1)`. It also comes with a shorthand
 * version to be used in the [ref](_utils_ref_.html#ref). See the **References to items in collections** example
 * from the [ref](_utils_ref_.html#ref) documentation.
 *
 *
 * @example **Take first item (using transform)**
 * ```js
 * import muster, { entries, firstItem, query, ref, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const item = await app.resolve(query(ref('numbers'), withTransforms([
 *   firstItem(),
 * ], entries())));
 * // item === [1]
 * ```
 * This example shows how to use a [[firstItem]] transform to take the first item out of a
 * collection.
 */
export function firstItem(): FirstItemNodeDefinition {
  return INSTANCE;
}
