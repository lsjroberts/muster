import {
  GraphAction,
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
import { getInvalidTypeError } from '../../../utils/get-invalid-type-error';
import * as graphTypes from '../../../utils/graph-types';
import { untilPositiveIntegerValueNode } from '../../../utils/is-positive-integer-value-node';
import { subtract } from '../../arithmetic/subtract';
import { done } from '../../graph/done';
import { error } from '../../graph/error';
import { traverse } from '../../graph/traverse';
import { toValue, value, ValueNode } from '../../graph/value';
import { nodeList } from '../node-list';
import { init, InitOperation } from '../operations/init';
import { result, ResultOperation } from '../operations/result';
import { step, StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import withReducerState from '../utils/with-reducer-state';

/**
 * An instance of the [[slice]] node.
 * See the [[slice]] documentation to find out more.
 */
export interface SliceNode extends StatelessGraphNode<'slice', SliceNodeProperties> {}

/**
 * A definition of the [[slice]] node.
 * See the [[slice]] documentation to find out more.
 */
export interface SliceNodeDefinition
  extends StatelessNodeDefinition<'slice', SliceNodeProperties> {}

export interface SliceNodeProperties {
  offset: NodeDefinition;
  length: NodeDefinition;
}

/**
 * The implementation of the [[slice]] node.
 * See the [[slice]] documentation to learn more.
 */
export const SliceNodeType: StatelessNodeType<'slice', SliceNodeProperties> = createNodeType(
  'slice',
  {
    shape: {
      offset: graphTypes.nodeDefinition,
      length: graphTypes.nodeDefinition,
    },
    operations: {
      transformItems: {
        getDependencies({ offset, length }: SliceNodeProperties): Array<NodeDependency> {
          return [
            {
              target: offset,
              until: untilPositiveIntegerOffset,
            },
            {
              target: length,
              until: untilPositiveIntegerLength,
            },
          ];
        },
        run(
          node: SliceNode,
          operation: TransformItemsOperation,
          [offset, length]: [ValueNode<number>, ValueNode<number>],
        ): NodeDefinition {
          const { items } = operation.properties;
          const { value: offsetValue } = offset.definition.properties;
          const { value: lengthValue } = length.definition.properties;
          return nodeList(items.slice(offsetValue, offsetValue + lengthValue));
        },
      },
      init: {
        run(node: SliceNode, operation: InitOperation): NodeDefinition {
          const { next } = operation.properties;
          if (!next) {
            return error('Slice reducer cannot be used as a base reducer');
          }
          return withReducerState(0, traverse(next, init()));
        },
      },
      step: {
        getDependencies({ offset, length }: SliceNodeProperties): Array<NodeDependency> {
          return [
            {
              target: offset,
              until: untilPositiveIntegerOffset,
            },
            {
              target: length,
              until: untilPositiveIntegerLength,
            },
          ];
        },
        run(
          node: SliceNode,
          operation: StepOperation<[any, number]>,
          [offset, length]: [ValueNode<number>, ValueNode<number>],
        ): NodeDefinition {
          const { acc, item, next } = operation.properties;
          if (!next) {
            return error('Slice reducer cannot be used as a base reducer');
          }
          const [items, currentIndex] = acc;
          const firstIndex = offset.definition.properties.value;
          const lastIndex = firstIndex + length.definition.properties.value - 1;
          if (currentIndex < firstIndex) {
            return withReducerState(currentIndex + 1, value(items));
          }
          if (currentIndex > lastIndex) {
            return done(withReducerState(currentIndex + 1, value(items)));
          }
          const nextValue = withReducerState(currentIndex + 1, traverse(next, step(items, item)));
          return currentIndex === lastIndex ? done(nextValue) : nextValue;
        },
      },
      result: {
        run(
          node: SliceNode,
          operation: ResultOperation<[any, number]>,
        ): NodeDefinition | GraphAction {
          const { acc, next } = operation.properties;
          if (!next) {
            return error('Slice reducer cannot be used as a base reducer');
          }
          const [items] = acc;
          return createGraphAction(next, result(items));
        },
      },
    },
  },
);

const untilPositiveIntegerLength = untilPositiveIntegerValueNode(SliceNodeType, 'length');
const untilPositiveIntegerOffset = untilPositiveIntegerValueNode(SliceNodeType, 'offset');

export type RelativeSliceBounds = {
  offset: NodeDefinition | NodeLike;
  length: NodeDefinition | NodeLike;
};
export function isRelativeSliceBounds(value: any): value is RelativeSliceBounds {
  return Boolean(value && typeof value === 'object' && 'offset' in value && 'length' in value);
}

export type InclusiveSliceBounds = {
  from: NodeDefinition | NodeLike;
  to: NodeDefinition | NodeLike;
};
export function isInclusiveSliceBounds(value: any): value is InclusiveSliceBounds {
  return Boolean(value && typeof value === 'object' && 'from' in value && 'to' in value);
}

export type ExclusiveSliceBounds = {
  begin: NodeDefinition | NodeLike;
  end: NodeDefinition | NodeLike;
};
export function isExclusiveSliceBounds(value: any): value is ExclusiveSliceBounds {
  return Boolean(value && typeof value === 'object' && 'begin' in value && 'end' in value);
}

/**
 * Creates a new instance of a [[slice]] node, which is a type of collection transform used when limiting
 * the number of items returned from a collection.
 * It lets you skip a number of items from the start and define the number of items to return.
 * One use case for this node is returning paginated items.
 * It behaves in a similar way to the JavaScript's `Array.slice()` method.
 *
 * The [[slice]] allows for three forms of specifying the range:
 * - `slice({ offset: number, length: number })`
 * - `slice({ from: number, to: number })`
 * - `slice({ begin: number, end: number })`
 *
 *
 * @example **Simple range selection**
 * ```js
 * import muster, { entries, key, query, ref, slice, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const firstTwoNumbers = await app.resolve(query(ref('numbers'), withTransforms([
 *   slice({ offset: 0, length: 2 }),
 * ], entries())));
 * // firstTwoNumbers = [1, 2]
 *
 * const otherTwoNumbers = await app.resolve(query(ref('numbers'), withTransforms([
 *   slice({ offset: 2, length: 2 }),
 * ], entries())));
 * // otherTwoNumbers = [3, 4]
 * ```
 * This example shows how to take two items out of a collection with the help of a
 * [[slice]].
 *
 *
 * @example **Paginated collection**
 * ```ts
 * import muster, {
 *   applyTransforms,
 *   entries,
 *   key,
 *   multiply,
 *   query,
 *   ref,
 *   set,
 *   slice,
 *   variable,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   pageSize: 2,
 *   pageIndex: variable(0),
 *   pageOffset: multiply(ref('pageIndex'), ref('pageSize')),
 *   numbers: applyTransforms(
 *     [1, 2, 3, 4, 5, 6],
 *     [slice({ offset: ref('pageOffset'), length: ref('pageSize') })]
 *   ),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((items: any) => {
 *   console.log(items);
 * });
 *
 * console.log('Changing page index to 1');
 * await app.resolve(set('pageIndex', 1));
 *
 * // Console output:
 * // [1, 2]
 * // Changing page index to 1
 * // [3, 4]
 * ```
 * This example shows how to implement the simple pagination of a local collection.
 */
export function slice(
  range: RelativeSliceBounds | InclusiveSliceBounds | ExclusiveSliceBounds,
): SliceNodeDefinition {
  if (isRelativeSliceBounds(range)) {
    return createNodeDefinition(SliceNodeType, {
      offset: toValue(range.offset),
      length: toValue(range.length),
    } as SliceNodeProperties);
  }
  if (isInclusiveSliceBounds(range)) {
    return createNodeDefinition(SliceNodeType, {
      offset: toValue(range.from),
      length: subtract(toValue(range.to), toValue(range.from), value(-1)),
    } as SliceNodeProperties);
  }
  if (isExclusiveSliceBounds(range)) {
    return createNodeDefinition(SliceNodeType, {
      offset: toValue(range.begin),
      length: subtract(toValue(range.end), toValue(range.begin)),
    } as SliceNodeProperties);
  }
  throw getInvalidTypeError('Invalid slice range', {
    expected: [
      '{offset: value(), length: value()}',
      '{from: value(), to: value()}',
      '{begin: value(), end: value()}',
    ],
    received: range,
  });
}
