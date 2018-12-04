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
 * A definition of the `reset` graph operation.
 * See the [[resetOperation]] documentation to find out more.
 */
export interface ResetOperation extends GraphOperation<'reset'> {}

/**
 * An implementation of the [[resetOperation]].
 * See the [[resteOperation]] documentation to find out more.
 */
export const ResetOperationType: OperationType<'reset'> = createOperationType('reset', {
  cacheable: false,
});

let instance: ResetOperation | undefined;

/**
 * Creates a new instance of [[resetOperation]]. This operation is used to instruct Muster
 * to traverse the `call` operation for a given node.
 */
export function resetOperation(): ResetOperation {
  return instance || (instance = createGraphOperation(ResetOperationType));
}

export function isResetOperation(value: GraphOperation): value is ResetOperation {
  return value.type === ResetOperationType;
}

export type ResettableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'reset', ResetOperation>;

export type ResettableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'reset', ResetOperation, ResettableNodeType<T, P, S, D, V>>;

export type ResettableNodeDefinition<
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
  'reset',
  ResetOperation,
  ResettableNodeType<T, P, S, D, V>
>;

export function supportsResetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ResettableNodeDefinition<T, P, S, D, V>;
export function supportsResetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ResettableGraphNode<T, P, S, D, V>;
export function supportsResetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ResettableNodeDefinition<T, P, S, D, V> | ResettableGraphNode<T, P, S, D, V>;
export function supportsResetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ResettableNodeDefinition<T, P, S, D, V> | ResettableGraphNode<T, P, S, D, V> {
  return supportsOperationType('reset', node);
}
