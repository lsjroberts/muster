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

/**
 * A definition of the `set` graph operation.
 * See the [[setOperation]] documentation to find out more.
 */
export interface SetOperation extends GraphOperation<'set', SetProperties> {}

export interface SetProperties {
  value: NodeDefinition;
}

/**
 * An implementation of the [[setOperation]].
 * See the [[setOperation]] documentation to find out more.
 */
export const SetOperationType: OperationType<'set', SetProperties> = createOperationType<
  'set',
  SetProperties
>('set', {
  cacheable: false,
  shape: {
    value: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of [[setOperation]]. This operation is used to instruct Muster
 * to traverse the `set` operation for a given node.
 */
export function setOperation(value: NodeDefinition): SetOperation {
  return createGraphOperation(SetOperationType, { value });
}

export function isSetOperation(value: GraphOperation): value is SetOperation {
  return value.type === SetOperationType;
}

export type SettableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'set', SetOperation>;

export type SettableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'set', SetOperation, SettableNodeType<T, P, S, D, V>>;

export type SettableNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeDefinition<T, P, S, D, V, 'set', SetOperation, SettableNodeType<T, P, S, D, V>>;

export function supportsSetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is SettableNodeDefinition<T, P, S, D, V>;
export function supportsSetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is SettableGraphNode<T, P, S, D, V>;
export function supportsSetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is SettableNodeDefinition<T, P, S, D, V> | SettableGraphNode<T, P, S, D, V>;
export function supportsSetOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is SettableNodeDefinition<T, P, S, D, V> | SettableGraphNode<T, P, S, D, V> {
  return supportsOperationType('set', node);
}
