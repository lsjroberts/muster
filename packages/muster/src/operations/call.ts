import {
  DynamicGraphNode,
  DynamicNodeDefinition,
  DynamicNodeType,
  GraphNode,
  GraphOperation,
  NodeData,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  NodeName,
  NodeProperties,
  NodeState,
  OperationType,
  SerializedNodeProperties,
} from '../types/graph';
import createGraphOperation from '../utils/create-graph-operation';
import { createOperationType } from '../utils/create-operation-type';
import { getInvalidTypeErrorMessage } from '../utils/get-invalid-type-error';
import * as graphTypes from '../utils/graph-types';
import supportsOperationType from '../utils/supports-operation-type';
import * as types from '../utils/types';

export type CallArgument = NodeDefinition | GraphNode;
export type CallArgumentArray = Array<CallArgument>;
export type CallArgumentMap = { [name: string]: CallArgument };
export type NodeLikeCallArgument = NodeLike | NodeDefinition | GraphNode;
export type NodeLikeCallArgumentArray = Array<NodeLikeCallArgument>;
export type NodeLikeCallArgumentMap = { [name: string]: NodeLikeCallArgument };

export function isCallArgumentArray(
  value: CallArgumentArray | CallArgumentMap,
): value is CallArgumentArray {
  return Array.isArray(value);
}

export function isCallArgumentMap(
  value: CallArgumentArray | CallArgumentMap,
): value is CallArgumentMap {
  return !Array.isArray(value);
}

export function isNodeLikeCallArgumentArray(
  value: NodeLikeCallArgumentArray | NodeLikeCallArgumentMap,
): value is NodeLikeCallArgumentArray {
  return Array.isArray(value);
}

export function isNodeLikeCallArgumentMap(
  value: NodeLikeCallArgumentArray | NodeLikeCallArgumentMap,
): value is NodeLikeCallArgumentArray {
  return !Array.isArray(value);
}

/**
 * A definition of the `call` graph operation.
 * See the [[callOperation]] documentation to find out more.
 */
export interface CallOperation extends GraphOperation<'call', CallProperties> {}

export interface CallProperties {
  args: CallArgumentArray | CallArgumentMap | undefined;
}

/**
 * An implementation of the [[callOperation]].
 * See the [[callOperation]] documentation to find out more.
 */
export const CallOperationType: OperationType<'call', CallProperties> = createOperationType<
  'call',
  CallProperties
>('call', {
  cacheable: false,
  shape: {
    args: types.optional(
      types.oneOfType([
        types.arrayOf(types.oneOfType([graphTypes.graphNode, graphTypes.nodeDefinition])),
        types.objectOf(types.oneOfType([graphTypes.graphNode, graphTypes.nodeDefinition])),
      ]),
    ),
  },
});

/**
 * Creates a new instance of [[callOperation]]. This operation is used to instruct Muster to
 * traverse the `call` operation for a given node.
 * @param args
 */
export function callOperation(args?: CallArgumentArray | CallArgumentMap): CallOperation {
  return createGraphOperation(CallOperationType, { args });
}

export function isCallOperation(value: GraphOperation): value is CallOperation {
  return value.type === CallOperationType;
}

export type CallableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'call', CallOperation>;

export type CallableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'call', CallOperation, CallableNodeType<T, P, S, D, V>>;

export type CallableNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeDefinition<T, P, S, D, V, 'call', CallOperation, CallableNodeType<T, P, S, D, V>>;

export function supportsCallOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is CallableNodeDefinition<T, P, S, D, V>;
export function supportsCallOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is CallableGraphNode<T, P, S, D, V>;
export function supportsCallOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is CallableNodeDefinition<T, P, S, D, V> | CallableGraphNode<T, P, S, D, V>;
export function supportsCallOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is CallableNodeDefinition<T, P, S, D, V> | CallableGraphNode<T, P, S, D, V> {
  return supportsOperationType('call', node);
}

export const untilSupportsCallOperation: NodeDependency['until'] = {
  predicate: supportsCallOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(`Target node is not callable`, { received: node.definition });
  },
};
