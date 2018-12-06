import uniqBy from 'lodash/uniqBy';
import {
  GraphAction,
  GraphNode,
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
import { getInvalidTypeErrorMessage } from '../../../utils/get-invalid-type-error';
import * as graphTypes from '../../../utils/graph-types';
import { valueOf } from '../../../utils/value-of';
import { apply } from '../../graph/apply';
import { error } from '../../graph/error';
import { fn } from '../../graph/fn';
import { identity } from '../../graph/identity';
import { resolve } from '../../graph/resolve';
import { toValue, value, ValueNode, ValueNodeType } from '../../graph/value';
import { nodeList } from '../node-list';
import { init, InitOperation } from '../operations/init';
import { ResultOperation } from '../operations/result';
import { StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import { transduce } from '../transduce';

/**
 * An instance of the [[unique]] node.
 * See the [[unique]] documentation to find out more.
 */
export interface UniqueNode extends StatelessGraphNode<'unique', UniqueNodeProperties> {}

/**
 * A definition of the [[unique]] node.
 * See the [[unique]] documentation to find out more.
 */
export interface UniqueNodeDefinition
  extends StatelessNodeDefinition<'unique', UniqueNodeProperties> {}

/**
 * The implementation of the [[unique]] node.
 * See the [[unique]] documentation to learn more.
 */
export interface UniqueNodeProperties {
  predicate: NodeDefinition;
}

/**
 * The implementation of the [[unique]] node.
 * See the [[unique]] documentation to learn more.
 */
export const UniqueNodeType: StatelessNodeType<'unique', UniqueNodeProperties> = createNodeType(
  'unique',
  {
    shape: {
      predicate: graphTypes.nodeDefinition,
    },
    operations: {
      transformItems: {
        getDependencies(
          { predicate }: UniqueNodeProperties,
          operation: TransformItemsOperation,
        ): Array<NodeDependency> {
          return operation.properties.items.map((item) => ({
            target: apply([item], predicate),
            until: untilIsValueNode,
          }));
        },
        run(
          node: UniqueNode,
          operation: TransformItemsOperation,
          uniqueResults: Array<ValueNode<any>>,
        ): NodeDefinition {
          const { items } = operation.properties;
          const uniqueValues = uniqBy(
            uniqueResults.map((item, index) => [index, item] as [number, ValueNode<any>]),
            ([index, item]) => valueOf(item),
          );
          return nodeList(uniqueValues.map(([index]) => items[index]));
        },
      },
      init: {
        run(node: UniqueNode, operation: InitOperation): NodeDefinition | GraphAction {
          const { next } = operation.properties;
          if (!next) {
            return error('Unique reducer cannot be used as a base reducer');
          }
          return createGraphAction(next, init());
        },
      },
      step: {
        run(node: UniqueNode, operation: StepOperation<Array<GraphNode>>): NodeDefinition {
          const { acc, item } = operation.properties;
          return value([...acc, item]);
        },
      },
      result: {
        run(node: UniqueNode, operation: ResultOperation<any>): NodeDefinition | GraphAction {
          const { acc, next } = operation.properties;
          if (!next) {
            return error('Unique reducer cannot be used as a base reducer');
          }
          const uniqueItems = resolve(
            acc.map((item: GraphNode) => ({
              target: apply([item], node.definition.properties.predicate),
              until: untilIsValueNode,
            })),
            (predicateResults: Array<ValueNode<any>>) => {
              const uniqueValues = uniqBy(
                predicateResults.map((item, index) => [index, item] as [number, ValueNode<any>]),
                ([index, item]) => valueOf(item),
              );
              return nodeList(uniqueValues.map(([index]) => acc[index]));
            },
          );
          return value(transduce(uniqueItems, [next]));
        },
      },
    },
  },
);

/**
 * Creates a new instance of a [[unique]] node, a collection transform that creates a duplicate-free version of an array (using SameValueZero for equality comparisons) in which only the first occurrence of each element is kept. The order of result values is determined by the order they occur in the array.
 *
 * `unique` accepts an optional predicate used to identify sub-properties of items to use in comparison.
 *
 *
 * @example **Simple usage**
 * ```js
 * import muster, { applyTransforms, unique, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: applyTransforms(
 *     [1, 2, 3, 1, 2],
 *     [unique()],
 *   ),
 * });
 *
 * const uniqueNumbers = await app.resolve(query(ref('numbers'), entries()));
 * // uniqueNumbers === [1, 2, 3]
 * ```
 * This example shows how to apply `unique` to a collection.
 *
 * @example **Usage with predicates**
 * ```js
 * import muster, { applyTransforms, unique, get, entries, key, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   books: applyTransforms(
 *     [
 *       { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
 *       { title: 'Live and Let Die', author: 'Ian Fleming', year: 1953 },
 *       { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
 *     ],
 *     [
 *       unique((book) => get(book, 'year')),
 *     ],
 *   ),
 * });
 *
 * const publishingYears = await app.resolve(query(ref('books'), entries({
 *   year: key('year'),
 * })));
 * // publishingYears === [
 * //   { year: 1953 },
 * //   { year: 1927 },
 * // ]
 * ```
 * This example demonstrates how to use a predicate to identify an item property to use for unique comparison.
 *
 */
export function unique(
  predicate?: NodeDefinition | ((item: NodeDefinition) => NodeDefinition | NodeLike),
): UniqueNodeDefinition {
  return createNodeDefinition(UniqueNodeType, {
    predicate: getPredicate(predicate),
  });
}

function getPredicate(
  predicate?: NodeDefinition | ((item: NodeDefinition) => NodeDefinition | NodeLike),
): NodeDefinition {
  if (typeof predicate === 'function') {
    return fn((item: NodeDefinition) => toValue(predicate(item)));
  }
  return predicate || identity();
}

const untilIsValueNode: NodeDependency['until'] = {
  predicate: ValueNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Unique predicate must resolve to a value node', {
      expected: ValueNodeType,
      received: node.definition,
    });
  },
};
