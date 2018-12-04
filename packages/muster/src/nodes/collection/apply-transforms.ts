import {
  getItemsOperation,
  GetItemsOperation,
  supportsGetItemsOperation,
} from '../../operations/get-items';
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
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { array } from './array';

/**
 * An instance of the [[applyTransforms]] node.
 * See the [[applyTransforms]] documentation to find out more.
 */
export interface ApplyTransformsNode
  extends StatelessGraphNode<'applyTransforms', ApplyTransformsNodeProperties> {}

/**
 * A definition of the [[applyTransforms]] node.
 * See the [[applyTransforms]] documentation to find out more.
 */
export interface ApplyTransformsNodeDefinition
  extends StatelessNodeDefinition<'applyTransforms', ApplyTransformsNodeProperties> {}

export interface ApplyTransformsNodeProperties {
  target: NodeDefinition;
  transforms: Array<NodeDefinition | GraphNode>;
}

/**
 * The implementation of the [[applyTransforms]] node.
 * See the [[applyTransforms]] documentation to learn more.
 */
export const ApplyTransformsNodeType: StatelessNodeType<
  'applyTransforms',
  ApplyTransformsNodeProperties
> = createNodeType<'applyTransforms', ApplyTransformsNodeProperties>('applyTransforms', {
  shape: {
    target: graphTypes.nodeDefinition,
    transforms: types.arrayOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
  },
  operations: {
    getItems: {
      getDependencies({ target }: ApplyTransformsNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsGetItemOperation,
          },
        ];
      },
      run(
        node: ApplyTransformsNode,
        operation: GetItemsOperation,
        [source]: [GraphNode],
      ): GraphAction {
        const { transforms } = node.definition.properties;
        const scopedTransforms = [...transforms, ...operation.properties.transforms].map(
          (transform) => (isNodeDefinition(transform) ? withScopeFrom(node, transform) : transform),
        );
        return createGraphAction(source, getItemsOperation(scopedTransforms));
      },
    },
  },
});

/**
 * Creates a new instance of a [[applyTransforms]] node, which is a type of [[NodeDefinition]] which can apply transforms to a collection of items.
 * These items can be either [values](_nodes_graph_value_.html#value) or [[tree]]s. It's recommended that items in a collection be
 * of the same type (and in case of [[tree]] - shape).
 *
 * Collections support a number of transforms. These transforms can be applied in any order to a target collection.
 * - **count** ([[count]]) - Gets the count of items found in the collection
 * - **filter** ([[filter]]) - Filters the applyTransforms based on a given predicate
 * - **map** ([[map]]) - Performs a map transform on the every item of the collection
 * - **slice** ([[slice]]) - Slices the collection based on a defined range
 * - **sort** ([[sort]]) - Sorts the items based on a given predicate
 * - **groupBy** ([[groupBy]]) - Groups the items based on a given predicate
 * - **firstItem** ([[firstItem]]) - Takes a first item of the collection
 * - **lastItem** ([[lastItem]]) - Takes the last item of the collection
 * - **nthItem** ([[nthItem]]) - Takes nth (0-based) item of the collection
 * - **take** ([[take]]) - Takes a given number of items from the collection
 *
 * At creation, every [[applyTransforms]] requires a source for its items. Currently Muster supports following
 * collection data sources:
 * - **array** ([[array]]) - An in-memory array.
 * - **arrayList** ([[arrayList]]) - An in-memory mutable array
 * - **nodeList** ([[nodeList]])) - An in-memory array of GraphNodes.
 * - **another applyTransforms node** - This can be useful when one collection contains partially
 *   filtered items and another collection uses the output of it and applies another set of
 *   transforms to it
 * - **a remote collection** - See the [[proxy]] and [[remote]] documentation to learn
 *   more.
 *
 * @example **Filtering collection**
 * ```js
 * import muster, { applyTransforms, filter, gt, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: applyTransforms(
 *     [1, 2, 3, 4, 5],
 *     [
 *       // Filter items with a value greater than 3
 *       filter((item) => gt(item, 3))
 *     ],
 *   ),
 * });
 *
 * const numbers = await app.resolve(query(ref('numbers'), entries()));
 * // numbers === [4, 5]
 * ```
 * This example shows the basic use of the [[filter]] transform. Here the transform is applied
 * directly to the numbers applyTransforms, but it is also possible to apply the transform in the query.
 * See the "**Building the query with transforms**" example to learn more.
 *
 * @example **Linking collection**
 * ```js
 * import muster, { applyTransforms, filter, gt, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   originalNumbers: [1, 2, 3],
 *   filteredNumbers: applyTransforms(
 *     ref('originalNumbers'),
 *     [filter((item) => gt(item, 1))],
 *   ),
 *   allNumbers: ref('originalNumbers'),
 * });
 * const filteredNumbers = await app.resolve(
 *   query(ref('filteredNumbers'), entries()),
 * );
 * // filteredNumbers === [2, 3]
 *
 * const allNumbers = await app.resolve(
 *   query(ref('allNumbers'), entries()),
 * );
 * // allNumbers === [1, 2, 3]
 * ```
 * This example shows how to use a [[ref]] as the target for the [[applyTransforms]].
 */
export function applyTransforms(
  target: NodeDefinition | Array<NodeLike>,
  transforms: Array<NodeDefinition | GraphNode>,
): ApplyTransformsNodeDefinition {
  return createNodeDefinition(ApplyTransformsNodeType, {
    target: Array.isArray(target)
      ? array(target.map((item) => (isNodeDefinition(item) ? item : toNode(item))))
      : target,
    transforms,
  });
}

const untilSupportsGetItemOperation = {
  predicate: supportsGetItemsOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Target node does not support getItems operation.', {
      received: node.definition,
    });
  },
};
