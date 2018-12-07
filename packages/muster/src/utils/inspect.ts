import flatMap from 'lodash/flatMap';
import fromPairs from 'lodash/fromPairs';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import { array } from '../nodes/collection/array';
import { isNodeListNodeDefinition } from '../nodes/collection/node-list';
import {
  DynamicNodeType,
  GraphAction,
  GraphNode,
  GraphOperation,
  isGraphAction,
  isGraphNode,
  isGraphOperation,
  isMatcher,
  isNodeDefinition,
  NodeData,
  NodeDefinition,
  NodeName,
  NodeProperties,
  NodeState,
  NodeType,
  OperationName,
  OperationProperties,
  SerializedGraphOperation,
  SerializedNodeDefinition,
  SerializedNodeProperties,
  SerializedOperationProperties,
} from '../types/graph';
import { sanitizeMusterType } from './serialize';
import {
  ActionCache,
  ActionId,
  CachedAction,
  CachedActionId,
  ContextId,
  NodeId,
  OperationId,
  ScopeId,
  Store,
} from './store';
import { getMusterNodeTypesMap } from './types-registry';

export { ActionId, CachedActionId, ContextId, NodeId, OperationId, ScopeId } from './store';

export type SerializedNodeType = {
  operations: Array<string>;
};
export type SerializedNodeTypesMap = { [nodeTypeName: string]: SerializedNodeType };

export interface SerializedStore {
  subscriptions: Array<SerializedSubscription>;
  cache: {
    nodes: {
      [nodeId: string]: SerializedGraphNode;
    };
    operations: {
      [operationId: string]: SerializedGraphOperation;
    };
    actions: {
      [actionId: string]: SerializedActionCache;
    };
    cache: {
      [cachedActionId: string]: SerializedCachedAction;
    };
  };
  nodeTypes: SerializedNodeTypesMap;
}

export type SerializedActionCache = {
  action: SerializedGraphAction;
} & (
  | {
      cacheable: true;
      instance: CachedActionId;
      instances: undefined;
    }
  | {
      cacheable: false;
      instance: undefined;
      instances: Array<CachedActionId>;
    });

export interface SerializedGraphNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends NodeType<T, P, any, V> = NodeType<T, P, any, V>
> {
  id: NodeId;
  scope: SerializedScope;
  context: SerializedContext;
  definition: SerializedNodeDefinition<T, P, V, N>;
}

export type SerializedSubscription = { action: ActionId; debug: boolean };
export type SerializedScope = ScopeId;
export type SerializedContext = ContextId;

export interface SerializedGraphAction {
  id: ActionId;
  node: NodeId;
  operation: OperationId;
}

export interface SerializedCachedAction {
  id: CachedActionId;
  action: ActionId;
  contextDependencies: Array<CachedActionId>;
  dependencies: Array<CachedActionId>;
  dependants: Array<CachedActionId>;
  next: CachedActionId | undefined;
  value: NodeId | undefined;
}

const nodeTypes = mapValues(getMusterNodeTypesMap(), (nodeType) => ({
  operations: Object.keys((nodeType as DynamicNodeType).operations || {}),
}));

export function inspect(store: Store): SerializedStore {
  const actionCaches = Array.from(store.actions.values());
  const cachedActions = flatMap(actionCaches, (actionCache) =>
    actionCache.cacheable ? [actionCache.instance] : actionCache.instances,
  );
  const actions = actionCaches.map(({ action }) => action);
  const actionResults = flatMap(actionCaches, (actionCache) =>
    flatMap(
      actionCache.cacheable ? [actionCache.instance] : actionCache.instances,
      (cachedAction) => (cachedAction.value ? [cachedAction.value] : []),
    ),
  );
  const nodesById = fromPairs([
    ...actions.map(({ node }) => [node.id, sanitizeGraphNode(node)]),
    ...actionResults.map((node) => [node.id, sanitizeGraphNode(node)]),
  ]);
  const operationsById = fromPairs(
    actions.map(({ operation }) => [operation.id, sanitizeGraphOperation(operation)]),
  );
  const actionCachesById = fromPairs(
    actionCaches.map((actionCache) => [actionCache.action.id, sanitizeActionCache(actionCache)]),
  );
  const cachedActionsById = fromPairs(
    cachedActions.map((cachedAction) => [cachedAction.id, sanitizeCachedAction(cachedAction)]),
  );
  const subscriptions = Array.from(store.subscriptions.entries()).map(
    ([actionId, subscriptions]) => ({
      action: actionId,
      debug: subscriptions.some(({ debug }) => debug),
    }),
  );
  return {
    subscriptions,
    cache: {
      nodes: nodesById,
      operations: operationsById,
      actions: actionCachesById,
      cache: cachedActionsById,
    },
    nodeTypes,
  };
}

function sanitizeActionCache(actionCache: ActionCache): SerializedActionCache {
  if (actionCache.cacheable) {
    return {
      cacheable: true,
      action: sanitizeGraphAction(actionCache.action),
      instance: actionCache.instance.id,
      instances: undefined,
    };
  }
  return {
    cacheable: false,
    action: sanitizeGraphAction(actionCache.action),
    instance: undefined,
    instances: actionCache.instances.map(({ id }) => id),
  };
}

