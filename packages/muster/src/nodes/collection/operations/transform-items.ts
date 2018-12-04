import {
  DynamicGraphNode,
  DynamicNodeDefinition,
  DynamicNodeType,
  GraphNode,
  GraphOperation,
  NodeData,
  NodeDefinition,
  NodeName,
  NodeProperties,
  NodeState,
  OperationType,
  SerializedNodeProperties,
} from '../../../types/graph';
import createGraphOperation from '../../../utils/create-graph-operation';
import { createOperationType } from '../../../utils/create-operation-type';
import * as graphTypes from '../../../utils/graph-types';
import supportsOperationType from '../../../utils/supports-operation-type';
import * as types from '../../../utils/types';

/**
 * A definition of the `transformItems` graph operation.
 * See the [[transformItemsOperation]] documentation to find out more.
 */
export interface TransformItemsOperation
  extends GraphOperation<'transformItems', TransformItemsProperties> {}

export interface TransformItemsProperties {
  items: Array<GraphNode>;
}

/**
 * An implementation of the [[transformItemsOperation]].
 * See the [[transformItemsOperation]] documentation to find out more.
 */
export const TransformItemsOperationType: OperationType<
  'transformItems',
  TransformItemsProperties
> = createOperationType<'transformItems', TransformItemsProperties>('transformItems', {
  shape: {
    items: types.arrayOf(graphTypes.graphNode),
  },
});

/**
 * Creates a new instance of [[transformItemsOperation]]. This operation is used to instruct Muster
 * to traverse the `transformItems` operation for a given node.
 */
export function transformItems(items: Array<GraphNode>): TransformItemsOperation {
  return createGraphOperation(TransformItemsOperationType, {
    items,
  });
}

export function isTransformItemsOperation(value: GraphOperation): value is TransformItemsOperation {
  return value.type === TransformItemsOperationType;
}

export type TransformerNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'transformItems', TransformItemsOperation>;

export type TransformerGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<
  T,
  P,
  S,
  D,
  V,
  'transformItems',
  TransformItemsOperation,
  TransformerNodeType<T, P, S, D, V>
>;

export type TransformerNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeDefinition<
  T,
  P,
  S,
  D,
  V,
  'transformItems',
  TransformItemsOperation,
  TransformerNodeType<T, P, S, D, V>
>;

export function supportsTransformItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is TransformerNodeDefinition<T, P, S, D, V>;
export function supportsTransformItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is TransformerGraphNode<T, P, S, D, V>;
export function supportsTransformItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is TransformerNodeDefinition<T, P, S, D, V> | TransformerGraphNode<T, P, S, D, V>;
export function supportsTransformItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is TransformerNodeDefinition<T, P, S, D, V> | TransformerGraphNode<T, P, S, D, V> {
  return supportsOperationType('transformItems', node);
}
