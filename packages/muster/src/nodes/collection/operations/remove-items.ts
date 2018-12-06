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
 * A definition of the `removeItems` graph operation.
 * See the [[removeItemsOperation]] documentation to find out more.
 */
export interface RemoveItemsOperation
  extends GraphOperation<'removeItems', RemoveItemsProperties> {}

export interface RemoveItemsProperties {
  predicate: NodeDefinition;
}

/**
 * An implementation of the [[removeItemsOperation]].
 * See the [[removeItemsOperation]] documentation to find out more.
 */
export const RemoveItemsOperationType: OperationType<
  'removeItems',
  RemoveItemsProperties
> = createOperationType<'removeItems', RemoveItemsProperties>('removeItems', {
  cacheable: false,
  shape: {
    predicate: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of [[removeItemsOperation]]. This operation is used to instruct Muster
 * to traverse the `removeItems` operation for a given node.
 */
export function removeItemsOperation(predicate: NodeDefinition): RemoveItemsOperation {
  return createGraphOperation(RemoveItemsOperationType, { predicate });
}

export function isRemoveItemsOperation(value: GraphOperation): value is RemoveItemsOperation {
  return value.type === RemoveItemsOperationType;
}

export type SupportsRemoveItemsNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'removeItems', RemoveItemsOperation>;

export type SupportsRemoveItemsGraphNode<
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
  'removeItems',
  RemoveItemsOperation,
  SupportsRemoveItemsNodeType<T, P, S, D, V>
>;

export type SupportsRemoveItemsNodeDefinition<
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
  'removeItems',
  RemoveItemsOperation,
  SupportsRemoveItemsNodeType<T, P, S, D, V>
>;

export function supportsRemoveItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is SupportsRemoveItemsNodeDefinition<T, P, S, D, V>;
export function supportsRemoveItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is SupportsRemoveItemsGraphNode<T, P, S, D, V>;
export function supportsRemoveItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is
  | SupportsRemoveItemsNodeDefinition<T, P, S, D, V>
  | SupportsRemoveItemsGraphNode<T, P, S, D, V>;
export function supportsRemoveItemsOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is
  | SupportsRemoveItemsNodeDefinition<T, P, S, D, V>
  | SupportsRemoveItemsGraphNode<T, P, S, D, V> {
  return supportsOperationType('removeItems', node);
}
