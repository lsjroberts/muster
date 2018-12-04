import {
  GraphNode,
  NodeDefinition,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import { createContext } from '../../utils/create-context';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeError } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { toValue, value, ValueNodeType } from '../graph/value';

const ITEM_ID_KEY = '$$item-with-id:id';

/**
 * An instance of the [[itemWithId]] node.
 * See the [[itemWithId]] documentation to find out more.
 */
export interface ItemWithIdNode
  extends StatelessGraphNode<'item-with-id', ItemWithIdNodeProperties> {}

/**
 * A definition of the [[itemWithId]] node.
 * See the [[itemWithId]] documentation to find out more.
 */
export interface ItemWithIdNodeDefinition
  extends StatelessNodeDefinition<'item-with-id', ItemWithIdNodeProperties> {}

export interface ItemWithIdNodeProperties {
  id: string;
  item: NodeDefinition;
}

/**
 * The implementation of the [[itemWithId]] node.
 * See the [[itemWithId]] documentation to find out more.
 */
export const ItemWithIdNodeType: StatelessNodeType<
  'item-with-id',
  ItemWithIdNodeProperties
> = createNodeType<'item-with-id', ItemWithIdNodeProperties>('item-with-id', {
  shape: {
    id: types.string,
    item: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      run(node: ItemWithIdNode): GraphNode {
        const { id, item } = node.definition.properties;
        return createGraphNode(
          node.scope,
          createContext(node.context, {
            [ITEM_ID_KEY]: withScopeFrom(node, value(id)),
          }),
          item,
        );
      },
    },
  },
});

/**
 * Creates a new instance of the [[itemWithId]] node, which is a type of a [[NodeDefinition]] used to provide an ID
 * for an item in an array. This node is internally used by the [[array]] and [[arrayList]] nodes to uniquely identify
 * an item in an array.
 */
export function itemWithId(item: NodeLike, id: string): ItemWithIdNodeDefinition {
  return createNodeDefinition(ItemWithIdNodeType, {
    item: toValue(item),
    id,
  });
}

/**
 * Gets the ID of the item by looking for the value in the context of that node.
 * @param {GraphNode} node Item to get the ID from
 * @returns {string | undefined} Item ID
 */
export function getItemId(node: GraphNode): string | undefined {
  const id = node.context.values[ITEM_ID_KEY];
  if (!id) return undefined;
  if (!ValueNodeType.is(id)) {
    throw getInvalidTypeError('Invalid type of Item ID key.', {
      expected: [ValueNodeType],
      received: id,
    });
  }
  return id.definition.properties.value;
}
