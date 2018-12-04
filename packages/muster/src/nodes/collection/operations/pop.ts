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

/**
 * A definition of the `pop` graph operation.
 * See the [[popOperation]] documentation to find out more.
 */
export interface PopOperation extends GraphOperation<'pop', PopProperties> {}

export interface PopProperties {}

/**
 * An implementation of the [[popOperation]].
 * See the [[popOperation]] documentation to find out more.
 */
export const PopOperationType: OperationType<'pop', PopProperties> = createOperationType<
  'pop',
  PopProperties
>('pop', {
  cacheable: false,
  shape: {},
});

/**
 * Creates a new instance of [[popOperation]]. This operation is used to instruct Muster
 * to traverse the `pop` operation for a given node.
 */
export function popOperation(): PopOperation {
  return createGraphOperation(PopOperationType, {});
}

export function isPopOperation(value: GraphOperation): value is PopOperation {
  return value.type === PopOperationType;
}

export type PoptableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'pop', PopOperation>;

export type PoptableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'pop', PopOperation, PoptableNodeType<T, P, S, D, V>>;

export type PoptableNodeDefinition<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeDefinition<T, P, S, D, V, 'pop', PopOperation, PoptableNodeType<T, P, S, D, V>>;

export function supportsPopOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is PoptableNodeDefinition<T, P, S, D, V>;
export function supportsPopOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is PoptableGraphNode<T, P, S, D, V>;
export function supportsPopOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is PoptableNodeDefinition<T, P, S, D, V> | PoptableGraphNode<T, P, S, D, V>;
export function supportsPopOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is PoptableNodeDefinition<T, P, S, D, V> | PoptableGraphNode<T, P, S, D, V> {
  return supportsOperationType('pop', node);
}
