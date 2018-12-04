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
 * An instance of the [[skip]] node.
 * See the [[skip]] documentation to find out more.
 */
export interface SkipNode extends StatelessGraphNode<'skip', SkipNodeProperties> {}

/**
 * A definition of the [[skip]] node.
 * See the [[skip]] documentation to find out more.
 */
export interface SkipNodeDefinition extends StatelessNodeDefinition<'skip', SkipNodeProperties> {}

export interface SkipNodeProperties {
  offset: NodeDefinition;
}

/**
 * An implementation of the [[skip]] node.
 * See the [[skip]] documentation to find out more.
 */
export const SkipNodeType: StatelessNodeType<'skip', SkipNodeProperties> = createNodeType('skip', {
  shape: {
    offset: graphTypes.nodeDefinition,
  },
  operations: {
    transformItems: {
      getDependencies({ offset }: SkipNodeProperties): Array<NodeDependency> {
        return [
          {
            target: offset,
            until: untilPositiveIntegerOffset,
          },
        ];
      },
      run(
        node: SkipNode,
        operation: TransformItemsOperation,
        [offset]: [ValueNode<number>],
      ): NodeDefinition {
        const { value: offsetValue } = offset.definition.properties;
        return nodeList(operation.properties.items.slice(offsetValue));
      },
    },
    init: {
      run(node: SkipNode, operation: InitOperation): NodeDefinition {
        const { next } = operation.properties;
        if (!next) {
          return error('Skip reducer cannot be used as a base reducer');
        }
        return withReducerState(0, traverse(next, init()));
      },
    },
    step: {
      getDependencies({ offset }: SkipNodeProperties): Array<NodeDependency> {
        return [
          {
            target: offset,
            until: untilPositiveIntegerOffset,
          },
        ];
      },
      run(
        node: SkipNode,
        operation: StepOperation<[any, number]>,
        [offset]: [ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        const { acc, item, next } = operation.properties;
        if (!next) {
          return error('Skip reducer cannot be used as a base reducer');
        }
        const [items, currentIndex] = acc;
        const { value: firstIndex } = offset.definition.properties;
        if (currentIndex < firstIndex) {
          return withReducerState(currentIndex + 1, value(items));
        }
        return withReducerState(currentIndex, traverse(next, step(items, item)));
      },
    },
    result: {
      run(node: SkipNode, operation: ResultOperation<[any, number]>): NodeDefinition | GraphAction {
        const { acc, next } = operation.properties;
        if (!next) {
          return error('Skip reducer cannot be used as a base reducer');
        }
        const [items] = acc;
        return createGraphAction(next, result(items));
      },
    },
  },
});

const untilPositiveIntegerOffset = untilPositiveIntegerValueNode(SkipNodeType, 'offset');

/**
 * Creates a new instance of the [[skip]] node, which is a collection transform used to bypass a specified number of
 * elements in a collection and then returns the remaining elements.
 *

 * @example **Skip 3 items**
 * ```js
 * import muster, { applyTransforms, entries, query, ref, skip } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: applyTransforms(
 *     [1, 2, 3, 4, 5],
 *     [skip(3)],
 *  ),
 * });
 *
 * await app.resolve(query(ref('numbers'), entries())); // === [4, 5]
 * ```
 * This example shows how to skip 3 items from the collection.
 *
 * @example **Skip a number of items defined by a variable**
 * ```js
 * import muster, { applyTransforms, entries, query, ref, skip, variable  } from '@dws/muster';
 *
 * const app = muster({
 *   skipCount: variable(4),
 *   numbers: applyTransforms(
 *     [1, 2, 3, 4, 5],
 *     [skip(ref('skipCount'))],
 *   ),
 * });
 *
 * await app.resolve(query(ref('numbers'), entries())); // === [5]
 * ```
 * This example shows that the `offset` can also be defined as a ref to another node in the graph. One thing to remember
 * is that the offset node must resolve to a [[value]] node containing a positive integer value. An error will be returned
 * when the condition is not met.
 */
export function skip(offset: NodeDefinition | NodeLike): SkipNodeDefinition {
  return createNodeDefinition(SkipNodeType, {
    offset: isNodeDefinition(offset) ? offset : value(offset),
  });
}
