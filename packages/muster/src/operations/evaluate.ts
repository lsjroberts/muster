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
import supportsOperationType from '../utils/supports-operation-type';

/**
 * A definition of the `evaluate` graph operation.
 * See the [[evaluateOperation]] documentation to find out more.
 */
export interface EvaluateOperation extends GraphOperation<'evaluate'> {}

/**
 * An implementation of the [[evaluateOperation]].
 * See the [[evaluateOperation]] documentation to find out more.
 */
export const EvaluateOperationType: OperationType<'evaluate'> = createOperationType<'evaluate'>(
  'evaluate',
);

let instance: EvaluateOperation | undefined;

/**
 * Creates a new instance of [[evaluateOperation]]. This operation is used to instruct Muster to
 * traverse the `evaluate` operation for a given node.
 */
export function evaluateOperation(): EvaluateOperation {
  return instance || (instance = createGraphOperation(EvaluateOperationType));
}

export function isEvaluateOperation(value: GraphOperation): value is EvaluateOperation {
  return value.type === EvaluateOperationType;
}

export type EvaluableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'evaluate', EvaluateOperation>;

export type EvaluableGraphNode<
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
  'evaluate',
  EvaluateOperation,
  EvaluableNodeType<T, P, S, D, V>
>;

export type EvaluableNodeDefinition<
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
  'evaluate',
  EvaluateOperation,
  EvaluableNodeType<T, P, S, D, V>
>;

export function supportsEvaluateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is EvaluableNodeDefinition<T, P, S, D, V>;
export function supportsEvaluateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is EvaluableGraphNode<T, P, S, D, V>;
export function supportsEvaluateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is EvaluableNodeDefinition<T, P, S, D, V> | EvaluableGraphNode<T, P, S, D, V>;
export function supportsEvaluateOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is EvaluableNodeDefinition<T, P, S, D, V> | EvaluableGraphNode<T, P, S, D, V> {
  return supportsOperationType('evaluate', node);
}
