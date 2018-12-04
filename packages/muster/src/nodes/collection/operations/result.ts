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
 * A definition of the `result` graph operation.
 * See the [[resultOperation]] documentation to find out more.
 */
export interface ResultOperation<T> extends GraphOperation<'result', ResultProperties<T>> {}

export interface ResultProperties<T> {
  acc: T;
  next: GraphNode | undefined;
}

/**
 * An implementation of the [[resultOperation]].
 * See the [[resultOperation]] documentation to find out more.
 */
export const ResultOperationType: OperationType<
  'result',
  ResultProperties<any>
> = createOperationType<'result', ResultProperties<any>>('result', {
  shape: {
    acc: types.saveHash(types.any),
    next: types.optional(graphTypes.graphNode),
  },
});

/**
 * Creates a new instance of [[resultOperation]]. This operation is used to instruct Muster
 * to traverse the `result` operation for a given node.
 */
export function result<T>(acc: T, next?: GraphNode): ResultOperation<T> {
  return createGraphOperation(ResultOperationType, {
    acc,
    next,
  });
}

export function isResultOperation<T>(value: GraphOperation): value is ResultOperation<T> {
  return value.type === ResultOperationType;
}

export type ResultableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'result', ResultOperation<any>>;

export type ResultableGraphNode<
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
  'result',
  ResultOperation<any>,
  ResultableNodeType<T, P, S, D, V>
>;

export type ResultableNodeDefinition<
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
  'result',
  ResultOperation<any>,
  ResultableNodeType<T, P, S, D, V>
>;

export function supportsResultOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ResultableNodeDefinition<T, P, S, D, V>;
export function supportsResultOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ResultableGraphNode<T, P, S, D, V>;
export function supportsResultOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ResultableNodeDefinition<T, P, S, D, V> | ResultableGraphNode<T, P, S, D, V>;
export function supportsResultOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ResultableNodeDefinition<T, P, S, D, V> | ResultableGraphNode<T, P, S, D, V> {
  return supportsOperationType('result', node);
}
