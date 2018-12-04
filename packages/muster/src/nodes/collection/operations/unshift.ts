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

/**
 * A definition of the `unshift` graph operation.
 * See the [[unshiftOperation]] documentation to find out more.
 */
export interface UnshiftOperation extends GraphOperation<'unshift', UnshiftProperties> {}

export interface UnshiftProperties {
  value: NodeDefinition;
}

/**
 * An implementation of the [[unshiftOperation]].
 * See the [[unshiftOperation]] documentation to find out more.
 */
export const UnshiftOperationType: OperationType<
  'unshift',
  UnshiftProperties
> = createOperationType<'unshift', UnshiftProperties>('unshift', {
  cacheable: false,
  shape: {
    value: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of [[unshiftOperation]]. This operation is used to instruct Muster
 * to traverse the `unshift` operation for a given node.
 */
export function unshiftOperation(value: NodeDefinition): UnshiftOperation {
  return createGraphOperation(UnshiftOperationType, { value });
}

export function isUnshiftOperation(value: GraphOperation): value is UnshiftOperation {
  return value.type === UnshiftOperationType;
}

export type UnshifttableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'unshift', UnshiftOperation>;

export type UnshifttableGraphNode<
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
  'unshift',
  UnshiftOperation,
  UnshifttableNodeType<T, P, S, D, V>
>;

export type UnshifttableNodeDefinition<
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
  'unshift',
  UnshiftOperation,
  UnshifttableNodeType<T, P, S, D, V>
>;

export function supportsUnshiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is UnshifttableNodeDefinition<T, P, S, D, V>;
export function supportsUnshiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is UnshifttableGraphNode<T, P, S, D, V>;
export function supportsUnshiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is UnshifttableNodeDefinition<T, P, S, D, V> | UnshifttableGraphNode<T, P, S, D, V>;
export function supportsUnshiftOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is UnshifttableNodeDefinition<T, P, S, D, V> | UnshifttableGraphNode<T, P, S, D, V> {
  return supportsOperationType('unshift', node);
}