export function serializeMetadata(
  value: NodeDefinition | GraphOperation | GraphNode | GraphAction,
): string {
  return JSON.stringify(sanitizeMetadata(value));
}

function isSanitizable(
  value: any,
): value is NodeDefinition | GraphOperation | GraphNode | GraphAction {
  return (
    isNodeDefinition(value) || isGraphOperation(value) || isGraphNode(value) || isGraphAction(value)
  );
}

export function sanitizeMetadata(value: any): any {
  if (isGraphOperation(value)) return sanitizeGraphOperation(value);
  if (isGraphNode(value)) return sanitizeGraphNode(value);
  if (isGraphAction(value)) return sanitizeGraphAction(value);
  if (isNodeDefinition(value)) return sanitizeNodeDefinition(value);
  if (isMatcher(value)) return sanitizeMusterType(value);
  if (typeof value === 'function') return undefined;
  if (typeof value === 'symbol') return value.toString();
  return value;
}

function sanitizeNodeDefinition(node: NodeDefinition): SerializedNodeDefinition {
  // TODO: Remove this hack once collections are refactored
  if (isNodeListNodeDefinition(node)) {
    return sanitizeMetadata(array(node.properties.items.map((item) => item.definition)));
  }
  return {
    $type: node.type.name,
    data: sanitizeNodeProperties(node),
  };
}

function sanitizeNodeProperties<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition<T, P, S, D, V>): V {
  const nodeType = node.type;
  if (nodeType.serialize === false) {
    return {} as V;
  }
  if (nodeType.serialize) {
    return nodeType.serialize(node.properties, sanitizeMetadata);
  }
  return mapValues(node.properties, (value, key) => {
    if (isSanitizable(value)) return sanitizeMetadata(value);
    if (Array.isArray(value)) {
      return value.map((child: any) =>
        isSanitizable(child) ? sanitizeMetadata(child) : sanitizeObject(child),
      );
    }
    if (typeof value === 'function') {
      return undefined;
    }
    if (typeof value === 'symbol') return value.toString();
    if (isGraphNode(value)) {
      return undefined;
    }
    return sanitizeObject(value);
  }) as { [K in keyof V]: V[K] };
}

function sanitizeGraphOperation(operation: GraphOperation): SerializedGraphOperation {
  return {
    $operation: operation.type.name,
    id: operation.id,
    data: sanitizeGraphOperationProperties(operation),
  };
}

function sanitizeGraphOperationProperties<
  T extends OperationName,
  P extends OperationProperties,
  S extends SerializedOperationProperties = P
>(operation: GraphOperation<T, P, S>): S {
  const operationType = operation.type;
  if (operationType.serialize === false) {
    return {} as S;
  }
  if (operationType.serialize) {
    return operationType.serialize(operation.properties, sanitizeMetadata);
  }
  return mapValues(operation.properties, (value, key) => {
    if (isSanitizable(value)) return sanitizeMetadata(value);
    if (Array.isArray(value)) {
      return value.map((child: any) =>
        isSanitizable(child) ? sanitizeMetadata(child) : sanitizeObject(child),
      );
    }
    if (typeof value === 'function') {
      return undefined;
    }
    if (isGraphNode(value)) {
      return undefined;
    }
    return sanitizeObject(value);
  }) as { [K in keyof S]: S[K] };
}

function sanitizeGraphNode(node: GraphNode): SerializedGraphNode {
  return {
    id: node.id,
    scope: node.scope.id,
    context: node.context.id,
    definition: sanitizeNodeDefinition(node.definition),
  };
}

function sanitizeGraphAction(action: GraphAction): SerializedGraphAction {
  return {
    id: action.id,
    node: action.node.id,
    operation: action.operation.id,
  };
}

function sanitizeCachedAction(cachedAction: CachedAction): SerializedCachedAction {
  return {
    id: cachedAction.id,
    action: cachedAction.action.id,
    contextDependencies: cachedAction.contextDependencies.map(({ target }) => target.id),
    dependencies: cachedAction.dependencies.map(({ target }) => target.id),
    dependants: cachedAction.dependants.map(({ id }) => id),
    next: cachedAction.next && cachedAction.next.id,
    value: cachedAction.value && cachedAction.value.id,
  };
}

function sanitizeObject(value: any, visited: Set<object> = new Set()): any {
  if (visited.has(value)) {
    return '[Circular]';
  }
  if (isSanitizable(value)) {
    return sanitizeMetadata(value);
  }
  if (typeof value === 'function') return undefined;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value !== 'object' || value === null) return value;
  const nextVisited = new Set(visited.add(value));
  if (Array.isArray(value)) {
    return value.map((child) => sanitizeObject(child, nextVisited));
  }
  if (!isPlainObject(value)) {
    return `[object ${value.constructor.name}]`;
  }
  return mapValues(value, (child) => sanitizeObject(child, nextVisited));
}
