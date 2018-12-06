import chunk from 'lodash/chunk';
import flatMap from 'lodash/flatMap';
import identity from 'lodash/identity';
import zip from 'lodash/zip';
import { CallOperation } from '../../../operations/call';
import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../../utils/get-invalid-type-error';
import * as graphTypes from '../../../utils/graph-types';
import { untilValueNode } from '../../../utils/is-value-node';
import * as types from '../../../utils/types';
import withScopeFrom from '../../../utils/with-scope-from';
import { apply } from '../../graph/apply';
import { error } from '../../graph/error';
import { fn } from '../../graph/fn';
import { resolve } from '../../graph/resolve';
import { toValue, value, ValueNode, ValueNodeType } from '../../graph/value';
import { nodeList } from '../node-list';
import { ResultOperation } from '../operations/result';
import { StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import { transduce } from '../transduce';

export interface SortOrderNode extends StatelessGraphNode<'sortOrder', SortOrderNodeProperties> {}

export interface SortOrderNodeDefinition
  extends StatelessNodeDefinition<'sortOrder', SortOrderNodeProperties> {}

export interface SortOrderNodeProperties {
  iteratee: NodeDefinition;
  descending: boolean;
}

export const SortOrderNodeType: StatelessNodeType<
  'sortOrder',
  SortOrderNodeProperties
> = createNodeType('sortOrder', {
  shape: {
    iteratee: graphTypes.nodeDefinition,
    descending: types.bool,
  },
  operations: {
    call: {
      getDependencies(
        { iteratee }: SortOrderNodeProperties,
        operation: CallOperation,
      ): Array<NodeDependency> {
        return [
          {
            target: apply(operation.properties.args!, iteratee),
            until: untilIsValidSortValue,
          },
        ];
      },
      run(node: SortOrderNode, operation: CallOperation, [result]: [GraphNode]): GraphNode {
        return result;
      },
    },
  },
});

const untilIsValidSortValue: NodeDependency['until'] = {
  predicate: isValidSortValue,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Invalid sort value', {
      expected: [
        'value({ value: boolean })',
        'value({ value: null })',
        'value({ value: number })',
        'value({ value: string })',
        'value({ value: undefined })',
        'value({ value: Date })',
      ],
      received: node.definition,
    });
  },
};

export function sortOrder(
  iteratee: NodeDefinition | ((item: NodeDefinition) => NodeLike),
  options: {
    descending: boolean;
  },
): SortOrderNodeDefinition {
  return createNodeDefinition(SortOrderNodeType, {
    descending: options.descending,
    iteratee: iteratee
      ? typeof iteratee === 'function'
        ? fn((item: NodeDefinition) => toValue(iteratee(item)))
        : iteratee
      : fn((item: NodeDefinition) => item),
  });
}

export function ascending(
  iteratee: NodeDefinition | ((item: NodeDefinition) => NodeLike) = identity,
): SortOrderNodeDefinition {
  return sortOrder(iteratee, { descending: false });
}

export function descending(
  iteratee: NodeDefinition | ((item: NodeDefinition) => NodeLike) = identity,
): SortOrderNodeDefinition {
  return sortOrder(iteratee, { descending: true });
}

/**
 * An instance of the [[sort]] node.
 * See the [[sort]] documentation to find out more.
 */
export interface SortNode extends StatelessGraphNode<'sort', SortNodeProperties> {}

/**
 * A definition of the [[sort]] node.
 * See the [[sort]] documentation to find out more.
 */
export interface SortNodeDefinition extends StatelessNodeDefinition<'sort', SortNodeProperties> {}

export interface SortNodeProperties {
  order: Array<NodeDefinition>;
}

/**
 * The implementation of the [[sort]] node.
 * See the [[sort]] documentation to learn more.
 */
