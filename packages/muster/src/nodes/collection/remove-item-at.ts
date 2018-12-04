import once from 'lodash/once';
import {
  GraphAction,
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { untilIntegerValueNode } from '../../utils/is-integer-value-node';
import * as types from '../../utils/types';
import { toValue, ValueNode } from '../graph/value';
import { removeItemAtOperation, supportsRemoveItemAtOperation } from './operations/remove-item-at';

/**
 * An instance of the [[removeItemAt]] node.
 * See the [[removeItemAt]] documentation to find out more.
 */
export interface RemoveItemAtNode
  extends StatefulGraphNode<'remove-item-at', RemoveItemAtNodeProperties> {}

/**
 * A definition of the [[removeItemAt]] node.
 * See the [[removeItemAt]] documentation to find out more.
 */
export interface RemoveItemAtNodeDefinition
  extends StatefulNodeDefinition<'remove-item-at', RemoveItemAtNodeProperties> {}

export interface RemoveItemAtNodeProperties {
  index: NodeDefinition;
  target: NodeDefinition;
}

export interface RemoveItemAtNodeState {
  memoized: (targetNode: GraphNode, index: number) => GraphAction;
}

/**
 * The implementation of the [[removeItemAt]].
 * See the [[removeItemAt]] documentation for more information.
 */
export const RemoveItemAtNodeType: StatefulNodeType<
  'remove-item-at',
  RemoveItemAtNodeProperties,
  RemoveItemAtNodeState,
  {}
> = createNodeType<'remove-item-at', RemoveItemAtNodeProperties, RemoveItemAtNodeState, {}>(
  'remove-item-at',
  {
    shape: {
      index: graphTypes.nodeDefinition,
      target: graphTypes.nodeDefinition,
    },
    state: {
      memoized: types.saveHash(types.func),
    },
    getInitialState() {
      return {
        memoized: once((target: GraphNode, index: number) =>
          createGraphAction(target, removeItemAtOperation(index)),
        ),
      };
    },
    operations: {
      evaluate: {
        cacheable: false,
        getDependencies({ target, index }: RemoveItemAtNodeProperties): Array<NodeDependency> {
          return [
            {
              target,
              until: untilSupportsRemoveItemAtOperation,
            },
            {
              target: index,
              until: untilPositiveValueIndex,
            },
          ];
        },
        run(
          node: RemoveItemAtNode,
          options: never,
          [target, index]: [GraphNode, ValueNode<number>],
          context: never,
          state: RemoveItemAtNodeState,
        ): GraphAction {
          return state.memoized(target, index.definition.properties.value);
        },
      },
    },
  },
);

const untilSupportsRemoveItemAtOperation = {
  predicate: supportsRemoveItemAtOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage(
      'Target node does not allow collection mutations (removeItemAt)',
      { received: node.definition },
    );
  },
};

const untilPositiveValueIndex = untilIntegerValueNode(RemoveItemAtNodeType, 'index');

/**
 * Creates an instance of an [[remoteItemAt]] node, which is a type of a graph node used when inserting an item into
 * a mutable collection at a specific index.
 *
 *
 * @example **Remove a number from a mutable collection**
 * ```js
 * import muster, { arrayList, entries, query, ref, removeItemAt } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: arrayList([1, 2, 3]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((value) => {
 *   console.log(value);
 * });
 *
 * await app.resolve(removeItemAt(ref('numbers'), 1));
 *
 * // Console output:
 * // [1, 2, 3]
 * // [1, 3]
 * ```
 * This example shows how to remove item at a specific index from a mutable collection.
 *
 *
 * @example **Remove a branch from a mutable collection**
 * ```js
 * import muster, { arrayList, entries, key, query, ref, removeItemAt, toNode } from '@dws/muster';
 *
 * const app = muster({
 *   people: arrayList([
 *     { firstName: 'Lizzie', lastName: 'Ramirez' },
 *     { firstName: 'Charlotte', lastName: 'Schneider' },
 *   ]),
 * });
 *
 * app.resolve(query(ref('people'), entries({
 *   firstName: key('firstName'),
 * }))).subscribe((value) => {
 *   console.log(value);
 * });
 *
 * await app.resolve(
 *   removeItemAt(ref('people'), 1),
 * );
 *
 * // Console output:
 * // [{ firstName: 'Lizzie' }, { firstName: 'Charlotte' }]
 * // [{ firstName: 'Lizzie' }]
 * ```
 * This example shows how to remove a branch at a specific index from a mutable collection.
 */
export function removeItemAt(target: NodeDefinition, index: NodeLike): RemoveItemAtNodeDefinition {
  return createNodeDefinition(RemoveItemAtNodeType, {
    index: toValue(index),
    target,
  });
}
