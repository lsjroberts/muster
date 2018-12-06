import {
  ChildKey,
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
import * as types from '../utils/types';

/**
 * A definition of the `getChild` graph operation.
 * See the [[getChildOperation]] documentation to find out more.
 */
export interface GetChildOperation extends GraphOperation<'getChild', GetChildProperties> {}

export interface GetChildProperties {
  key: ChildKey;
}

/**
 * An implementation of the [[getChildOperation]].
 * See the [[getChildOperation]] documentation to find out more.
 */
export const GetChildOperationType: OperationType<
  'getChild',
  GetChildProperties
> = createOperationType<'getChild', GetChildProperties>('getChild', {
  shape: {
    key: types.optional(types.saveHash(types.any)),
  },
});

/**
 * Creates a new instance of [[getChildOperation]]. This operation is used to instruct Muster to
 * traverse the `getChild` operation for a given node.
 */
export function getChildOperation(key: ChildKey): GetChildOperation {
  return createGraphOperation(GetChildOperationType, { key });
}

export function isGetChildOperation(value: GraphOperation): value is GetChildOperation {
  return value.type === GetChildOperationType;
}

export type ContainerNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'getChild', GetChildOperation>;

export type ContainerGraphNode<
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
  'getChild',
  GetChildOperation,
  ContainerNodeType<T, P, S, D, V>
>;

export type ContainerNodeDefinition<
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
  'getChild',
  GetChildOperation,
  ContainerNodeType<T, P, S, D, V>
>;

export function supportsGetChildOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ContainerNodeDefinition<T, P, S, D, V>;
export function supportsGetChildOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ContainerGraphNode<T, P, S, D, V>;
export function supportsGetChildOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ContainerNodeDefinition<T, P, S, D, V> | ContainerGraphNode<T, P, S, D, V>;
export function supportsGetChildOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ContainerNodeDefinition<T, P, S, D, V> | ContainerGraphNode<T, P, S, D, V> {
  return supportsOperationType('getChild', node);
}
