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
 * A definition of the `contains` graph operation.
 * See the [[containsOperation]] documentation to find out more.
 */
export interface ContainsOperation extends GraphOperation<'contains', ContainsProperties> {}

export interface ContainsProperties {
  item: NodeDefinition;
  comparator: NodeDefinition;
}

/**
 * An implementation of the [[containsOperation]].
 * See the [[containsOperation]] documentation to find out more.
 */
export const ContainsOperationType: OperationType<
  'contains',
  ContainsProperties
> = createOperationType<'contains', ContainsProperties>('contains', {
  shape: {
    item: graphTypes.nodeDefinition,
    comparator: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of [[containsOperation]]. This operation is used to instruct Muster
 * to traverse the `contains` operation for a given node.
 */
export function containsOperation(
  item: NodeDefinition,
  comparator: NodeDefinition,
): ContainsOperation {
  return createGraphOperation(ContainsOperationType, { item, comparator });
}

export function isContainsOperation(value: GraphOperation): value is ContainsOperation {
  return value.type === ContainsOperationType;
}

export type ContainsableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'contains', ContainsOperation>;

export type ContainsableGraphNode<
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
  'contains',
  ContainsOperation,
  ContainsableNodeType<T, P, S, D, V>
>;

export type ContainsableNodeDefinition<
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
  'contains',
  ContainsOperation,
  ContainsableNodeType<T, P, S, D, V>
>;

export function supportsContainsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ContainsableNodeDefinition<T, P, S, D, V>;
export function supportsContainsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ContainsableGraphNode<T, P, S, D, V>;
export function supportsContainsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ContainsableNodeDefinition<T, P, S, D, V> | ContainsableGraphNode<T, P, S, D, V>;
export function supportsContainsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ContainsableNodeDefinition<T, P, S, D, V> | ContainsableGraphNode<T, P, S, D, V> {
  return supportsOperationType('contains', node);
}
