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
import supportsOperationType from '../../../utils/supports-operation-type';
import * as types from '../../../utils/types';

/**
 * A definition of the `removeItem` graph operation.
 * See the [[removeItemOperation]] documentation to find out more.
 */
export interface RemoveItemOperation extends GraphOperation<'removeItem', RemoveItemProperties> {}

export interface RemoveItemProperties {
  id: string;
}

/**
 * An implementation of the [[removeItemOperation]].
 * See the [[removeItemOperation]] documentation to find out more.
 */
export const RemoveItemOperationType: OperationType<
  'removeItem',
  RemoveItemProperties
> = createOperationType<'removeItem', RemoveItemProperties>('removeItem', {
  cacheable: false,
  shape: {
    id: types.string,
  },
});

/**
 * Creates a new instance of [[removeItemOperation]]. This operation is used to instruct Muster
 * to traverse the `removeItem` operation for a given node.
 */
export function removeItemOperation(id: string): RemoveItemOperation {
  return createGraphOperation(RemoveItemOperationType, { id });
}

export function isRemoveItemOperation(value: GraphOperation): value is RemoveItemOperation {
  return value.type === RemoveItemOperationType;
}

export type NodeTypeWithRemoveItem<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'removeItem', RemoveItemOperation>;

export type GraphNodeWithRemoveItem<
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
  'removeItem',
  RemoveItemOperation,
  NodeTypeWithRemoveItem<T, P, S, D, V>
>;

export type NodeDefinitionWithRemoveItem<
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
  'removeItem',
  RemoveItemOperation,
  NodeTypeWithRemoveItem<T, P, S, D, V>
>;

export function supportsRemoveItemOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is NodeDefinitionWithRemoveItem<T, P, S, D, V>;
export function supportsRemoveItemOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is GraphNodeWithRemoveItem<T, P, S, D, V>;
export function supportsRemoveItemOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is NodeDefinitionWithRemoveItem<T, P, S, D, V> | GraphNodeWithRemoveItem<T, P, S, D, V>;
export function supportsRemoveItemOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is NodeDefinitionWithRemoveItem<T, P, S, D, V> | GraphNodeWithRemoveItem<T, P, S, D, V> {
  return supportsOperationType('removeItem', node);
}
