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
 * A definition of the `isPending` graph operation.
 * See the [[isPendingOperation]] documentation to find out more.
 */
export interface IsPendingOperation extends GraphOperation<'isPending'> {}

/**
 * An implementation of the [[isPendingOperation]].
 * See the [[isPendingOperation]] documentation to find out more.
 */
export const IsPendingOperationType: OperationType<'isPending'> = createOperationType<'isPending'>(
  'isPending',
);

/**
 * Creates a new instance of [[isPendingOperation]]. This operation is used to instruct Muster to
 * traverse the `isPending` operation for a given node.
 */
export function isPendingOperation(): IsPendingOperation {
  return createGraphOperation(IsPendingOperationType, {});
}

export function isIsPendingOperation(value: GraphOperation): value is IsPendingOperation {
  return value.type === IsPendingOperationType;
}

export type NodeTypeWithIsPending<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'isPending', IsPendingOperation>;

export type GraphNodeWithIsPending<
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
  'isPending',
  IsPendingOperation,
  NodeTypeWithIsPending<T, P, S, D, V>
>;

export type NodeDefinitionWithIsPending<
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
  'isPending',
  IsPendingOperation,
  NodeTypeWithIsPending<T, P, S, D, V>
>;

export function supportsIsPendingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is NodeDefinitionWithIsPending<T, P, S, D, V>;
export function supportsIsPendingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is GraphNodeWithIsPending<T, P, S, D, V>;
export function supportsIsPendingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is NodeDefinitionWithIsPending<T, P, S, D, V> | GraphNodeWithIsPending<T, P, S, D, V>;
export function supportsIsPendingOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is NodeDefinitionWithIsPending<T, P, S, D, V> | GraphNodeWithIsPending<T, P, S, D, V> {
  return supportsOperationType('isPending', node);
}
