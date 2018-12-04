import {
  GraphNode,
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';

/**
 * An instance of the [[iteratorResult]] node.
 * See the [[iteratorResult]] documentation to find out more.
 */
export interface IteratorResultNode
  extends StaticGraphNode<'iteratorResult', IteratorResultNodeProperties> {}

/**
 * A definition of the [[iteratorResult]] node.
 * See the [[iteratorResult]] documentation to find out more.
 */
export interface IteratorResultNodeDefinition
  extends StaticNodeDefinition<'iteratorResult', IteratorResultNodeProperties> {}

export interface IteratorResultNodeProperties {
  value: NodeDefinition | GraphNode;
  next: NodeDefinition | GraphNode;
}

/**
 * An implementation of the [[iteratorResult]] node.
 * See the [[iteratorResult]] documentation to find out more.
 */
export const IteratorResultNodeType: StaticNodeType<
  'iteratorResult',
  IteratorResultNodeProperties
> = createNodeType<'iteratorResult', IteratorResultNodeProperties>('iteratorResult', {
  shape: {
    value: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
    next: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
  },
});

/**
 * Creates a new instance of the [[iteratorResult]] node. This node is used internally by the iterator implementation of
 * collections, and its purpose is to return a a result from a node implementing `iterate` operation.
 */
export function iteratorResult(
  value: NodeDefinition | GraphNode,
  next: NodeDefinition | GraphNode,
): IteratorResultNodeDefinition {
  return createNodeDefinition(IteratorResultNodeType, {
    value,
    next,
  });
}

export function isIteratorResultNodeDefinition(
  value: NodeDefinition,
): value is IteratorResultNodeDefinition {
  return value.type === IteratorResultNodeType;
}
