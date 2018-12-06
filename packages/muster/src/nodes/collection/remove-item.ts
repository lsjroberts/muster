import lodashOnce from 'lodash/once';
import {
  GraphAction,
  GraphNode,
  NodeDefinition,
  NodeDependency,
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
import { once } from '../graph/once';
import { ItemWithIdNode, ItemWithIdNodeType } from './item-with-id';
import { removeItemOperation, supportsRemoveItemOperation } from './operations/remove-item';

/**
 * An instance of the [[removeItem]] node.
 * See the [[removeItem]] documentation to find out more.
 */
export interface RemoveItemNode
  extends StatefulGraphNode<'remove-item', RemoveItemNodeProperties> {}

/**
 * A definition of the [[removeItem]] node.
 * See the [[removeItem]] documentation to find out more.
 */
export interface RemoveItemNodeDefinition
  extends StatefulNodeDefinition<'remove-item', RemoveItemNodeProperties> {}

export interface RemoveItemNodeProperties {
  item: NodeDefinition;
  target: NodeDefinition;
}

export interface RemoveItemNodeState {
  memoized: (targetNode: GraphNode, id: string) => GraphAction;
}

/**
 * The implementation of the [[removeItem]].
 * See the [[removeItem]] documentation for more information.
 */
export const RemoveItemNodeType: StatefulNodeType<
  'remove-item',
  RemoveItemNodeProperties,
  RemoveItemNodeState,
  {}
> = createNodeType<'remove-item', RemoveItemNodeProperties, RemoveItemNodeState, {}>(
  'remove-item',
  {
    shape: {
      item: graphTypes.nodeDefinition,
      target: graphTypes.nodeDefinition,
    },
    state: {
      memoized: types.saveHash(types.func),
    },
    getInitialState() {
      return {
        memoized: lodashOnce((target: GraphNode, id: string) =>
          createGraphAction(target, removeItemOperation(id)),
        ),
      };
    },
    operations: {
      evaluate: {
        cacheable: false,
        getDependencies({ target, item }: RemoveItemNodeProperties): Array<NodeDependency> {
          return [
            {
              target,
              until: untilSupportsRemoveItemOperation,
            },
            {
              target: once({
                target: item,
                until: untilItemWithId,
              }),
              until: untilItemWithId,
            },
          ];
        },
        run(
          node: RemoveItemNode,
          options: never,
          [target, item]: [GraphNode, ItemWithIdNode],
          context: never,
          state: RemoveItemNodeState,
        ): GraphAction {
          return state.memoized(target, item.definition.properties.id);
        },
      },
    },
  },
);

const untilSupportsRemoveItemOperation = {
  predicate: supportsRemoveItemOperation,
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage(
      'Target node does not allow collection mutations (removeItem)',
      { received: node.definition },
    );
  },
};

const untilItemWithId = {
  predicate(item: GraphNode) {
    return ItemWithIdNodeType.is(item);
  },
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Item did not resolve into an itemWithId().', {
      expected: [ItemWithIdNodeType],
      received: node,
    });
  },
};

/**
 * Creates a new instance of the [[removeItem]] node, which is a type of a [[NodeDefinition]] used when removing a
 * specific item from a collection supporting [[removeItemOperation]].
 *
 *
 * @example **Remove the last item from a collection**
 * ```js
 * import muster, { arrayList, entries, last, query, ref, removeItem } from '@dws/muster';
 *
 * const app = muster({
 *   people: arrayList([
 *     { name: 'Sarah' },
 *     { name: 'Jane' },
 *     { name: 'Kate' },
 *   ]),
 * });
 *
 * app.resolve(query(ref('people'), entries({ name: true }))).subscribe((people) => {
 *   console.log('People:', people);
 * });
 *
 * console.log('Removing last entry');
 * await app.resolve(removeItem(ref('people'), ref('people', last())));
 *
 * // Console output:
 * // People: [{ name: 'Sarah' }, { name: 'Jane' }, { name: 'Kate' }]
 * // Removing last entry
 * // People: [{ name: 'Sarah' }, { name: 'Jane' }]
 * ```
 *
 * @example **Remove person with name `Jane`**
 * ```js
 * import muster, { applyTransforms, arrayList, eq, entries, filter, get, head, query, ref, removeItem } from '@dws/muster';
 *
 * const app = muster({
 *   people: arrayList([
 *     { name: 'Sarah' },
 *     { name: 'Jane' },
 *     { name: 'Kate' },
 *   ]),
 * });
 *
 * app.resolve(query(ref('people'), entries({ name: true }))).subscribe((people) => {
 *   console.log('People:', people);
 * });
 *
 * console.log('Removing Jane');
 * await app.resolve(removeItem(ref('people'), head(applyTransforms(ref('people'), [
 *   filter((person) => eq(get(person, 'name'), 'Jane'))
 * ]))));
 *
 * // Console output:
 * // People: [{ name: 'Sarah' }, { name: 'Jane' }, { name: 'Kate' }]
 * // Removing Jane
 * // People: [{ name: 'Sarah' }, { name: 'Kate' }]
 * ```
 */
export function removeItem(target: NodeDefinition, item: NodeDefinition): RemoveItemNodeDefinition {
  return createNodeDefinition(RemoveItemNodeType, {
    item,
    target,
  });
}
