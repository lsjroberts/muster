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
import * as types from '../../../utils/types';

/**
 * A definition of the `removeItemAt` graph operation.
 * See the [[removeItemAtOperation]] documentation to find out more.
 */
export interface RemoveItemAtOperation
  extends GraphOperation<'removeItemAt', RemoveItemAtProperties> {}

export interface RemoveItemAtProperties {
  index: number;
}

/**
 * An implementation of the [[removeItemAtOperation]].
 * See the [[removeItemAtOperation]] documentation to find out more.
 */
export const RemoveItemAtOperationType: OperationType<
  'removeItemAt',
  RemoveItemAtProperties
> = createOperationType<'removeItemAt', RemoveItemAtProperties>('removeItemAt', {
  cacheable: false,
  shape: {
    index: types.number,
  },
});

/**
 * Creates a new instance of [[removeItemAtOperation]]. This operation is used to instruct Muster
 * to traverse the `removeItemAt` operation for a given node.
 */
export function removeItemAtOperation(index: number): RemoveItemAtOperation {
  return createGraphOperation(RemoveItemAtOperationType, { index });
}

export function isRemoveItemAtOperation(value: GraphOperation): value is RemoveItemAtOperation {
  return value.type === RemoveItemAtOperationType;
}

export type RemoveItemAttableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'removeItemAt', RemoveItemAtOperation>;

export type RemoveItemAttableGraphNode<
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
  'removeItemAt',
  RemoveItemAtOperation,
  RemoveItemAttableNodeType<T, P, S, D, V>
>;

export type RemoveItemAttableNodeDefinition<
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
  'removeItemAt',
  RemoveItemAtOperation,
  RemoveItemAttableNodeType<T, P, S, D, V>
>;

export function supportsRemoveItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is RemoveItemAttableNodeDefinition<T, P, S, D, V>;
export function supportsRemoveItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is RemoveItemAttableGraphNode<T, P, S, D, V>;
export function supportsRemoveItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is
  | RemoveItemAttableNodeDefinition<T, P, S, D, V>
  | RemoveItemAttableGraphNode<T, P, S, D, V>;
export function supportsRemoveItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is
  | RemoveItemAttableNodeDefinition<T, P, S, D, V>
  | RemoveItemAttableGraphNode<T, P, S, D, V> {
  return supportsOperationType('removeItemAt', node);
}
