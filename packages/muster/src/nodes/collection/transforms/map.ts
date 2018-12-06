import { callOperation } from '../../../operations/call';
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
import resolveShallow from '../../../utils/resolve-shallow';
import { toNode } from '../../../utils/to-node';
import withScopeFrom from '../../../utils/with-scope-from';
import { apply } from '../../graph/apply';
import { error } from '../../graph/error';
import { fn } from '../../graph/fn';
import { fuzzyTraverse } from '../../graph/fuzzy-traverse';
import { nodeList } from '../node-list';
import { init, InitOperation } from '../operations/init';
import { result, ResultOperation } from '../operations/result';
import { step, StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';

/**
 * An instance of the [[map]] node.
 * See the [[map]] documentation to find out more.
 */
export interface MapNode extends StatelessGraphNode<'map', MapNodeProperties> {}

/**
 * A definition of the [[map]] node.
 * See the [[map]] documentation to find out more.
 */
export interface MapNodeDefinition extends StatelessNodeDefinition<'map', MapNodeProperties> {}

export interface MapNodeProperties {
  transform: NodeDefinition;
}

/**
 * The implementation of the [[map]] node.
 * See the [[map]] documentation to learn more.
 */
export const MapNodeType: StatelessNodeType<'map', MapNodeProperties> = createNodeType('map', {
  shape: {
    transform: graphTypes.nodeDefinition,
  },
  operations: {
    transformItems: {
      getDependencies(
        { transform }: MapNodeProperties,
        operation: TransformItemsOperation,
      ): Array<NodeDependency> {
        return operation.properties.items.map((item) => {
          const transformItem = fuzzyTraverse(transform, callOperation([item]));
          return resolveShallow(transformItem);
        });
      },
      run(
        node: MapNode,
        operation: TransformItemsOperation,
        items: Array<GraphNode>,
      ): NodeDefinition {
        return nodeList(items);
      },
    },
    init: {
      run(node: MapNode, operation: InitOperation): NodeDefinition | GraphAction {
        const { next } = operation.properties;
        if (!next) {
          return error('Map reducer cannot be used as a base reducer');
        }
        return createGraphAction(next, init());
      },
    },
    step: {
      run(node: MapNode, operation: StepOperation<any>): NodeDefinition | GraphAction {
        const { acc, item, next } = operation.properties;
        if (!next) {
          return error('Map reducer cannot be used as a base reducer');
        }
        const { transform } = node.definition.properties;
        const transformedItem = apply([item], transform);
        return createGraphAction(next, step(acc, withScopeFrom(node, transformedItem)));
      },
    },
    result: {
      run(node: MapNode, operation: ResultOperation<any>): NodeDefinition | GraphAction {
        const { acc, next } = operation.properties;
        if (!next) {
          return error('Map reducer cannot be used as a base reducer');
        }
        return createGraphAction(next, result(acc));
      },
    },
  },
});

/**
 * Creates a new instance of a [[map]] node, which is a type of collection transform used when mapping items
 * from one representation from to another.
 * This type of transform can be thought of as akin to JavaScript's `Array.map` function.
 *
 * @example **Simple mapper**
 * ```js
 * import muster, { applyTransforms, entries, map, multiply, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4],
 *   numbersTimes2: applyTransforms(ref('numbers'), [
 *     map((item) => multiply(item, 2)),
 *   ]),
 * });
 *
 * const numbersTimes2 = await app.resolve(query(ref('numbersTimes2'), entries()));
 * // numbersTimes2 === [2, 4, 6, 8]
 * ```
 * This example shows how to use a [[map]] to multiply every item of the collection by 2.
 * The multiplication is done with help of an arithmetic graph node, [[multiply]].
 *
 *
 * @example **Mapping branches**
 * ```js
 * import muster, { applyTransforms, get, entries, key, map, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4],
 *   numbersAsBranches: applyTransforms(ref('numbers'), [
 *     map((item) => ({ number: item })),
 *   ]),
 * });
 *
 * const numbers = await app.resolve(query(ref('numbersAsBranches'), entries({
 *   number: key('number'),
 * })));
 * // numbers === [
 * //   { number: 1 },
 * //   { number: 2 },
 * //   { number: 3 },
 * //   { number: 4 },
 * // ]
 * ```
 * This example shows how to use a [[map]] transform to change the shape of items.
 * It converts each item from a simple [value](_nodes_graph_value_.html#value) to a [[tree]] with a branch named `number`
 * containing the item's original value.
 */
export function map(
  transform: (item: NodeDefinition) => NodeDefinition | NodeLike,
): MapNodeDefinition;
export function map(transform: NodeDefinition | NodeLike): MapNodeDefinition;
export function map(
  transform: NodeDefinition | NodeLike | ((item: NodeDefinition) => NodeDefinition | NodeLike),
): MapNodeDefinition {
  return createNodeDefinition(MapNodeType, {
    transform:
      typeof transform === 'function'
        ? fn((item: NodeDefinition) => toNode(transform(item)))
        : isNodeDefinition(transform)
        ? transform
        : toNode(transform),
  });
}
