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
 * A definition of the `iterate` graph operation.
 * See the [[iterateOperation]] documentation to find out more.
 */
export interface IterateOperation extends GraphOperation<'iterate'> {}

/**
 * An implementation of the [[iterateOperation]].
 * See the [[iterateOperation]] documentation to find out more.
 */
export const IterateOperationType: OperationType<'iterate'> = createOperationType<'iterate'>(
  'iterate',
);

let instance: IterateOperation | undefined;

/**
 * Creates a new instance of [[iterateOperation]]. This operation is used to instruct Muster
 * to traverse the `iterate` operation for a given node.
 */
export function iterateOperation(): IterateOperation {
  return instance || (instance = createGraphOperation(IterateOperationType));
}

export function isIterateOperation(value: GraphOperation): value is IterateOperation {
  return value.type === IterateOperationType;
}

export type IterableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'iterate', IterateOperation>;

export type IterableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'iterate', IterateOperation, IterableNodeType<T, P, S, D, V>>;

export type IterableNodeDefinition<
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
  'iterate',
  IterateOperation,
  IterableNodeType<T, P, S, D, V>
>;

export function supportsIterateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is IterableNodeDefinition<T, P, S, D, V>;
export function supportsIterateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is IterableGraphNode<T, P, S, D, V>;
export function supportsIterateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is IterableNodeDefinition<T, P, S, D, V> | IterableGraphNode<T, P, S, D, V>;
export function supportsIterateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is IterableNodeDefinition<T, P, S, D, V> | IterableGraphNode<T, P, S, D, V> {
  return supportsOperationType('iterate', node);
}
