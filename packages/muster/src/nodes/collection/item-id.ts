import { StaticGraphNode, StaticNodeDefinition, StaticNodeType } from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as types from '../../utils/types';

export interface ItemIdNode extends StaticGraphNode<'item-id', ItemIdNodeProperties> {}

export interface ItemIdNodeDefinition
  extends StaticNodeDefinition<'item-id', ItemIdNodeProperties> {}

export interface ItemIdNodeProperties {
  id: string;
}

export const ItemIdNodeType: StaticNodeType<'item-id', ItemIdNodeProperties> = createNodeType<
  'item-id',
  ItemIdNodeProperties
>('item-id', {
  shape: {
    id: types.string,
  },
});

export function itemId(id: string): ItemIdNodeDefinition {
  return createNodeDefinition(ItemIdNodeType, { id });
}
