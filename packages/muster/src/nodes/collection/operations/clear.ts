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

/**
 * A definition of the `clear` graph operation.
 * See the [[clearOperation]] documentation to find out more.
 */
export interface ClearOperation extends GraphOperation<'clear', ClearProperties> {}

export interface ClearProperties {}

/**
 * An implementation of the [[clearOperation]].
 * See the [[clearOperation]] documentation to find out more.
 */
export const ClearOperationType: OperationType<'clear', ClearProperties> = createOperationType<
  'clear',
  ClearProperties
>('clear', {
  cacheable: false,
});

/**
 * Creates a new instance of [[clearOperation]]. This operation is used to instruct Muster
 * to traverse the `clear` operation for a given node.
 */
export function clearOperation(): ClearOperation {
  return createGraphOperation(ClearOperationType);
}

export function isClearOperation(value: GraphOperation): value is ClearOperation {
  return value.type === ClearOperationType;
}

export type ClearableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'clear', ClearOperation>;

export type ClearableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'clear', ClearOperation, ClearableNodeType<T, P, S, D, V>>;

export type ClearableNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeDefinition<T, P, S, D, V, 'clear', ClearOperation, ClearableNodeType<T, P, S, D, V>>;

export function supportsClearOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ClearableNodeDefinition<T, P, S, D, V>;
export function supportsClearOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ClearableGraphNode<T, P, S, D, V>;
export function supportsClearOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ClearableNodeDefinition<T, P, S, D, V> | ClearableGraphNode<T, P, S, D, V>;
export function supportsClearOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ClearableNodeDefinition<T, P, S, D, V> | ClearableGraphNode<T, P, S, D, V> {
  return supportsOperationType('clear', node);
}