export const SortNodeType: StatelessNodeType<'sort', SortNodeProperties> = createNodeType('sort', {
  shape: {
    order: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    transformItems: {
      getDependencies({ order }: SortNodeProperties): Array<NodeDependency> {
        return order.map((item) => ({
          target: item,
          until: untilIsSortOrderNode,
        }));
      },
      run(
        node: SortNode,
        operation: TransformItemsOperation,
        orderNodes: Array<SortOrderNode>,
      ): NodeDefinition {
        const { items } = operation.properties;
        const descending = orderNodes.map(
          (orderNode) => orderNode.definition.properties.descending,
        );
        return resolve(
          flatMap(items, (item) =>
            orderNodes.map((order) => ({
              target: apply([item], order),
              until: untilIsValidSortValue,
            })),
          ),
          (combinedSortValueNodes: Array<ValueNode<SortValue>>) => {
            const combinedSortValues = combinedSortValueNodes.map(
              (node) => node.definition.properties.value,
            );
            const itemSortValues = chunk(combinedSortValues, orderNodes.length);
            const sortedItems = (zip<GraphNode | Array<SortValue>>(items, itemSortValues) as Array<
              [GraphNode, Array<SortValue>]
            >)
              .sort(([item1, sortValues1], [item2, sortValues2]) =>
                compareSortValues(sortValues1, sortValues2, descending),
              )
              .map(([item]) => item);
            return withScopeFrom(node, nodeList(sortedItems));
          },
        );
      },
    },
    init: {
      run(node: SortNode): NodeDefinition {
        const initialState = [] as Array<GraphNode>;
        return value(initialState);
      },
    },
    step: {
      run(node: SortNode, operation: StepOperation<Array<GraphNode>>): NodeDefinition {
        const { acc, item } = operation.properties;
        return value([...acc, item]);
      },
    },
    result: {
      getDependencies({ order }: SortNodeProperties): Array<NodeDependency> {
        return order.map((iteratee) => ({
          target: iteratee,
          until: untilIsSortOrderNode,
        }));
      },
      run(
        node: SortNode,
        operation: ResultOperation<Array<GraphNode>>,
        orderNodes: Array<SortOrderNode>,
      ): NodeDefinition {
        const { acc, next } = operation.properties;
        if (!next) {
          return error('Sort reducer cannot be used as a base reducer');
        }
        const descending = orderNodes.map(
          (orderNode) => orderNode.definition.properties.descending,
        );
        const sortedItems = resolve(
          flatMap(acc, (item) =>
            orderNodes.map((order) => ({
              target: apply([item], order.definition.properties.iteratee),
              until: untilIsValueNode,
            })),
          ),
          (orderResults: Array<ValueNode<SortValue>>) => {
            const itemsWithSortValues = acc.map(
              (item, itemIndex) =>
                [
                  item,
                  orderNodes.map(
                    (order, orderIndex) =>
                      orderResults[itemIndex * orderNodes.length + orderIndex].definition.properties
                        .value,
                  ),
                ] as [GraphNode, Array<SortValue>],
            );
            const sortedItems = itemsWithSortValues
              .sort(([, sortValues1], [, sortValues2]) => {
                return compareSortValues(sortValues1, sortValues2, descending);
              })
              .map(([item]) => item);
            return withScopeFrom(node, nodeList(sortedItems));
          },
        );
        return value(transduce(sortedItems, [next]));
      },
    },
  },
});

const untilIsSortOrderNode: NodeDependency['until'] = {
  predicate: SortOrderNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Invalid sort order', {
      expected: ['ascending()', 'descending()'],
      received: node.definition,
    });
  },
};

const untilIsValueNode = untilValueNode(SortNodeType, 'predicate');

function compareSortValues(
  values1: Array<SortValue>,
  values2: Array<SortValue>,
  descending: Array<boolean>,
): number {
  return (zip<SortValue>(values1, values2) as Array<[SortValue, SortValue]>).reduce(
    (result, [value1, value2], index) =>
      result !== 0 ? result : compareSortValue(value1, value2, descending[index]),
    0,
  );
}

function compareSortValue(value1: SortValue, value2: SortValue, descending: boolean): number {
  if (descending) {
    return -compareSortValue(value1, value2, false);
  }
  const isFalsy1 = !value1 && typeof value1 !== 'number' && typeof value1 !== 'string';
  const isFalsy2 = !value2 && typeof value2 !== 'number' && typeof value2 !== 'string';
  if (isFalsy1 !== isFalsy2) {
    return isFalsy1 ? -1 : 1;
  }
  if (value1 === value2 || (isFalsy1 && isFalsy2) || typeof value1 !== typeof value2) {
    return 0;
  }
  return (value1 as number | string) < (value2 as number | string) ? -1 : 1;
}

