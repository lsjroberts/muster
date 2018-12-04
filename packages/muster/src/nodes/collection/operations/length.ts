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
 * A definition of the `length` graph operation.
 * See the [[lengthOperation]] documentation to find out more.
 */
export interface LengthOperation extends GraphOperation<'length', LengthProperties> {}

export interface LengthProperties {}

/**
 * An implementation of the [[lengthOperation]].
 * See the [[lengthOperation]] documentation to find out more.
 */
export const LengthOperationType: OperationType<'length', LengthProperties> = createOperationType<
  'length',
  LengthProperties
>('length', {
  cacheable: false,
  shape: {},
});

/**
 * Creates a new instance of [[lengthOperation]]. This operation is used to instruct Muster
 * to traverse the `call` operation for a given node.
 */
export function lengthOperation(): LengthOperation {
  return createGraphOperation(LengthOperationType, {});
}

export function isLengthOperation(value: GraphOperation): value is LengthOperation {
  return value.type === LengthOperationType;
}

export type LengthtableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'length', LengthOperation>;

export type LengthtableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'length', LengthOperation, LengthtableNodeType<T, P, S, D, V>>;

export type LengthtableNodeDefinition<
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
  'length',
  LengthOperation,
  LengthtableNodeType<T, P, S, D, V>
>;

export function supportsLengthOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is LengthtableNodeDefinition<T, P, S, D, V>;
export function supportsLengthOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is LengthtableGraphNode<T, P, S, D, V>;
export function supportsLengthOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is LengthtableNodeDefinition<T, P, S, D, V> | LengthtableGraphNode<T, P, S, D, V>;
export function supportsLengthOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is LengthtableNodeDefinition<T, P, S, D, V> | LengthtableGraphNode<T, P, S, D, V> {
  return supportsOperationType('length', node);
}
