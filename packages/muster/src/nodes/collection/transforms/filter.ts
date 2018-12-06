import zip from 'lodash/zip';
import {
  GraphAction,
  GraphNode,
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
import { untilValueNode } from '../../../utils/is-value-node';
import { apply } from '../../graph/apply';
import { error } from '../../graph/error';
import { fn } from '../../graph/fn';
import { toValue, value, ValueNode } from '../../graph/value';
import { nodeList } from '../node-list';
import { init, InitOperation } from '../operations/init';
import { result, ResultOperation } from '../operations/result';
import { step, StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';

/**
 * An instance of the [[filter]] node.
 * See the [[filter]] documentation to find out more.
 */
export interface FilterNode extends StatelessGraphNode<'filter', FilterNodeProperties> {}

/**
 * A definition of the [[filter]] node.
 * See the [[filter]] documentation to find out more.
 */
export interface FilterNodeDefinition
  extends StatelessNodeDefinition<'filter', FilterNodeProperties> {}

export interface FilterNodeProperties {
  predicate: NodeDefinition;
}

/**
 * The implementation of the [[filter]] node.
 * See the [[filter]] documentation to learn more.
 */
export const FilterNodeType: StatelessNodeType<'filter', FilterNodeProperties> = createNodeType(
  'filter',
  {
    shape: {
      predicate: graphTypes.nodeDefinition,
    },
    operations: {
      transformItems: {
        getDependencies(
          { predicate }: FilterNodeProperties,
          operation: TransformItemsOperation,
        ): Array<NodeDependency> {
          return operation.properties.items.map((item) => ({
            target: apply([item], predicate),
            until: untilIsValueNode,
          }));
        },
        run(
          node: FilterNode,
          operation: TransformItemsOperation,
          filterResults: Array<ValueNode<any>>,
        ): NodeDefinition {
          const { items } = operation.properties;
          const filterValues = filterResults.map((result) => result.definition.properties.value);
          return nodeList(
            (zip<GraphNode | ValueNode<any>>(items, filterValues) as Array<
              [GraphNode, ValueNode<any>]
            >)
              .filter(([item, filterValue]) => Boolean(filterValue))
              .map(([item]) => item),
          );
        },
      },
      init: {
        run(node: FilterNode, operation: InitOperation): NodeDefinition | GraphAction {
          const { next } = operation.properties;
          if (!next) {
            return error('Filter reducer cannot be used as a base reducer');
          }
          return createGraphAction(next, init());
        },
      },
      step: {
        getDependencies(
          { predicate }: FilterNodeProperties,
          operation: StepOperation<any>,
        ): [NodeDependency] {
          return [
            {
              target: apply([operation.properties.item], predicate),
              until: untilIsValueNode,
            },
          ];
        },
        run(
          node: FilterNode,
          operation: StepOperation<any>,
          [result]: [ValueNode<any>],
        ): NodeDefinition | GraphAction {
          const { acc, item, next } = operation.properties;
          if (!next) {
            return error('Filter reducer cannot be used as a base reducer');
          }
          const { value: resultValue } = result.definition.properties;
          return resultValue ? createGraphAction(next, step(acc, item)) : value(acc);
        },
      },
      result: {
        run(node: FilterNode, operation: ResultOperation<any>): NodeDefinition | GraphAction {
          const { acc, next } = operation.properties;
          if (!next) {
            return error('Filter reducer cannot be used as a base reducer');
          }
          return createGraphAction(next, result(acc));
        },
      },
    },
  },
);

const untilIsValueNode = untilValueNode(FilterNodeType, 'predicate');

/**
 * Creates a new instance of a [[filter]] node, which is a type of collection transform used to filter the items
 * returned from a collection using a given predicate. The predicates are constructed from muster logic nodes.
 * These nodes include:
 * - [[and]]
 * - [[eq]]
 * - [[gt]]
 * - [[ifElse]]
 * - [[lt]]
 * - [[lte]]
 * - [[not]]
 * - [[or]]
 *
 *
 * @example **Simple filters**
 * ```js
 * import muster, { applyTransforms, filter, gt, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: applyTransforms(
 *     [1, 2, 3, 4, 5],
 *     [filter((item) => gt(item, 2))],
 *   ),
 * });
 *
 * const filteredNumbers = await app.resolve(query(ref('numbers'), entries()));
 * // filteredNumbers === [3, 4, 5]
 * ```
 * This example shows how to apply a filter to a collection. The predicate from this example uses a
 * [[gt]] node for filtering items that are greater than 2. See the [[gt]] documentation
 * for more information.
 *
 *
 * @example **Applying filters in a query**
 * ```js
 * import muster, { filter, lt, entries, query, ref, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const filteredNumbers = await app.resolve(query(ref('numbers'), withTransforms([
 *   filter((item) => lt(item, 4)),
 * ], entries())));
 * // filteredNumbers === [1, 2, 3]
 * ```
 * This example shows how to apply a filter to a collection from within a [[query]] node.
 * The filter predicate uses a [[lt]] node to filter the items with a value of less than 4.
 *
 *
 * @example **Filtering based on properties**
 * ```js
 * import muster, { applyTransforms, filter, gt, entries, key, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   books: applyTransforms(
 *     [
 *       { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
 *       { title: 'Live and Let Die', author: 'Ian Fleming', year: 1954 },
 *       { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
 *     ],
 *     [
 *       filter((book) => gt(ref({ root: book, path: 'year' }), 1930)),
 *     ],
 *   ),
 * });
 *
 * const booksAfter1930 = await app.resolve(query(ref('books'), entries({
 *   title: key('title'),
 * })));
 * // booksAfter1930 === [
 * //   { title: 'Casino Royale' },
 * //   { title: 'Live and Let Die' },
 * // ]
 * ```
 * This example shows how to filter items based on a property value. It uses a
 * [ref](_utils_ref_.html#ref) node to change the starting point of the reference, as opposed to
 * using the root of the graph as the staring point (note the assignment `root: book`). Next comes
 * the path to the property to retrieve. In this example, the path is just a string, but you can
 * also provide an array containing a full path to a target property.
 *
 *
 * @example **Complex filters**
 * ```js
 * import muster, { and, applyTransforms, entries, filter, gt, key, lt, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   books: applyTransforms(
 *     [
 *       { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
 *       { title: 'Live and Let Die', author: 'Ian Fleming', year: 1954 },
 *       { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
 *       { title: 'The Martian', author: 'Andy Weir', year: 2011 },
 *     ],
 *     [
 *       filter((book) => and(
 *         gt(ref({ root: book, path: 'year' }), 1930),
 *         lt(ref({ root: book, path: 'year' }), 2000),
 *       )),
 *     ],
 *   ),
 * });
 *
 * const booksBetween1930and2000 = await app.resolve(query(ref('books'), entries({
 *   title: key('title')
 * })));
 * // booksBetween1930and2000 === [
 * //   { title: 'Casino Royale' },
 * //   { title: 'Live and Let Die' },
 * // ]
 * ```
 * This example shows how to create complex queries with an [[and]] node. These nodes can be nested
 * indefinitely.
 *
 *
 * @example **Accessing the graph from filters**
 * ```js
 * import muster, {
 *   and,
 *   applyTransforms,
 *   entries,
 *   filter,
 *   gt,
 *   key,
 *   lt,
 *   query,
 *   ref,
 *   variable,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   minYear: variable(1930),
 *   maxYear: variable(2000),
 *   books: applyTransforms(
 *     [
 *       { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
 *       { title: 'Live and Let Die', author: 'Ian Fleming', year: 1954 },
 *       { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
 *       { title: 'The Martian', author: 'Andy Weir', year: 2011 },
 *     ],
 *     [
 *       filter((book) => and(
 *         gt(ref({ root: book, path: 'year' }), ref('minYear')),
 *         lt(ref({ root: book, path: 'year' }), ref('maxYear')),
 *       )),
 *     ],
 *   ),
 * });
 *
 * const booksBetween1930and2000 = await app.resolve(query(ref('books'), entries({
 *   title: key('title')
 * })));
 * // booksBetween1930and2000 === [
 * //   { title: 'Casino Royale' },
 * //   { title: 'Live and Let Die' },
 * // ]
 * ```
 * This example shows that filters don't have to be static: they can also access data from
 * the muster graph. Building on the previous example, this example replaces the hard-coded min
 * and max release dates with the references to [[variable]]s.
 */
export function filter(
  predicate: (item: NodeDefinition) => NodeDefinition | NodeLike,
): FilterNodeDefinition;
export function filter(predicate: NodeDefinition | NodeLike): FilterNodeDefinition;
export function filter(
  predicate: NodeDefinition | NodeLike | ((item: NodeDefinition) => NodeDefinition | NodeLike),
): FilterNodeDefinition {
  return createNodeDefinition(FilterNodeType, {
    predicate:
      typeof predicate === 'function'
        ? fn((item: NodeDefinition) => toValue(predicate(item)))
        : isNodeDefinition(predicate)
        ? predicate
        : value(predicate),
  });
}
