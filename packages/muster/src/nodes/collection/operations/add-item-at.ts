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
import * as types from '../../../utils/types';

/**
 * A definition of the `addItemAt` graph operation.
 * See the [[addItemAtOperation]] documentation to find out more.
 */
export interface AddItemAtOperation extends GraphOperation<'addItemAt', AddItemAtProperties> {}

export interface AddItemAtProperties {
  index: number;
  value: NodeDefinition;
}

/**
 * An implementation of the [[addItemAtOperation]].
 * See the [[addItemAtOperation]] documentation to find out more.
 */
export const AddItemAtOperationType: OperationType<
  'addItemAt',
  AddItemAtProperties
> = createOperationType<'addItemAt', AddItemAtProperties>('addItemAt', {
  cacheable: false,
  shape: {
    index: types.number,
    value: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of [[addItemAtOperation]]. This operation is used to instruct Muster
 * to traverse the `addItemAt` operation for a given node.
 */
export function addItemAtOperation(value: NodeDefinition, index: number): AddItemAtOperation {
  return createGraphOperation(AddItemAtOperationType, { index, value });
}

export function isAddItemAtOperation(value: GraphOperation): value is AddItemAtOperation {
  return value.type === AddItemAtOperationType;
}

export type AddItemAttableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'addItemAt', AddItemAtOperation>;

export type AddItemAttableGraphNode<
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
  'addItemAt',
  AddItemAtOperation,
  AddItemAttableNodeType<T, P, S, D, V>
>;

export type AddItemAttableNodeDefinition<
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
  'addItemAt',
  AddItemAtOperation,
  AddItemAttableNodeType<T, P, S, D, V>
>;

export function supportsAddItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is AddItemAttableNodeDefinition<T, P, S, D, V>;
export function supportsAddItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is AddItemAttableGraphNode<T, P, S, D, V>;
export function supportsAddItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is AddItemAttableNodeDefinition<T, P, S, D, V> | AddItemAttableGraphNode<T, P, S, D, V>;
export function supportsAddItemAtOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is AddItemAttableNodeDefinition<T, P, S, D, V> | AddItemAttableGraphNode<T, P, S, D, V> {
  return supportsOperationType('addItemAt', node);
}
