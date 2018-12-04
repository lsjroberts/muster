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

export type RequestMetadata = { [namespace: string]: any };

/**
 * A definition of the `request` graph operation.
 * See the [[requestOperation]] documentation to find out more.
 */
export interface RequestOperation extends GraphOperation<'request', RequestProperties> {}

export interface RequestProperties {
  metadata: RequestMetadata;
  next: GraphNode | undefined;
  query: NodeDefinition;
}

/**
 * An implementation of the [[requestOperation]].
 * See the [[requestOperation]] documentation to find out more.
 */
export const RequestOperationType: OperationType<
  'request',
  RequestProperties
> = createOperationType<'request', RequestProperties>('request', {
  shape: {
    metadata: types.objectOf(types.saveHash(types.any)),
    next: types.optional(graphTypes.graphNode),
    query: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of [[requestOperation]]. This operation is used to instruct Muster
 * to traverse the `request` operation for a given node.
 */
export function requestOperation(
  query: NodeDefinition,
  metadata: RequestMetadata,
  next?: GraphNode,
): RequestOperation {
  return createGraphOperation(RequestOperationType, {
    metadata: metadata || {},
    next,
    query,
  });
}

export function isRequestOperation(value: GraphOperation): value is RequestOperation {
  return value.type === RequestOperationType;
}

export type RequestNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'request', RequestOperation>;

export type RequestGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'request', RequestOperation, RequestNodeType<T, P, S, D, V>>;

export type RequestNodeDefinition<
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
  'request',
  RequestOperation,
  RequestNodeType<T, P, S, D, V>
>;

export function supportsRequestOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is RequestNodeDefinition<T, P, S, D, V>;
export function supportsRequestOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is RequestGraphNode<T, P, S, D, V>;
export function supportsRequestOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is RequestNodeDefinition<T, P, S, D, V> | RequestGraphNode<T, P, S, D, V>;
export function supportsRequestOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is RequestNodeDefinition<T, P, S, D, V> | RequestGraphNode<T, P, S, D, V> {
  return supportsOperationType('request', node);
}
