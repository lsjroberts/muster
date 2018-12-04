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
import * as types from '../utils/types';

/**
 * A definition of the `resolve` graph operation.
 * See the [[resolveOperation]] documentation to find out more.
 */
export interface ResolveOperation extends GraphOperation<'resolve', ResolveProperties> {}

export interface ResolveProperties {
  until:
    | {
        predicate: (node: GraphNode) => boolean;
        errorMessage: (node: GraphNode) => string;
      }
    | undefined;
  allowErrors: boolean;
  allowPending: boolean;
  acceptNil: boolean;
}

/**
 * An implementation of the [[resolveOperation]].
 * See the [[resolveOperation]] documentation to find out more.
 */
export const ResolveOperationType: OperationType<
  'resolve',
  ResolveProperties
> = createOperationType<'resolve', ResolveProperties>('resolve', {
  shape: {
    until: types.optional(
      types.shape({
        predicate: types.saveHash(types.func),
        errorMessage: types.saveHash(types.func),
      }),
    ),
    allowErrors: types.bool,
    allowPending: types.bool,
    acceptNil: types.bool,
  },
});

const CACHED_INSTANCES = [
  // TODO: Cleanup the `as ResolveProperties`
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: false,
    allowPending: false,
    acceptNil: false,
  } as ResolveProperties),
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: false,
    allowPending: false,
    acceptNil: true,
  } as ResolveProperties),
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: false,
    allowPending: true,
    acceptNil: false,
  } as ResolveProperties),
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: false,
    allowPending: true,
    acceptNil: true,
  } as ResolveProperties),
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: true,
    allowPending: false,
    acceptNil: false,
  } as ResolveProperties),
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: true,
    allowPending: false,
    acceptNil: true,
  } as ResolveProperties),
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: true,
    allowPending: true,
    acceptNil: false,
  } as ResolveProperties),
  createGraphOperation(ResolveOperationType, {
    until: undefined,
    allowErrors: true,
    allowPending: true,
    acceptNil: true,
  } as ResolveProperties),
];

/**
 * Creates a new instance of [[resolveOperation]]. This operation is used to instruct Muster
 * to traverse the `resolve` operation for a given node.
 */
export function resolveOperation(options?: {
  until?: {
    predicate: (node: GraphNode) => boolean;
    errorMessage: (node: GraphNode) => string;
  };
  allowErrors: boolean;
  allowPending: boolean;
  acceptNil: boolean;
}): ResolveOperation {
  if (!options) {
    return CACHED_INSTANCES[0];
  }
  const allowErrors = options.allowErrors;
  const allowPending = options.allowPending;
  const acceptNil = options.acceptNil;
  if (!options.until) {
    return CACHED_INSTANCES[
      ((allowErrors as any) << 1) | ((allowPending as any) << 1) | (acceptNil as any)
    ];
  }
  return createGraphOperation(ResolveOperationType, {
    until: options.until,
    allowErrors,
    allowPending,
    acceptNil,
  } as ResolveProperties);
}

export function isResolveOperation(value: GraphOperation): value is ResolveOperation {
  return value.type === ResolveOperationType;
}

export type ResolvableNodeType<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicNodeType<T, P, S, D, V, 'resolve', ResolveOperation>;

export type ResolvableGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
> = DynamicGraphNode<T, P, S, D, V, 'resolve', ResolveOperation, ResolvableNodeType<T, P, S, D, V>>;

export type ResolvableNodeDefinition<
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
  'resolve',
  ResolveOperation,
  ResolvableNodeType<T, P, S, D, V>
>;

export function supportsResolveOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition): node is ResolvableNodeDefinition<T, P, S, D, V>;
export function supportsResolveOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: GraphNode): node is ResolvableGraphNode<T, P, S, D, V>;
export function supportsResolveOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ResolvableNodeDefinition<T, P, S, D, V> | ResolvableGraphNode<T, P, S, D, V>;
export function supportsResolveOperation<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(
  node: NodeDefinition | GraphNode,
): node is ResolvableNodeDefinition<T, P, S, D, V> | ResolvableGraphNode<T, P, S, D, V> {
  return supportsOperationType('resolve', node);
}
