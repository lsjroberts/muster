import once from 'lodash/once';
import {
  GraphAction,
  GraphNode,
  isNodeDefinition,
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
import * as types from '../../utils/types';
import { fn } from '../graph/fn';
import { toValue, value } from '../graph/value';
import { removeItemsOperation, supportsRemoveItemsOperation } from './operations/remove-items';

/**
 * An instance of the [[removeItems]] node.
 * See the [[removeItems]] documentation to find out more.
 */
export interface RemoveItemsNode
  extends StatefulGraphNode<'remove-items', RemoveItemsNodeProperties> {}

/**
 * A definition of the [[removeItems]] node.
 * See the [[removeItems]] documentation to find out more.
 */
export interface RemoveItemsNodeDefinition
  extends StatefulNodeDefinition<'remove-items', RemoveItemsNodeProperties> {}

export interface RemoveItemsNodeProperties {
  predicate: NodeDefinition;
  target: NodeDefinition;
}

export interface RemoveItemsNodeState {
  memoized: (targetNode: GraphNode, predicate: NodeDefinition) => GraphAction;
}

/**
 * The implementation of the [[removeItems]].
 * See the [[removeItems]] documentation for more information.
 */
export const RemoveItemsNodeType: StatefulNodeType<
  'remove-items',
  RemoveItemsNodeProperties,
  RemoveItemsNodeState,
  {}
> = createNodeType<'remove-items', RemoveItemsNodeProperties, RemoveItemsNodeState, {}>(
  'remove-items',
  {
    shape: {
      predicate: graphTypes.nodeDefinition,
      target: graphTypes.nodeDefinition,
    },
    state: {
      memoized: types.saveHash(types.func),
    },
    getInitialState() {
      return {
        memoized: once((target: GraphNode, predicate: NodeDefinition) =>
          createGraphAction(target, removeItemsOperation(predicate)),
        ),
      };
    },
    operations: {
      evaluate: {
        cacheable: false,
        getDependencies({ target, predicate }: RemoveItemsNodeProperties): Array<NodeDependency> {
          return [
            {
              target,
              until: untilSupportsRemoveItemsOperation,
            },
          ];
        },
        run(
          node: RemoveItemsNode,
          operation: never,
          [target]: [GraphNode],
          context: never,
          state: RemoveItemsNodeState,
        ): GraphAction {
          const { predicate } = node.definition.properties;
          return state.memoized(target, predicate);
        },
      },
    },
  },
);

const untilSupportsRemoveItemsOperation = {
  predicate: supportsRemoveItemsOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage(
      'Target node does not allow collection mutations (removeItems)',
      { received: node.definition },
    );
  },
};

/**
 * Creates an instance of a [[removeItems]] node, which is used to remove all items from a mutable
 * collection that match the provided predicate.
 *
 * The predicate can be any callable node (e.g. fn() or action() – the default is fn()), which will
 * be invoked with a single parameter (the list item), and must return a node that resolves to a
 * boolean value() node that determines whether to remove that item. The predicate will be invoked
 * once for each item in the collection.
 *
 * @example **Remove all items from a mutable collection that match the provided predicate**
 * ```js
 * import muster, { arrayList, entries, get, query, ref, removeItems, fn } from '@dws/muster';
 *
 * const app = muster({
 *   tasks: arrayList([
 *     { description: 'First task', completed: true },
 *     { description: 'Second task', completed: true },
 *     { description: 'Third task', completed: false },
 *   ]),
 * });
 *
 * app.resolve(query(ref('tasks'), entries({ description: true }))).subscribe((value) => {
 *   console.log(value);
 * });
 *
 * await app.resolve(removeItems(ref('tasks'), (item) => get(item, 'completed')));
 *
 * // Console output:
 * // [{ description: 'First task' }, { description: 'Second task' }, { description: 'Third task' }]
 * // [{ description: 'Third task' }]
 * ```
 */
export function removeItems(
  target: NodeDefinition,
  predicate: NodeDefinition | NodeLike | ((item: NodeDefinition) => NodeDefinition | NodeLike),
): RemoveItemsNodeDefinition {
  return createNodeDefinition(RemoveItemsNodeType, {
    predicate:
      typeof predicate === 'function'
        ? fn((item: NodeDefinition) => toValue(predicate(item)))
        : isNodeDefinition(predicate)
        ? predicate
        : value(predicate),
    target,
  });
}
