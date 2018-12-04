import omit from 'lodash/omit';
import uniqueId from 'lodash/uniqueId';
import {
  GraphNode,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { untilBooleanValueNode } from '../../utils/is-boolean-value-node';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { apply } from '../graph/apply';
import { nil } from '../graph/nil';
import { ok } from '../graph/ok';
import { resolve } from '../graph/resolve';
import { value, ValueNode } from '../graph/value';
import { itemWithId, ItemWithIdNode } from './item-with-id';
import { nodeList, NodeListNodeDefinition } from './node-list';
import { AddItemAtOperation } from './operations/add-item-at';
import { ContainsOperation } from './operations/contains';
import { PushOperation } from './operations/push';
import { RemoveItemOperation } from './operations/remove-item';
import { RemoveItemAtOperation } from './operations/remove-item-at';
import { RemoveItemsOperation } from './operations/remove-items';
import { UnshiftOperation } from './operations/unshift';

/**
 * An instance of the [[arrayList]] node.
 * See the [[arrayList]] documentation to find out more.
 */
export interface ArrayListNode
  extends GraphNode<'arrayList', ArrayListNodeProperties, ArrayListNodeState, ArrayListNodeData> {}

/**
 * A definition of the [[arrayList]] node.
 * See the [[arrayList]] documentation to find out more.
 */
export interface ArrayListNodeDefinition
  extends NodeDefinition<
      'arrayList',
      ArrayListNodeProperties,
      ArrayListNodeState,
      ArrayListNodeData
    > {}

export interface ArrayListNodeProperties {
  items: Array<NodeDefinition>;
}

export interface ArrayListNodeState {
  items: NodeListNodeDefinition<ItemWithIdNode> | undefined;
  poppedItem: GraphNode | undefined;
  shiftedItem: GraphNode | undefined;
  unshiftedItem: GraphNode | undefined;
  removeItems: {
    [key: string]: NodeDefinition;
  };
}

export interface ArrayListNodeData {}

/**
 * The implementation of the [[arrayList]] node.
 * See the [[arrayList]] documentation to learn more.
 */
export const ArrayListNodeType: StatefulNodeType<
  'arrayList',
  ArrayListNodeProperties,
  ArrayListNodeState,
  ArrayListNodeData
> = createNodeType<'arrayList', ArrayListNodeProperties, ArrayListNodeState, ArrayListNodeData>(
  'arrayList',
  {
    state: {
      items: types.optional(graphTypes.nodeDefinition),
      poppedItem: types.optional(graphTypes.graphNode),
      shiftedItem: types.optional(graphTypes.graphNode),
      unshiftedItem: types.optional(graphTypes.graphNode),
      removeItems: types.objectOf(graphTypes.nodeDefinition),
    },
    shape: {
      items: types.arrayOf(graphTypes.nodeDefinition),
    },
    getInitialState(): ArrayListNodeState {
      return {
        items: undefined,
        poppedItem: undefined,
        shiftedItem: undefined,
        unshiftedItem: undefined,
        removeItems: {},
      };
    },
    onSubscribe(
      this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
      node: ArrayListNode,
    ) {
      if (this.getState().items) return;
      this.retain();
      this.setState((state) => ({
        ...state,
        items: nodeList(node.definition.properties.items.map((item) => withUniqueId(node, item))),
      }));
    },
    operations: {
      addItemAt: {
        cacheable: false,
        run(): NodeDefinition {
          return ok();
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
          operation: AddItemAtOperation,
        ): void {
          const { index, value } = operation.properties;
          const clonedItems = this.getState().items!.properties.items.slice(0);
          const sanitizedIndex = Math.min(clonedItems.length - 1, index);
          clonedItems.splice(sanitizedIndex, 0, withUniqueId(node, value));
          this.setState((state) => ({
            ...state,
            items: nodeList(clonedItems),
          }));
        },
      },
      clear: {
        cacheable: false,
        run(): NodeDefinition {
          return ok();
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
        ): void {
          this.setState((state) => ({
            ...state,
            items: nodeList([]),
          }));
        },
      },
      evaluate: {
        run(
          node: ArrayListNode,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: ArrayListNodeState,
        ): NodeDefinition {
          return state.items!;
        },
      },
      length: {
        run(
          node: ArrayListNode,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: ArrayListNodeState,
        ): NodeDefinition {
          return value(state.items!.properties.items.length);
        },
      },
      contains: {
        run(
          node: ArrayListNode,
          operation: ContainsOperation,
          dependencies: Array<never>,
          contextDependencies: Array<never>,
          state: ArrayListNodeState,
        ): NodeDefinition {
          const { item: otherItem, comparator } = operation.properties;
          return resolve(
            state.items!.properties.items.map((item) => ({
              target: apply([item, otherItem], comparator),
              until: untilBooleanValuePredicate,
            })),
            (results: Array<ValueNode<boolean>>) =>
              value(results.some((item) => item.definition.properties.value)),
          );
        },
      },
      pop: {
        cacheable: false,
        run(
          node: ArrayListNode,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: ArrayListNodeState,
        ): GraphNode {
          return state.poppedItem!;
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
        ): void {
          const items = this.getState().items!.properties.items;
          if (items.length === 0) {
            this.setState((state) => ({
              ...state,
              poppedItem: withScopeFrom(node, nil()),
            }));
            return;
          }
          const remaining = items.slice(0);
          const last = remaining.pop()!;
          this.setState((state) => ({
            ...state,
            items: nodeList(remaining),
            poppedItem: last,
          }));
        },
      },
      push: {
        cacheable: false,
        run(): NodeDefinition {
          return ok();
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
          operation: PushOperation,
        ): void {
          const { items } = this.getState().items!.properties;
          this.setState((state) => ({
            ...state,
            items: nodeList([...items, withUniqueId(node, operation.properties.value)]),
          }));
        },
      },
      removeItem: {
        cacheable: false,
        run(): NodeDefinition {
          return ok();
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
          operation: RemoveItemOperation,
        ): void {
          const { items } = this.getState().items!.properties;
          const clonedItems = items.slice(0);
          const itemIndex = clonedItems.findIndex(
            (item) => item.definition.properties.id === operation.properties.id,
          );
          if (itemIndex === -1) return;
          clonedItems.splice(itemIndex, 1);
          this.setState((state) => ({
            ...state,
            items: nodeList(clonedItems),
          }));
        },
      },
      removeItemAt: {
        cacheable: false,
        run(): NodeDefinition {
          return ok();
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
          operation: RemoveItemAtOperation,
        ): void {
          const { index } = operation.properties;
          const { items } = this.getState().items!.properties;
          if (!Number.isInteger(index) || index < 0 || index > items.length - 1) return;
          this.setState((state) => ({
            ...state,
            items: nodeList([
              ...items.slice(0, operation.properties.index),
              ...items.slice(operation.properties.index + 1),
            ]),
          }));
        },
      },
      removeItems: {
        cacheable: false,
        run(
          node: ArrayListNode,
          operation: RemoveItemsOperation,
          dependencies: Array<never>,
          contextDependencies: Array<never>,
          state: ArrayListNodeState,
        ): NodeDefinition {
          const { removeItems } = state;
          return removeItems[operation.id] || ok();
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
          operation: RemoveItemsOperation,
        ): void {
          const { predicate } = operation.properties;
          const { items } = this.getState().items!.properties;
          if (items.length === 0) {
            return;
          }
          this.setState((prevState) =>
            operation.id in prevState.removeItems
              ? prevState
              : {
                  ...prevState,
                  removeItems: {
                    ...prevState.removeItems,
                    [operation.id]: resolve(
                      items.map((item) => ({
                        target: apply([item], predicate),
                        until: untilBooleanValuePredicate,
                      })),
                      (processedResults: Array<ValueNode<boolean>>) => {
                        this.setState((prevState) => {
                          // If the array list has been mutated since this operation was subscribed, there
                          // may now be some items which haven't been tested. These should NOT be removed.
                          const { items: currentItems } = this.getState();
                          const updatedItems = currentItems!.properties.items.filter(
                            (item, index) => {
                              const processedItemIndex = items.findIndex(
                                (processedItem) => processedItem.id === item.id,
                              );
                              if (processedItemIndex === -1) {
                                return true;
                              }
                              const result = processedResults[processedItemIndex];
                              return !result.definition.properties.value;
                            },
                          );
                          return {
                            ...prevState,
                            items: nodeList(updatedItems),
                            removeItems: omit(prevState.removeItems, operation.id),
                          };
                        });
                        return ok();
                      },
                    ),
                  },
                },
          );
        },
      },
      shift: {
        cacheable: false,
        run(
          node: ArrayListNode,
          options: never,
          dependencies: Array<never>,
          context: Array<never>,
          state: ArrayListNodeState,
        ): GraphNode {
          return state.shiftedItem!;
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
        ): void {
          const { items } = this.getState().items!.properties;
          if (!items || items.length === 0) {
            this.setState((state) => ({
              ...state,
              shiftedItem: withScopeFrom(node, nil()),
            }));
            return;
          }
          const remaining = items.slice(0);
          const last = remaining.shift()!;
          this.setState((state) => ({
            ...state,
            items: nodeList(remaining),
            shiftedItem: last,
          }));
        },
      },
      unshift: {
        cacheable: false,
        run(): NodeDefinition {
          return ok();
        },
        onSubscribe(
          this: NodeExecutionContext<ArrayListNodeState, ArrayListNodeData>,
          node: ArrayListNode,
          operation: UnshiftOperation,
        ): void {
          const { items } = this.getState().items!.properties;
          this.setState((state) => ({
            ...state,
            items: nodeList([withUniqueId(node, operation.properties.value), ...items]),
          }));
        },
      },
    },
  },
);

const untilBooleanValuePredicate = untilBooleanValueNode(ArrayListNodeType, 'predicate');

/**
 * Creates a new instance of an [[arrayList]] node, which is a type of a [[NodeDefinition]] used when creating
 * a mutable in-memory array. This array allows for a following operations:
 * - push(item) - [[push]]
 * - pop() - [[pop]]
 * - shift() - [[shift]]
 * - unshift(item) - [[unshift]]
 * - addItemAt(item, index) - [[addItemAt]]
 * - removeItemAt(index) - [[removeItemAt]]
 * - length() - [[length]]
 * - clear() - [[clear]]
 *
 * When modified in any way this array retains the state for as long as the parent scope exists, or
 * until a `reset` operation is executed on the array. This behaviour resembles the behaviour of a
 * [[variable]] node.
 *
 *
 * @example **Create a simple array**
 * ```js
 * import muster, { arrayList, entries, push, pop, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: arrayList([1, 3, 2]),
 * });
 *
 * app.resolve(query(ref('numbers'), entries())).subscribe((numbers) => {
 *   console.log(numbers);
 * });
 *
 * await app.resolve(push(ref('numbers'), 4));
 * await app.resolve(pop(ref('numbers'))); // === 4
 * await app.resolve(pop(ref('numbers'))); // === 2
 * await app.resolve(pop(ref('numbers'))); // === 3
 * await app.resolve(pop(ref('numbers'))); // === 1
 * await app.resolve(pop(ref('numbers'))); // === null
 * await app.resolve(pop(ref('numbers'))); // === null
 *
 * // Console output:
 * // [1, 3, 2]
 * // [1, 3, 2, 4]
 * // [1, 3, 2]
 * // [1, 3]
 * // [1]
 * // []
 * ```
 * This example shows how to create a simple mutable array and use a few operations on it.
 */
export function arrayList(items: Array<NodeLike>): ArrayListNodeDefinition {
  return createNodeDefinition(ArrayListNodeType, {
    items: items.map((item) => toNode(item)),
  });
}

export function isArrayListNodeDefinition(value: NodeDefinition): value is ArrayListNodeDefinition {
  return value.type === ArrayListNodeType;
}

function withUniqueId(owner: GraphNode, item: NodeDefinition): ItemWithIdNode {
  return withScopeFrom(owner, itemWithId(item, uniqueId('arrayList_'))) as ItemWithIdNode;
}
