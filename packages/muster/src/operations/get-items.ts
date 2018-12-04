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
import * as graphTypes from '../utils/graph-types';
import supportsOperationType from '../utils/supports-operation-type';
import * as types from '../utils/types';

/**
 * A definition of the `getItems` graph operation.
 * See the [[getItemsOperation]] documentation to find out more.
 */
export interface GetItemsOperation extends GraphOperation<'getItems', GetItemsProperties> {}

export interface GetItemsProperties {
  transforms: Array<NodeDefinition | GraphNode>;
}

/**
 * An implementation of the [[getItemsOperation]].
 * See the [[getItemsOperation]] documentation to find out more.
 */
export const GetItemsOperationType: OperationType<
  'getItems',
  GetItemsProperties
> = createOperationType<'getItems', GetItemsProperties>('getItems', {
  shape: {
    transforms: types.arrayOf(
      types.oneOfType<NodeDefinition | GraphNode>([
        graphTypes.nodeDefinition,
        graphTypes.graphNode,
      ]),
    ),
  },
});

/**
 * Creates a new instance of [[getItemsOperation]]. This operation is used to instruct Muster to
 * traverse the `getItems` operation for a given node.
 */
export function getItemsOperation(
  transforms?: Array<NodeDefinition | GraphNode>,
): GetItemsOperation {
  return createGraphOperation(GetItemsOperationType, { transforms: transforms || [] });
}

export function isGetItemsOperation(value: GraphOperation): value is GetItemsOperation {
  return value.type === GetItemsOperationType;
}

export type ListNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'getItems', GetItemsOperation>;

export type ListGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'getItems', GetItemsOperation, ListNodeType<T, P, S, D, V>>;

export type ListNodeDefinition<
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
  'getItems',
  GetItemsOperation,
  ListNodeType<T, P, S, D, V>
>;

export function supportsGetItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ListNodeDefinition<T, P, S, D, V>;
export function supportsGetItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ListGraphNode<T, P, S, D, V>;
export function supportsGetItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ListNodeDefinition<T, P, S, D, V> | ListGraphNode<T, P, S, D, V>;
export function supportsGetItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ListNodeDefinition<T, P, S, D, V> | ListGraphNode<T, P, S, D, V> {
  return supportsOperationType('getItems', node);
}
