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
} from '../types/graph';
import createGraphOperation from '../utils/create-graph-operation';
import { createOperationType } from '../utils/create-operation-type';
import supportsOperationType from '../utils/supports-operation-type';

/**
 * A definition of the `isUpdating` graph operation.
 * See the [[isUpdatingOperation]] documentation to find out more.
 */
export interface IsUpdatingOperation extends GraphOperation<'isUpdating'> {}

/**
 * An implementation of the [[isUpdatingOperation]].
 * See the [[isUpdatingOperation]] documentation to find out more.
 */
export const IsUpdatingOperationType: OperationType<'isUpdating'> = createOperationType<
  'isUpdating'
>('isUpdating');

/**
 * Creates a new instance of [[isUpdatingOperation]]. This operation is used to instruct Muster to
 * traverse the `isUpdating` operation for a given node.
 */
export function isUpdatingOperation(): IsUpdatingOperation {
  return createGraphOperation(IsUpdatingOperationType, {});
}

export function isIsUpdatingOperation(value: GraphOperation): value is IsUpdatingOperation {
  return value.type === IsUpdatingOperationType;
}

export type NodeTypeWithIsUpdating<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'isUpdating', IsUpdatingOperation>;

export type GraphNodeWithIsUpdating<
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
  'isUpdating',
  IsUpdatingOperation,
  NodeTypeWithIsUpdating<T, P, S, D, V>
>;

export type NodeDefinitionWithIsUpdating<
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
  'isUpdating',
  IsUpdatingOperation,
  NodeTypeWithIsUpdating<T, P, S, D, V>
>;

export function supportsIsUpdatingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is NodeDefinitionWithIsUpdating<T, P, S, D, V>;
export function supportsIsUpdatingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is GraphNodeWithIsUpdating<T, P, S, D, V>;
export function supportsIsUpdatingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is NodeDefinitionWithIsUpdating<T, P, S, D, V> | GraphNodeWithIsUpdating<T, P, S, D, V>;
export function supportsIsUpdatingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is NodeDefinitionWithIsUpdating<T, P, S, D, V> | GraphNodeWithIsUpdating<T, P, S, D, V> {
  return supportsOperationType('isUpdating', node);
}
