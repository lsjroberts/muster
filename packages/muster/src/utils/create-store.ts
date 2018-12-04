import {
  DisposeCallback,
  GraphNode,
  GraphOperation,
  MusterEventSource,
  NodeData,
  NodeName,
  NodeProperties,
  NodeState,
  Scope,
  StatefulGraphNode,
  Store,
} from '../types/graph';
import createGraphAction from './create-graph-action';
import { inspect, SerializedStore } from './inspect';
import {
  createStore as createMusterStore,
  disposeScope,
  getNodeData,
  getNodeState,
  invalidateNode,
  invalidateNodeAction,
  releaseNode,
  releaseNodeAction,
  retainNode,
  retainNodeAction,
  setNodeData,
  setNodeState,
  subscribe,
  UpdateCallback,
} from './store';

export default function createStore(
  events: MusterEventSource,
  options?: {
    debug?: boolean;
  },
): Store {
  const store = createMusterStore(events, options);
  return {
    store,
    subscribe(
      node: GraphNode,
      operation: GraphOperation,
      callback: UpdateCallback,
      options?: { debug?: boolean },
    ): DisposeCallback {
      return subscribe(
        store,
        createGraphAction(node, operation),
        callback,
        Boolean(options && options.debug),
      );
    },
    retain(node: GraphNode, operation?: GraphOperation): number {
      return operation
        ? retainNodeAction(store, createGraphAction(node, operation))
        : retainNode(store, node);
    },
    release(node: GraphNode, operation?: GraphOperation): number {
      return operation
        ? releaseNodeAction(store, createGraphAction(node, operation))
        : releaseNode(store, node);
    },
    invalidate(node: GraphNode, operation?: GraphOperation): boolean {
      return operation
        ? invalidateNodeAction(store, createGraphAction(node, operation))
        : invalidateNode(store, node);
    },
    getNodeData<D extends NodeData>(
      node: StatefulGraphNode<NodeName, NodeProperties, NodeState, D>,
    ): D | undefined {
      return getNodeData(store, node);
    },
    setNodeData<D extends NodeData>(
      node: StatefulGraphNode<NodeName, NodeProperties, NodeState, D>,
      data: D,
    ): void {
      setNodeData(store, node, data);
    },
    getNodeState<S extends NodeState>(
      node: StatefulGraphNode<NodeName, NodeProperties, S>,
    ): S | undefined {
      return getNodeState(store, node);
    },
    setNodeState<S extends NodeState>(
      node: StatefulGraphNode<NodeName, NodeProperties, S>,
      state: S,
    ): void {
      setNodeState(store, node, state);
    },
    disposeScope(scope: Scope): void {
      disposeScope(store, scope);
    },
    inspect(): SerializedStore {
      return inspect(store);
    },
  } as Store;
}
