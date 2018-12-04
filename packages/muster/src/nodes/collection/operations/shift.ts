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
 * A definition of the `shift` graph operation.
 * See the [[shiftOperation]] documentation to find out more.
 */
export interface ShiftOperation extends GraphOperation<'shift', ShiftProperties> {}

export interface ShiftProperties {}

/**
 * An implementation of the [[shiftOperation]].
 * See the [[shiftOperation]] documentation to find out more.
 */
export const ShiftOperationType: OperationType<'shift', ShiftProperties> = createOperationType<
  'shift',
  ShiftProperties
>('shift', {
  cacheable: false,
  shape: {},
});

/**
 * Creates a new instance of [[shiftOperation]]. This operation is used to instruct Muster
 * to traverse the `shift` operation for a given node.
 */
export function shiftOperation(): ShiftOperation {
  return createGraphOperation(ShiftOperationType, {});
}

export function isShiftOperation(value: GraphOperation): value is ShiftOperation {
  return value.type === ShiftOperationType;
}

export type ShifttableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'shift', ShiftOperation>;

export type ShifttableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'shift', ShiftOperation, ShifttableNodeType<T, P, S, D, V>>;

export type ShifttableNodeDefinition<
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
  'shift',
  ShiftOperation,
  ShifttableNodeType<T, P, S, D, V>
>;

export function supportsShiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ShifttableNodeDefinition<T, P, S, D, V>;
export function supportsShiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ShifttableGraphNode<T, P, S, D, V>;
export function supportsShiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ShifttableNodeDefinition<T, P, S, D, V> | ShifttableGraphNode<T, P, S, D, V>;
export function supportsShiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ShifttableNodeDefinition<T, P, S, D, V> | ShifttableGraphNode<T, P, S, D, V> {
  return supportsOperationType('shift', node);
}