/**
 * Creates a new instance of a [[sort]] node, which is a type of collection transform used to sort the output of a collection.
 * The sort order takes an array of [[sortOrder]]s which define the ordering of the sort.
 * The items of the [[order]] array are assuming a descending order of
 * priority, with the first item having the highest priority and the last one having the lowest.
 *
 * For example, given the following items:
 * <table>
 *   <thead>
 *     <tr>
 *       <th>Make</th>
 *       <th>Model</th>
 *       <th>Year</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td>Mercedes</td>
 *       <td>C 63 AMG</td>
 *       <td>2017</td>
 *     </tr>
 *     <tr>
 *       <td>Mercedes</td>
 *       <td>A</td>
 *       <td>2009</td>
 *     </tr>
 *     <tr>
 *       <td>Audi</td>
 *       <td>R8</td>
 *       <td>2013</td>
 *     </tr>
 *     <tr>
 *       <td>Audi</td>
 *       <td>A4</td>
 *       <td>2018</td>
 *     </tr>
 *     <tr>
 *       <td>Toyota</td>
 *       <td>Corolla</td>
 *       <td>2016</td>
 *     </tr>
 *   </tbody>
 * </table>
 * When the sort order is defined as:
 * <ol>
 *   <li>Sort by `Make` ascending</li>
 *   <li>Sort by `Year` descending</li>
 * </ol>
 * The table should look like:
 * <table>
 *   <thead>
 *     <tr>
 *       <th>Make</th>
 *       <th>Model</th>
 *       <th>Year</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td>Audi</td>
 *       <td>A4</td>
 *       <td>2018</td>
 *     </tr>
 *     <tr>
 *       <td>Audi</td>
 *       <td>R8</td>
 *       <td>2013</td>
 *     </tr>
 *     <tr>
 *       <td>Mercedes</td>
 *       <td>C 63 AMG</td>
 *       <td>2017</td>
 *     </tr>
 *     <tr>
 *       <td>Mercedes</td>
 *       <td>A</td>
 *       <td>2009</td>
 *     </tr>
 *     <tr>
 *       <td>Toyota</td>
 *       <td>Corolla</td>
 *       <td>2016</td>
 *     </tr>
 *   </tbody>
 * </table>
 *
 * Sort order can be defined with the help of two helper functions:
 * - [[ascending]]
 * - [[descending]]
 *
 * @example **Sorting numbers**
 * ```js
 * import muster, {
 *   ascending,
 *   descending,
 *   entries,
 *   query,
 *   ref,
 *   sort,
 *   withTransforms,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [5, 3, 2, 4, 1],
 * });
 *
 * const ascendingNumbers = await app.resolve(query(ref('numbers'), withTransforms([
 *   sort(ascending((item) => item)),
 * ], entries())));
 * // ascendingNumbers === [1, 2, 3, 4, 5]
 *
 * const descendingNumbers = await app.resolve(query(ref('numbers'), withTransforms([
 *   sort(descending((item) => item)),
 * ], entries())));
 * // descendingNumbers === [5, 4, 3, 2, 1]
 * ```
 * This example shows how to apply the most basic sort transform. Although the [[sort]]
 * officially takes an array of sort orders, you can still define a [[sort]] with
 * a single [[sortOrder]].
 *
 * Note that the [[ascending]] and [[descending]] node factories are called with a function
 * returning its parameter (same as `identity` from lodash). You might expect that this function
 * receives an instance of the item, but that's not the case. In fact this function is a factory
 * function that gets passed into an [fn](_nodes_graph_fn_.html#fn) node in order to create a Muster function. See the
 * [fn](_nodes_graph_fn_.html#fn) documentation to learn more about Muster functions. Thanks to that, Muster
 * internally operates only on [[NodeDefinition]]s, which permits serializing these
 * nodes to JSON and safely sending them to remote Muster instances without having to
 * worry about running unsafe JavaScript code on the server.
 *
 *
 * @example **Sorting branches**
 * ```js
 * import muster, {
 *   ascending,
 *   descending,
 *   get,
 *   entries,
 *   key,
 *   query,
 *   ref,
 *   sort,
 *   withTransforms,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   cars: [
 *     { make: 'Mercedes', model: 'C 63 AMG', year: 2017 },
 *     { make: 'Mercedes', model: 'A', year: 2009 },
 *     { make: 'Audi', model: 'R8', year: 2013 },
 *     { make: 'Audi', model: 'A4', year: 2018 },
 *     { make: 'Toyota', model: 'Corolla', year: 2016 },
 *   ],
 * });
 *
 * const sortedCars = await app.resolve(query(ref('cars'), withTransforms([
 *   sort([
 *     ascending((car) => get(car, 'make')),
 *     descending((car) => get(car, 'year')),
 *   ]),
 * ], entries({
 *   make: key('make'),
 *   model: key('model'),
 *   year: key('year'),
 * }))));
 * // sortedCars = [
 * //   { make: 'Audi', model: 'A4', year: 2018 },
 * //   { make: 'Audi', model: 'R8', year: 2013 },
 * //   { make: 'Mercedes', model: 'C 63 AMG', year: 2017 },
 * //   { make: 'Mercedes', model: 'A', year: 2009 },
 * //   { make: 'Toyota', model: 'Corolla', year: 2016 },
 * // ]
 * ```
 * This example shows how to implement a transform that sorts by the given leaves of a branch.
 * It shows the implementation of the example that was featured in the description of the
 * [[sort]].
 */
export function sort(
  order:
    | NodeDefinition
    | ((item: NodeDefinition) => NodeLike)
    | Array<NodeDefinition | ((item: NodeDefinition) => NodeLike)>,
): SortNodeDefinition {
  return createNodeDefinition(SortNodeType, {
    order: (Array.isArray(order) ? order : [order]).map((iteratee) =>
      typeof iteratee === 'function' ? ascending(iteratee) : iteratee,
    ),
  });
}

export type SortValue = null | undefined | boolean | string | number | Date;

function isValidSortValue(value: GraphNode): value is ValueNode<SortValue> {
  if (!ValueNodeType.is(value)) {
    return false;
  }
  const { value: sortValue } = value.definition.properties;
  switch (typeof sortValue) {
    case 'undefined':
    case 'boolean':
    case 'string':
    case 'number':
      return true;
    case 'object':
      return sortValue === null || sortValue instanceof Date;
    default:
      return false;
  }
}
