import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';

/**
 * An instance of the [[emptyItem]] node.
 * See the [[emptyItem]] documentation to find out more.
 */
export interface EmptyItemNode extends StaticGraphNode<'empty-item', EmptyItemNodeProperties> {}

/**
 * A definition of the [[emptyItem]] node.
 * See the [[emptyItem]] documentation to find out more.
 */
export interface EmptyItemNodeDefinition
  extends StaticNodeDefinition<'empty-item', EmptyItemNodeProperties> {}

export interface EmptyItemNodeProperties {}

/**
 * An implementation of the [[emptyItem]] node.
 * See the [[emptyItem]] documentation to find out more.
 */
export const EmptyItemNodeType: StaticNodeType<
  'empty-item',
  EmptyItemNodeProperties
> = createNodeType<'empty-item', EmptyItemNodeProperties>('empty-item', {
  shape: {},
});

/**
 * Creates a new instance of the [[emptyItem]] node. This node is used internally by [[proxy]] and [[placeholder]] nodes
 * to indicate to the [[query]] node that a given remote collection query has returned no items, and that the [[query]]
 * node should return an empty array instead.
 */
export function emptyItem(): EmptyItemNodeDefinition {
  return createNodeDefinition(EmptyItemNodeType, {});
}

export function isEmptyItemNodeDefinition(value: NodeDefinition): value is EmptyItemNodeDefinition {
  return value.type === EmptyItemNodeType;
}
