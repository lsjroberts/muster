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
 * A definition of the `step` graph operation.
 * See the [[stepOperation]] documentation to find out more.
 */
export interface StepOperation<T> extends GraphOperation<'step', StepProperties<T>> {}

export interface StepProperties<T> {
  acc: T;
  item: GraphNode;
  next: GraphNode | undefined;
}

/**
 * An implementation of the [[stepOperation]].
 * See the [[stepOperation]] documentation to find out more.
 */
export const StepOperationType: OperationType<'step', StepProperties<any>> = createOperationType<
  'step',
  StepProperties<any>
>('step', {
  shape: {
    acc: types.optional(types.saveHash(types.any)),
    item: graphTypes.graphNode,
    next: types.optional(graphTypes.graphNode),
  },
});

/**
 * Creates a new instance of [[stepOperation]]. This operation is used to instruct Muster
 * to traverse the `call` operation for a given node.
 */
export function step<T>(acc: T, item: GraphNode, next?: GraphNode): StepOperation<T> {
  return createGraphOperation(StepOperationType, {
    acc,
    item,
    next,
  });
}

export function isStepOperation<T>(value: GraphOperation): value is StepOperation<T> {
  return value.type === StepOperationType;
}

export type SteppableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'step', StepOperation<any>>;

export type SteppableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'step', StepOperation<any>, SteppableNodeType<T, P, S, D, V>>;

export type SteppableNodeDefinition<
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
  'step',
  StepOperation<any>,
  SteppableNodeType<T, P, S, D, V>
>;

export function supportsStepOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is SteppableNodeDefinition<T, P, S, D, V>;
export function supportsStepOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is SteppableGraphNode<T, P, S, D, V>;
export function supportsStepOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is SteppableNodeDefinition<T, P, S, D, V> | SteppableGraphNode<T, P, S, D, V>;
export function supportsStepOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is SteppableNodeDefinition<T, P, S, D, V> | SteppableGraphNode<T, P, S, D, V> {
  return supportsOperationType('step', node);
}
