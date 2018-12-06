import {
  GraphAction,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createGraphAction from '../../../utils/create-graph-action';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import * as graphTypes from '../../../utils/graph-types';
import { untilPositiveIntegerValueNode } from '../../../utils/is-positive-integer-value-node';
import { done } from '../../graph/done';
import { error } from '../../graph/error';
import { traverse } from '../../graph/traverse';
import { value, ValueNode } from '../../graph/value';
import { nodeList } from '../node-list';
import { init, InitOperation } from '../operations/init';
import { result, ResultOperation } from '../operations/result';
import { step, StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import withReducerState from '../utils/with-reducer-state';

/**
 * An instance of the [[take]] node.
 * See the [[take]] documentation to find out more.
 */
export interface TakeNode extends StatelessGraphNode<'take', TakeNodeProperties> {}

/**
 * A definition of the [[take]] node.
 * See the [[take]] documentation to find out more.
 */
export interface TakeNodeDefinition extends StatelessNodeDefinition<'take', TakeNodeProperties> {}

export interface TakeNodeProperties {
  numItems: NodeDefinition;
}

/**
 * The implementation of the [[take]] node.
 * See the [[take]] documentation to learn more.
 */
export const TakeNodeType: StatelessNodeType<'take', TakeNodeProperties> = createNodeType('take', {
  shape: {
    numItems: graphTypes.nodeDefinition,
  },
  operations: {
    transformItems: {
      getDependencies({ numItems }: TakeNodeProperties): Array<NodeDependency> {
        return [
          {
            target: numItems,
            until: untilPositiveNumItemsNode,
          },
        ];
      },
      run(
        node: TakeNode,
        operation: TransformItemsOperation,
        [numItems]: [ValueNode<number>],
      ): NodeDefinition {
        const { value: numItemsValue } = numItems.definition.properties;
        return nodeList(operation.properties.items.slice(0, numItemsValue));
      },
    },
    init: {
      run(node: TakeNode, operation: InitOperation): NodeDefinition {
        const { next } = operation.properties;
        if (!next) {
          return error('Take reducer cannot be used as a base reducer');
        }
        return withReducerState(0, traverse(next, init()));
      },
    },
    step: {
      getDependencies({ numItems }: TakeNodeProperties): Array<NodeDependency> {
        return [
          {
            target: numItems,
            until: untilPositiveNumItemsNode,
          },
        ];
      },
      run(
        node: TakeNode,
        operation: StepOperation<[any, number]>,
        [numItems]: [ValueNode<number>],
      ): NodeDefinition {
        const { acc, item, next } = operation.properties;
        if (!next) {
          return error('Take reducer cannot be used as a base reducer');
        }
        const [items, currentIndex] = acc;
        const lastIndex = numItems.definition.properties.value - 1;
        if (currentIndex > lastIndex) {
          return done(value(acc));
        }
        const nextValue = withReducerState(currentIndex + 1, traverse(next, step(items, item)));
        return currentIndex === lastIndex ? done(nextValue) : nextValue;
      },
    },
    result: {
      run(node: TakeNode, operation: ResultOperation<[any, number]>): NodeDefinition | GraphAction {
        const { acc, next } = operation.properties;
        if (!next) {
          return error('Take reducer cannot be used as a base reducer');
        }
        const [items] = acc;
        return createGraphAction(next, result(items));
      },
    },
  },
});

const untilPositiveNumItemsNode = untilPositiveIntegerValueNode(TakeNodeType, 'numItems');

/**
 * Creates a new instance of a [[take]] node, which is a type of collection transform used when limiting
 * the number of items returned from a collection.
 * It works in a similar way to the [[slice]], but it cannot change the offset.
 *
 *
 * @example **Take first item**
 * ```js
 * import muster, { entries, query, ref, take, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const firstNumber = await app.resolve(query(ref('numbers'), withTransforms([
 *   take(1),
 * ], entries())));
 * // firstNumber === [1]
 * ```
 * This example shows how to use the [[take]] to extract the first item of a collection. The
 * count doesn't have to be a constant. In this particular example, the value is being
 * converted internally to a [value](_nodes_graph_value_.html#value) node.
 * This means you can use any other node as the count.
 *
 *
 * @example **Configurable count**
 * ```js
 * import muster, { entries, query, ref, set, take, variable, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 *   numbersToTake: variable(1),
 * });
 *
 * app.resolve(query(ref('numbers'), withTransforms([
 *   take(ref('numbersToTake')),
 * ], entries()))).subscribe((numbers) => {
 *   console.log(numbers);
 * });
 *
 * console.log('Change numbersToTake to 3');
 * await app.resolve(set('numbersToTake', 3));
 *
 * // Console output:
 * // [1]
 * // Change numbersToTake to 3
 * // [1, 2, 3]
 * ```
 * This example shows how to use a [[variable]] node to define the number of items to take.
 */
export function take(numItems: NodeDefinition | NodeLike): TakeNodeDefinition {
  return createNodeDefinition(TakeNodeType, {
    numItems: isNodeDefinition(numItems) ? numItems : value(numItems),
  });
}
