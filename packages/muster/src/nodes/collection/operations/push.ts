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
 * A definition of the `push` graph operation.
 * See the [[pushOperation]] documentation to find out more.
 */
export interface PushOperation extends GraphOperation<'push', PushProperties> {}

export interface PushProperties {
  value: NodeDefinition;
}

/**
 * An implementation of the [[pushOperation]].
 * See the [[pushOperation]] documentation to find out more.
 */
export const PushOperationType: OperationType<'push', PushProperties> = createOperationType<
  'push',
  PushProperties
>('push', {
  cacheable: false,
  shape: {
    value: graphTypes.nodeDefinition,
  },
});

/**
 * Creates a new instance of [[pushOperation]]. This operation is used to instruct Muster
 * to traverse the `push` operation for a given node.
 */
export function pushOperation(value: NodeDefinition): PushOperation {
  return createGraphOperation(PushOperationType, { value });
}

export function isPushOperation(value: GraphOperation): value is PushOperation {
  return value.type === PushOperationType;
}

export type PushtableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'push', PushOperation>;

export type PushtableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'push', PushOperation, PushtableNodeType<T, P, S, D, V>>;

export type PushtableNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeDefinition<T, P, S, D, V, 'push', PushOperation, PushtableNodeType<T, P, S, D, V>>;

export function supportsPushOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is PushtableNodeDefinition<T, P, S, D, V>;
export function supportsPushOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is PushtableGraphNode<T, P, S, D, V>;
export function supportsPushOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is PushtableNodeDefinition<T, P, S, D, V> | PushtableGraphNode<T, P, S, D, V>;
export function supportsPushOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is PushtableNodeDefinition<T, P, S, D, V> | PushtableGraphNode<T, P, S, D, V> {
  return supportsOperationType('push', node);
}
