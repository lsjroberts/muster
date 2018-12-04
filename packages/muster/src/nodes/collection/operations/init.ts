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
 * A definition of the `init` graph operation.
 * See the [[initOperation]] documentation to find out more.
 */
export interface InitOperation extends GraphOperation<'init', InitProperties> {}

export interface InitProperties {
  next: GraphNode | undefined;
}

/**
 * An implementation of the [[initOperation]].
 * See the [[initOperation]] documentation to find out more.
 */
export const InitOperationType: OperationType<'init', InitProperties> = createOperationType<
  'init',
  InitProperties
>('init', {
  shape: {
    next: types.optional(graphTypes.graphNode),
  },
});

/**
 * Creates a new instance of [[initOperation]]. This operation is used to instruct Muster
 * to traverse the `init` operation for a given node.
 */
export function init(next?: GraphNode): InitOperation {
  return createGraphOperation(InitOperationType, {
    next,
  });
}

export function isInitOperation(value: GraphOperation): value is InitOperation {
  return value.type === InitOperationType;
}

export type InitableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'init', InitOperation>;

export type InitableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'init', InitOperation, InitableNodeType<T, P, S, D, V>>;

export type InitableNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeDefinition<T, P, S, D, V, 'init', InitOperation, InitableNodeType<T, P, S, D, V>>;

export function supportsInitOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is InitableNodeDefinition<T, P, S, D, V>;
export function supportsInitOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is InitableGraphNode<T, P, S, D, V>;
export function supportsInitOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is InitableNodeDefinition<T, P, S, D, V> | InitableGraphNode<T, P, S, D, V>;
export function supportsInitOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is InitableNodeDefinition<T, P, S, D, V> | InitableGraphNode<T, P, S, D, V> {
  return supportsOperationType('init', node);
}
