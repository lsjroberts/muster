/* tslint:disable:no-increment-decrement */
import { TRANSACTION_END, TRANSACTION_START } from '../events';
import { error, ErrorNode, ErrorNodeType } from '../nodes/graph/error';
import { getPath } from '../nodes/graph/get';
import { NilNodeType } from '../nodes/graph/nil';
import { PendingNode, PendingNodeType } from '../nodes/graph/pending';
import { evaluateOperation, supportsEvaluateOperation } from '../operations/evaluate';
import { isIdentityOperation } from '../operations/identity';
import { isResolveOperation } from '../operations/resolve';
import {
  ContextDependency,
  Dependency,
  GraphAction,
  GraphNode,
  isGraphAction,
  isGraphNode,
  MusterEventSource,
  NodeData,
  NodeName,
  NodeProperties,
  NodeState,
  Scope,
  StatefulGraphNode,
} from '../types/graph';
import createGraphAction from './create-graph-action';
import formatPath from './format-path';
import getType from './get-type';
import { addHashSetItem, createHashSet, HashSet, hashSetContains, mergeHashSets } from './hash-set';
import isDynamicNodeType from './is-dynamic-node-type';
import { isStatefulNode } from './is-stateful-node';
import parseContextDependency from './parse-context-dependency';
import pascalCase from './pascal-case';
import { createStack, getStackItems, pushStackItem, Stack } from './stack';
import supportsOperationType from './supports-operation-type';
import { WILDCARD_OPERATION } from './wildcard-operation';
import withScopeFrom from './with-scope-from';

export type ScopeId = string;
export type ContextId = string;
export type NodeId = string;
export type OperationId = string;
export type ActionId = NodeId & OperationId;
export type CachedActionId = number;
export type UpdateCallback = (value: GraphNode) => void;
export type DisposeCallback = () => void;

export interface Store {
  debug: boolean;
  scopes: Map<ScopeId, ScopeCache>;
  nodes: Map<NodeId, NodeCache>;
  actions: Map<ActionId, ActionCache>;
  instances: Map<CachedActionId, CachedAction>;
  resolverQueue: Queue<QueuedAction>;
  invalidationQueue: Queue<CachedAction>;
  isFlushing: boolean;
  isInvalidating: boolean;
  subscriptions: Map<ActionId, Array<Subscription>>;
  events: MusterEventSource;
}

export interface ScopeCache {
  scope: Scope;
  retainCount: number;
  childScopes: Array<ScopeCache>;
  nodes: Array<NodeCache>;
}

export interface NodeCache {
  node: GraphNode;
  state: NodeState | undefined;
  data: NodeData | undefined;
  retainCount: number;
  instances: Array<CachedAction>;
}

export type ActionCache = {
  action: GraphAction;
} & (
  | {
      cacheable: true;
      instance: CachedAction;
      instances: undefined;
    }
  | {
      cacheable: false;
      instance: undefined;
      instances: Array<CachedAction>;
    });

export interface GraphDependency {
  target: GraphAction;
  allowErrors: boolean;
  allowPending: boolean;
  invalidate: boolean;
}

export interface CachedDependency {
  target: CachedAction;
  allowErrors: boolean;
  allowPending: boolean;
  invalidate: boolean;
}

export interface CachedAction {
  id: CachedActionId;
  action: GraphAction;
  cacheable: boolean;
  contextDependencies: Array<CachedDependency>;
  dependencies: Array<CachedDependency>;
  dependants: Array<CachedAction>;
  next: CachedAction | undefined;
  value: GraphNode | undefined;
  dependencyValues: Array<GraphNode> | undefined;
  previousResult: GraphNode | GraphAction | undefined;
  retainCount: number;
  queuedAction: QueuedAction | undefined;
  isInvalidating: boolean;
  isAwaitingOnInvalidate: boolean;
}

export interface QueuedAction {
  target: CachedAction;
  dependencyStack: number | Stack<CachedAction>;
  dependantStack: number | Stack<CachedAction>;
  visitedDependencies: HashSet | undefined;
  visitedDependants: HashSet | undefined;
}

export interface Subscription {
  callback: UpdateCallback;
  debug: boolean;
}

export interface Queue<T> {
  push(item: T): void;
  shift(): T | undefined;
  pop(): T | undefined;
  unshift(item: T): void;
  head: QueueItem<T> | undefined;
  tail: QueueItem<T> | undefined;
  length: number;
}

const MAX_STACK_SIZE = 512;
// Leave this value at a high value, as currently the collections love to create a lot of operations.
// On a macbook pro this value should be reached within a few seconds
const MAX_OPERATION_COUNT = 9999999;

export interface QueueItem<T> {
  next: QueueItem<T> | undefined;
  previous: QueueItem<T> | undefined;
  value: T;
}

function createQueue<T>(item?: T): Queue<T> {
  const initialItemNode = item ? createQueueItem(item) : undefined;
  const queue: Queue<T> & { head: QueueItem<T> | undefined; tail: QueueItem<T> | undefined } = {
    length: item ? 1 : 0,
    head: initialItemNode,
    tail: initialItemNode,
    push(item: T) {
      const itemNode = createQueueItem(item);
      if (queue.length === 0) {
        queue.head = itemNode;
        queue.tail = itemNode;
      } else {
        queue.tail!.next = itemNode;
        itemNode.previous = queue.tail;
        queue.tail = itemNode;
      }
      queue.length++;
    },
    shift(): T | undefined {
      if (queue.length === 0) return undefined;
      const itemNode = queue.head!;
      if (queue.length === 1) {
        queue.head = undefined;
        queue.tail = undefined;
      } else {
        const nextItemNode = itemNode.next!;
        nextItemNode.previous = undefined;
        itemNode.next = undefined;
        queue.head = nextItemNode;
      }
      queue.length--;
      return itemNode.value;
    },
    pop(): T | undefined {
      if (queue.length === 0) return undefined;
      const itemNode = queue.tail!;
      if (queue.length === 1) {
        queue.head = undefined;
        queue.tail = undefined;
      } else {
        const previousItemNode = itemNode.previous!;
        previousItemNode.next = undefined;
        itemNode.previous = undefined;
        queue.tail = previousItemNode;
      }
      queue.length--;
      return itemNode.value;
    },
    unshift(item: T): void {
      const itemNode = createQueueItem(item);
      if (queue.length === 0) {
        queue.head = itemNode;
        queue.tail = itemNode;
      } else {
        queue.head!.previous = itemNode;
        itemNode.next = queue.head!;
        queue.head = itemNode;
      }
      queue.length++;
    },
  };
  return queue;
}

function createQueueItem<T>(value: T): QueueItem<T> {
  return {
    next: undefined,
    previous: undefined,
    value,
  };
}

const EMPTY_STACK = createStack<CachedAction>();
const EMPTY_HASH_SET = createHashSet();

export function createStore(
  events: MusterEventSource,
  options?: {
    debug?: boolean;
  },
): Store {
  return {
    debug: Boolean(options && options.debug),
    scopes: new Map(),
    nodes: new Map(),
    actions: new Map(),
    instances: new Map(),
    resolverQueue: createQueue<QueuedAction>(),
    invalidationQueue: createQueue<CachedAction>(),
    isFlushing: false,
    isInvalidating: false,
    subscriptions: new Map(),
    events,
  };
}

export function subscribe(
  store: Store,
  action: GraphAction,
  callback: UpdateCallback,
  debug: boolean,
): DisposeCallback {
  const subscription = { callback, debug };
  const existingSubscriptions = getSubscriptions(store, action);
  let subscriptions: Array<Subscription>;
  if (existingSubscriptions) {
    subscriptions = existingSubscriptions;
    subscriptions.push(subscription);
  } else {
    subscriptions = [subscription];
    store.subscriptions.set(action.id, subscriptions);
  }
  // Ensure cache entries exist for the action and all its dependencies
  const target = retrieveCachedAction(
    store,
    action,
    store.debug ? EMPTY_STACK : 0,
    store.debug ? EMPTY_HASH_SET : undefined,
    store.debug ? EMPTY_STACK : 0,
    store.debug ? EMPTY_HASH_SET : undefined,
  );
  // Increase the action's subscription count
  retainCachedNodeAction(store, target);
  if (target.value) {
    // There is already a cached value for this action, so invoke the callback immediately
    callback(target.value);
  } else {
    // The action's value has not yet been resolved, so queue up a resolution
    flush(store);
  }
  return once(() => {
    releaseCachedNodeAction(store, target);
    subscriptions.splice(subscriptions.indexOf(subscription), 1);
    if (subscriptions.length === 0) {
      store.subscriptions.delete(action.id);
    }
  });
}

export function getNodeData<D extends NodeData>(
  store: Store,
  node: StatefulGraphNode<NodeName, NodeProperties, NodeState, D>,
): D | undefined {
  const nodeCache = getNodeCache(store, node);
  return nodeCache && (nodeCache.data as D | undefined);
}

export function setNodeData<D extends NodeData>(
  store: Store,
  node: StatefulGraphNode<NodeName, NodeProperties, NodeState, D>,
  data: D,
): void {
  const nodeCache = getNodeCache(store, node);
  if (!nodeCache) {
    return;
  }
  nodeCache.data = data;
}

export function getNodeState<S extends NodeState>(
  store: Store,
  node: StatefulGraphNode<NodeName, NodeProperties, S, NodeData>,
): NodeState | undefined {
  const nodeCache = getNodeCache(store, node);
  return nodeCache && (nodeCache.state as S | undefined);
}

export function setNodeState<S extends NodeState>(
  store: Store,
  node: StatefulGraphNode<NodeName, NodeProperties, S, NodeData>,
  state: NodeState,
): void {
  const nodeCache = getNodeCache(store, node);
  if (!nodeCache) {
    return;
  }
  nodeCache.state = state;
  // Invalidate all active operations for this node
  for (let i = 0; i < nodeCache.instances.length; i++) {
    invalidateCachedAction(store, nodeCache.instances[i], false);
  }
  flushInvalidations(store);
  flush(store);
}

export function invalidateNode(store: Store, node: GraphNode): boolean {
  const nodeCache = getNodeCache(store, node);
  if (!nodeCache) {
    return false;
  }
  // Invalidate all active operations for this node
  for (let i = 0; i < nodeCache.instances.length; i++) {
    const cachedAction = nodeCache.instances[i];
    invalidateCachedAction(store, cachedAction, true);
  }
  flushInvalidations(store);
  flush(store);
  return true;
}

export function invalidateNodeAction(store: Store, action: GraphAction): boolean {
  const actionCache = getActionCache(store, action);
  if (!actionCache) {
    return false;
  }
  // Recursively invalidate the action and any cached results
  if (actionCache.cacheable) {
    invalidateCachedAction(store, actionCache.instance, true);
  } else {
    for (let i = 0; i < actionCache.instances.length; i++) {
      invalidateCachedAction(store, actionCache.instances[i], true);
    }
  }
  flushInvalidations(store);
  flush(store);
  return true;
}

export function disposeScope(store: Store, scope: Scope): void {
  const scopeCache = getScopeCache(store, scope);
  if (!scopeCache) {
    return;
  }
  disposeCachedScope(store, scopeCache);
}

function invalidateCachedAction(
  store: Store,
  cachedAction: CachedAction,
  isInvalidating: boolean,
): void {
  const isAlreadyInvalidating =
    cachedAction.isInvalidating && !(isInvalidating && !cachedAction.isAwaitingOnInvalidate);
  if (isAlreadyInvalidating) {
    return;
  }
  // Invalidate the action
  queueInvalidation(store, cachedAction, isInvalidating);
  // Invalidate the action's dependants
  const dependants = cachedAction.dependants;
  for (let i = 0; i < dependants.length; i++) {
    invalidateCachedAction(store, dependants[i], isInvalidating);
  }
  // If this is a full invalidation (not setState), invalidate the action's dependencies and result
  if (isInvalidating) {
    const dependencies = cachedAction.dependencies;
    for (let i = 0; i < dependencies.length; i++) {
      const dependency = dependencies[i];
      if (dependency.invalidate) {
        invalidateCachedAction(store, dependency.target, isInvalidating);
      }
    }
    if (cachedAction.next) {
      invalidateCachedAction(store, cachedAction.next, isInvalidating);
    } else if (cachedAction.value) {
      const nodeCache = getNodeCache(store, cachedAction.value);
      if (nodeCache) {
        // Invalidate all active operations for the cached action value
        for (let i = 0; i < nodeCache.instances.length; i++) {
          const cachedAction = nodeCache.instances[i];
          invalidateCachedAction(store, cachedAction, true);
        }
      }
    }
  }
  // Ensure the action's value is recomputed
  queueCachedAction(
    store,
    cachedAction,
    false,
    store.debug ? EMPTY_STACK : 0,
    store.debug ? EMPTY_HASH_SET : undefined,
    store.debug ? EMPTY_STACK : 0,
    store.debug ? EMPTY_HASH_SET : undefined,
  );
}

function flushInvalidations(store: Store): void {
  if (store.isInvalidating) {
    return;
  }
  store.isInvalidating = true;
  // Recursively clear the cached value for the current action and all dependants
  const queue = store.invalidationQueue;
  let queueItem: CachedAction;
  while ((queueItem = queue.shift()!)) {
    const cachedEntry = queueItem;
    cachedEntry.value = undefined;
    cachedEntry.previousResult = undefined;
    if (cachedEntry.isAwaitingOnInvalidate) {
      cachedEntry.isAwaitingOnInvalidate = false;
      const action = cachedEntry.action;
      onInvalidateNodeAction(action);
    }
    cachedEntry.isInvalidating = false;
  }
  store.isInvalidating = false;
}

function assignCachedActionResult(
  store: Store,
  cachedAction: CachedAction,
  result: CachedAction,
): void {
  cachedAction.next = result;
  cachedAction.value = result.value;
  result.dependants.push(cachedAction);
  retainCachedNodeAction(store, result);
}

function releaseCachedActionResult(store: Store, cachedAction: CachedAction): void {
  cachedAction.value = undefined;
  const result = cachedAction.next;
  if (!result) {
    return;
  }
  result.dependants.splice(result.dependants.indexOf(cachedAction), 1);
  cachedAction.next = undefined;
  releaseCachedNodeAction(store, result);
}

export function retainScope(store: Store, scope: Scope): number {
  const scopeCache = getScopeCache(store, scope);
  if (!scopeCache) {
    return 0;
  }
  const retainCount = ++scopeCache.retainCount;
  if (retainCount === 1) {
    if (scope.parent) {
      retainScope(store, scope.parent);
    }
    onSubscribeScope(scope);
  }
  return retainCount;
}

export function retainNode(store: Store, node: GraphNode): number {
  const nodeCache = getNodeCache(store, node);
  if (!nodeCache) {
    return 0;
  }
  const retainCount = retainCachedNode(store, nodeCache);
  // If this is the first subscription, invoke the subscribe lifecycle method
  if (retainCount === 1) {
    onSubscribeNode(node);
  }
  return retainCount;
}

export function retainCachedNode(store: Store, nodeCache: NodeCache): number {
  const retainCount = ++nodeCache.retainCount;
  if (retainCount === 1) {
    retainScope(store, nodeCache.node.scope);
  }
  return retainCount;
}

export function retainNodeAction(store: Store, action: GraphAction): number {
  const cachedAction = getCachedAction(store, action);
  if (!cachedAction) {
    return 0;
  }
  return retainCachedNodeAction(store, cachedAction);
}

function retainCachedNodeAction(store: Store, cachedAction: CachedAction): number {
  // Recursively retain all the action's dependencies
  const queue = createQueue<CachedAction>(cachedAction);
  let newlySubscribedNodes: Queue<NodeCache> | undefined;
  let newlySubscribedActions: Queue<CachedAction> | undefined;
  let queueItem: CachedAction;
  while ((queueItem = queue.shift()!)) {
    const retainCount = ++queueItem.retainCount;
    if (retainCount > 1) {
      continue;
    }
    // This is the first subscription to this action
    const action = queueItem.action;
    const node = action.node;
    const dependencies = queueItem.dependencies;
    const contextDependencies = queueItem.contextDependencies;
    // Increment the node's overall retain count
    const nodeCache = getNodeCache(store, node)!;
    const nodeRetainCount = retainCachedNode(store, nodeCache);
    // If this is the first subscription for this node, add it to the list of new subscriptions
    if (nodeRetainCount === 1) {
      if (newlySubscribedNodes) {
        newlySubscribedNodes.push(nodeCache);
      } else {
        newlySubscribedNodes = createQueue(nodeCache);
      }
    }
    // Add the action to the list of new subscriptions
    if (newlySubscribedActions) {
      newlySubscribedActions.push(queueItem);
    } else {
      newlySubscribedActions = createQueue(queueItem);
    }
    // Increment the retain count for all the action's dependencies
    for (let i = 0; i < dependencies.length; i++) {
      queue.push(dependencies[i].target);
    }
    for (let i = 0; i < contextDependencies.length; i++) {
      queue.push(contextDependencies[i].target);
    }
  }
  // Invoke the subscribe lifecycle method for any newly-added nodes
  if (newlySubscribedNodes) {
    let nodeCache: NodeCache;
    while ((nodeCache = newlySubscribedNodes.shift()!)) {
      onSubscribeNode(nodeCache.node);
    }
  }
  // Invoke the subscribe lifecycle method for any newly-added node actions
  if (newlySubscribedActions) {
    let cachedAction: CachedAction;
    while ((cachedAction = newlySubscribedActions.shift()!)) {
      onSubscribeNodeAction(cachedAction.action);
    }
  }
  return cachedAction.retainCount;
}

export function releaseScope(store: Store, scope: Scope): number {
  const scopeCache = getScopeCache(store, scope);
  if (!scopeCache) {
    return 0;
  }
  return releaseCachedScope(store, scopeCache);
}

function releaseCachedScope(store: Store, scopeCache: ScopeCache): number {
  if (scopeCache.retainCount <= 0) {
    return 0;
  }
  const retainCount = --scopeCache.retainCount;
  if (retainCount === 0) {
    disposeCachedScope(store, scopeCache);
  }
  return retainCount;
}

function disposeCachedScope(store: Store, scopeCache: ScopeCache): void {
  if (scopeCache.retainCount < 0) {
    return;
  }
  scopeCache.retainCount = -1;
  for (let i = 0; i < scopeCache.childScopes.length; i++) {
    const childScope = scopeCache.childScopes[i];
    disposeCachedScope(store, childScope);
  }
  const scope = scopeCache.scope;
  for (let i = 0; i < scopeCache.nodes.length; i++) {
    const nodeCache = scopeCache.nodes[i];
    disposeCachedNode(store, nodeCache);
  }
  onUnsubscribeScope(scope);
  removeScopeFromCache(store, scope);
  if (scope.parent) {
    releaseScope(store, scope.parent);
  }
}

export function releaseNode(store: Store, node: GraphNode): number {
  const nodeCache = getNodeCache(store, node);
  if (!nodeCache) {
    return 0;
  }
  return releaseCachedNode(store, nodeCache);
}

function releaseCachedNode(store: Store, nodeCache: NodeCache): number {
  if (nodeCache.retainCount <= 0) {
    return 0;
  }
  const retainCount = --nodeCache.retainCount;
  if (retainCount === 0) {
    disposeCachedNode(store, nodeCache);
  }
  return retainCount;
}

function disposeCachedNode(store: Store, nodeCache: NodeCache): void {
  if (nodeCache.retainCount < 0) {
    return;
  }
  nodeCache.retainCount = -1;
  const node = nodeCache.node;
  // Release any retained actions for this node
  for (let i = 0; i < nodeCache.instances.length; i++) {
    const cachedEntry = nodeCache.instances[i];
    if (cachedEntry.retainCount > 1) {
      cachedEntry.retainCount = 1;
      releaseCachedNodeAction(store, cachedEntry);
    }
  }
  // Invoke the node's unsubscribe lifecycle method
  onUnsubscribeNode(node);
  // Remove the node from the cache
  removeNodeFromCache(store, node);
  // Release the node's scope
  releaseScope(store, node.scope);
}

export function releaseNodeAction(store: Store, action: GraphAction): number {
  const cachedAction = getCachedAction(store, action);
  if (!cachedAction) {
    return 0;
  }
  return releaseCachedNodeAction(store, cachedAction);
}

function releaseCachedNodeAction(store: Store, cachedAction: CachedAction): number {
  // Recursively release all the action's dependencies
  const queue = createQueue<CachedAction>(cachedAction);
  let queueItem: CachedAction;
  while ((queueItem = queue.shift()!)) {
    const retainCount = --queueItem.retainCount;
    if (retainCount > 0) {
      continue;
    }
    // This was the last subscription to this action
    const action = queueItem.action;
    const node = action.node;
    const dependencies = queueItem.dependencies;
    const contextDependencies = queueItem.contextDependencies;
    // Invoke the action's unsubscribe lifecycle method
    onUnsubscribeNodeAction(action);
    // Remove dependant entries and decrement the retain count for all the action's dependencies
    for (let i = 0; i < dependencies.length; i++) {
      const dependency = dependencies[i];
      dependency.target.dependants.splice(dependency.target.dependants.indexOf(queueItem), 1);
      queue.push(dependency.target);
    }
    for (let i = 0; i < contextDependencies.length; i++) {
      const dependency = contextDependencies[i];
      dependency.target.dependants.splice(dependency.target.dependants.indexOf(queueItem), 1);
      queue.push(dependency.target);
    }
    // Release any value that still happens to be subscribed
    if (queueItem.next) {
      queueItem.next.dependants.splice(queueItem.next.dependants.indexOf(queueItem), 1);
      queue.push(queueItem.next);
    }
    // Remove the action from the cache
    removeActionFromCache(store, queueItem);
    // Decrement the node's overall retain count
    releaseNode(store, node);
  }
  return cachedAction.retainCount;
}

function queueCachedAction(
  store: Store,
  cachedAction: CachedAction,
  addToBack: boolean,
  dependencyStack: Stack<CachedAction> | number,
  visitedDependencies: HashSet | undefined,
  dependantStack: Stack<CachedAction> | number,
  visitedDependants: HashSet | undefined,
): void {
  if (cachedAction.queuedAction) {
    const queueItem = cachedAction.queuedAction;
    if (visitedDependencies && visitedDependencies.size > 0) {
      queueItem.visitedDependencies = queueItem.visitedDependencies
        ? mergeHashSets(queueItem.visitedDependencies, visitedDependencies)
        : visitedDependencies;
    }
    if (visitedDependants && visitedDependants.size > 0) {
      queueItem.visitedDependants = queueItem.visitedDependants
        ? mergeHashSets(queueItem.visitedDependants, visitedDependants)
        : visitedDependants;
    }
    return;
  }
  const queuedAction = createQueuedAction(
    cachedAction,
    dependencyStack,
    visitedDependencies,
    dependantStack,
    visitedDependants,
  );
  if (addToBack) {
    store.resolverQueue.push(queuedAction);
  } else {
    store.resolverQueue.unshift(queuedAction);
  }
  cachedAction.queuedAction = queuedAction;
}

function queueInvalidation(
  store: Store,
  cachedAction: CachedAction,
  invokeLifecycleMethod: boolean,
) {
  if (invokeLifecycleMethod) {
    cachedAction.isAwaitingOnInvalidate = true;
  }
  if (cachedAction.isInvalidating) {
    return;
  }
  store.invalidationQueue.push(cachedAction);
  cachedAction.isInvalidating = true;
}

function retrieveScopeCache(store: Store, scope: Scope): ScopeCache {
  const scopeCache = getScopeCache(store, scope);
  return scopeCache || addScopeToCache(store, scope);
}

function retrieveNodeCache(store: Store, node: GraphNode): NodeCache {
  const nodeCache = getNodeCache(store, node);
  return nodeCache || createNodeCacheEntry(store, node);
}

function createNodeCacheEntry(store: Store, node: GraphNode): NodeCache {
  const state = getInitialNodeState(node);
  const data = getInitialNodeData(node);
  const nodeCache = addNodeToCache(store, node, state, data);
  const scopeCache = retrieveScopeCache(store, node.scope);
  scopeCache.nodes.push(nodeCache);
  return nodeCache;
}

function retrieveCachedAction(
  store: Store,
  action: GraphAction,
  dependencyStack: Stack<CachedAction> | number,
  visitedDependencies: HashSet | undefined,
  dependantStack: Stack<CachedAction> | number,
  visitedDependants: HashSet | undefined,
): CachedAction {
  const cachedAction = getCachedAction(store, action);
  if (cachedAction) return cachedAction;
  return createCacheEntry(
    store,
    action,
    dependencyStack,
    visitedDependencies,
    dependantStack,
    visitedDependants,
  );
}

type ActionCacheQueueItem = {
  action: GraphAction;
  isDependencyOf: CachedAction | undefined;
  isContextDependency: boolean;
  allowErrors: boolean;
  allowPending: boolean;
  invalidate: boolean;
  dependencyStack: Stack<CachedAction> | number;
  visitedDependencies: HashSet | undefined;
  dependantStack: Stack<CachedAction> | number;
  visitedDependants: HashSet | undefined;
};

function createCacheEntry(
  store: Store,
  action: GraphAction,
  dependencyStack: Stack<CachedAction> | number,
  visitedDependencies: HashSet | undefined,
  dependantStack: Stack<CachedAction> | number,
  visitedDependants: HashSet | undefined,
): CachedAction {
  const queue = createQueue<ActionCacheQueueItem>(
    createCacheActionQueueItem(
      action,
      undefined,
      false,
      false,
      false,
      false,
      dependencyStack,
      visitedDependencies,
      dependantStack,
      visitedDependants,
    ),
  );
  let queueItem: ActionCacheQueueItem;
  let returnValue: CachedAction = undefined as any;
  // Recursively create cache entries for this action and all its dependencies
  while ((queueItem = queue.shift()!)) {
    const {
      action: currentAction,
      isDependencyOf: caller,
      isContextDependency,
      allowErrors,
      allowPending,
      invalidate,
    } = queueItem;
    let cachedEntry: CachedAction;
    const existingCacheEntry = getCachedAction(store, currentAction);
    if (existingCacheEntry && existingCacheEntry.cacheable) {
      // This action is already cached, so reuse the existing result
      cachedEntry = existingCacheEntry;
    } else {
      // Ensure a node cache entry exists for this node
      const node = currentAction.node;
      const nodeCache = retrieveNodeCache(store, node);
      // Create a new cache entry for this action
      cachedEntry = addActionToCache(store, currentAction);
      nodeCache.instances.push(cachedEntry);
      queueCachedAction(
        store,
        cachedEntry,
        false,
        queueItem.dependencyStack,
        queueItem.visitedDependencies,
        queueItem.dependantStack,
        queueItem.visitedDependants,
      );
      // Recursively traverse any context dependencies, passing the current entry as the caller
      const contextDependencies = getNodeActionContextDependencies(currentAction);
      const numContextDependencies = contextDependencies.length;
      for (let i = 0; i < numContextDependencies; i++) {
        const { target, allowErrors, allowPending, invalidate } = contextDependencies[i];
        queue.push(
          createCacheActionQueueItem(
            target,
            cachedEntry,
            allowErrors,
            allowPending,
            invalidate,
            true,
            typeof queueItem.dependencyStack === 'number'
              ? queueItem.dependencyStack + 1
              : pushStackItem(cachedEntry, queueItem.dependencyStack),
            queueItem.visitedDependencies &&
              addHashSetItem(cachedEntry.action.id, queueItem.visitedDependencies),
            queueItem.dependantStack,
            queueItem.visitedDependants,
          ),
        );
      }
      // Recursively traverse any dependencies, passing the current entry as the caller
      const dependencies = getNodeActionDependencies(currentAction);
      const numDependencies = dependencies.length;
      for (let i = 0; i < numDependencies; i++) {
        const { target, allowErrors, allowPending, invalidate } = dependencies[i];
        queue.push(
          createCacheActionQueueItem(
            target,
            cachedEntry,
            allowErrors,
            allowPending,
            invalidate,
            false,
            typeof queueItem.dependencyStack === 'number'
              ? queueItem.dependencyStack + 1
              : pushStackItem(cachedEntry, queueItem.dependencyStack),
            queueItem.visitedDependencies &&
              addHashSetItem(cachedEntry.action.id, queueItem.visitedDependencies),
            queueItem.dependantStack,
            queueItem.visitedDependants,
          ),
        );
      }
    }
    if (caller) {
      // Another action requested this action, so register it as a dependant of the current entry
      (isContextDependency ? caller.contextDependencies : caller.dependencies).push({
        target: cachedEntry,
        allowErrors,
        allowPending,
        invalidate,
      });
      cachedEntry.dependants.push(caller);
    }
    // Always return the first item
    returnValue = returnValue! || cachedEntry;
  }
  return returnValue;
}

function createCacheActionQueueItem(
  action: GraphAction,
  isDependencyOf: CachedAction | undefined,
  allowErrors: boolean,
  allowPending: boolean,
  invalidate: boolean,
  isContextDependency: boolean,
  dependencyStack: Stack<CachedAction> | number,
  visitedDependencies: HashSet | undefined,
  dependantStack: Stack<CachedAction> | number,
  visitedDependants: HashSet | undefined,
): ActionCacheQueueItem {
  return {
    action,
    isDependencyOf,
    isContextDependency,
    allowErrors,
    allowPending,
    invalidate,
    dependencyStack,
    visitedDependencies,
    dependantStack,
    visitedDependants,
  };
}

function flush(store: Store): void {
  // Prevent more than one concurrent flush operation
  if (store.isFlushing || store.isInvalidating) {
    return;
  }
  store.isFlushing = true;
  // Process all the actions in the store queue until everything is fully resolved
  const queue = store.resolverQueue;
  const subscribedUpdates: Queue<CachedAction> = createQueue<CachedAction>();
  let queueItem: QueuedAction;
  let counter = -1;
  while ((queueItem = queue.shift()!)) {
    if (++counter >= MAX_OPERATION_COUNT) {
      throw new Error('Maximum operation limit exceeded');
    }
    const cachedEntry = queueItem.target;
    cachedEntry.queuedAction = undefined;
    // If this item already has a value, or if it is no longer needed, move onto the next one
    if (cachedEntry.value || cachedEntry.retainCount === 0) {
      continue;
    }
    const action = cachedEntry.action;
    const dependencyStack = queueItem.dependencyStack;
    const dependenciesDepth =
      typeof dependencyStack === 'number' ? dependencyStack : dependencyStack.length;
    const dependantStack = queueItem.dependantStack;
    const dependantsDepth =
      typeof dependantStack === 'number' ? dependantStack : dependantStack.length;
    const visitedDependencies = queueItem.visitedDependencies;
    const visitedDependants = queueItem.visitedDependants;
    if (dependenciesDepth >= MAX_STACK_SIZE) {
      const errorStack = pushStackItem(
        cachedEntry,
        typeof dependencyStack === 'number' ? createStack() : dependencyStack,
      );
      releaseCachedActionResult(store, cachedEntry);
      cachedEntry.value = withScopeFrom(
        cachedEntry.action.node,
        error(
          new Error(
            getMaxStackDepthErrorMessage('Maximum dependency depth exceeded', errorStack, queue),
          ),
        ),
      );
      cachedEntry.previousResult = undefined;
    } else if (dependantsDepth >= MAX_STACK_SIZE) {
      const errorStack = pushStackItem(
        cachedEntry,
        typeof dependantStack === 'number' ? createStack() : dependantStack,
      );
      releaseCachedActionResult(store, cachedEntry);
      cachedEntry.value = withScopeFrom(
        cachedEntry.action.node,
        error(new Error(getMaxStackDepthErrorMessage('Maximum depth exceeded', errorStack, queue))),
      );
      cachedEntry.previousResult = undefined;
    } else if (visitedDependencies && hashSetContains(action.id, visitedDependencies)) {
      const errorStack = pushStackItem(
        cachedEntry,
        typeof dependencyStack === 'number' ? createStack() : dependencyStack,
      );
      releaseCachedActionResult(store, cachedEntry);
      cachedEntry.value = withScopeFrom(
        cachedEntry.action.node,
        error(
          new Error(
            getMaxStackDepthErrorMessage('Circular dependency encountered', errorStack, queue),
          ),
        ),
      );
      cachedEntry.previousResult = undefined;
    } else if (visitedDependants && hashSetContains(action.id, visitedDependants)) {
      const errorStack = pushStackItem(
        cachedEntry,
        typeof dependantStack === 'number' ? createStack() : dependantStack,
      );
      releaseCachedActionResult(store, cachedEntry);
      cachedEntry.value = withScopeFrom(
        cachedEntry.action.node,
        error(
          new Error(
            getMaxStackDepthErrorMessage('Circular reference encountered', errorStack, queue),
          ),
        ),
      );
      cachedEntry.previousResult = undefined;
    } else {
      const dependencies = cachedEntry.dependencies;
      const contextDependencies = cachedEntry.contextDependencies;
      // We need to resolve both standard dependencies and context dependencies,
      // so it makes sense to iterate through the combined set together
      const numDependencies = dependencies.length;
      const numContextDependencies = contextDependencies.length;
      const numCombinedDependencies = numDependencies + numContextDependencies;
      let dependencyError: ErrorNode | undefined;
      let dependencyPending: PendingNode | undefined;
      let unresolvedDependencies: Queue<CachedAction> | undefined;
      for (let i = 0; i < numCombinedDependencies; i++) {
        // Locate the cache entry for the dependency target
        const dependency =
          i < numDependencies ? dependencies[i] : contextDependencies[i - numDependencies];
        const target = dependency.target;
        const targetValue = target.value;
        if (targetValue) {
          // The dependency target has already been resolved to a value
          // If the target has resolved to an error, note it down and skip any remaining dependencies
          if (ErrorNodeType.is(targetValue) && !dependency.allowErrors) {
            dependencyError = targetValue;
            break;
          }
          // If the target has resolved to a pending state, note it down and move onto the next one
          if (PendingNodeType.is(targetValue) && !dependency.allowPending) {
            dependencyPending = targetValue;
            continue;
          }
          // The dependency target is fully resolved, so move onto the next one
          continue;
        }
        // There is no value for this dependency yet, so add it to the list of unresolved dependencies
        if (unresolvedDependencies) {
          unresolvedDependencies.push(target);
        } else {
          unresolvedDependencies = createQueue<CachedAction>(target);
        }
      }
      // We've gone through all the dependencies, so let's see if we're ready to compute a result...
      if (dependencyError) {
        // One of the dependencies is in an error state, so use that value for this action's value
        releaseCachedActionResult(store, cachedEntry);
        cachedEntry.value = dependencyError;
        cachedEntry.previousResult = undefined;
      } else if (dependencyPending) {
        // One of the dependencies is in a pending state, so use that value for this action's value
        releaseCachedActionResult(store, cachedEntry);
        cachedEntry.value = dependencyPending;
        cachedEntry.previousResult = undefined;
      } else if (unresolvedDependencies) {
        // TODO: Re-add the item to the front of the queue if none of the dependencies are already queued
        // Some of the dependencies are unresolved, so we need to make sure they're queued up
        // Add each unresolved dependency to the front of the queue
        let target: CachedAction;
        while ((target = unresolvedDependencies.pop()!)) {
          queueCachedAction(
            store,
            target,
            false,
            typeof dependencyStack === 'number'
              ? dependencyStack + 1
              : pushStackItem(cachedEntry, dependencyStack),
            visitedDependencies && addHashSetItem(action.id, visitedDependencies),
            dependantStack,
            visitedDependants,
          );
        }
        // Re-add the current item to the back of the queue, i.e. after the dependencies have resolved
        queueCachedAction(
          store,
          cachedEntry,
          true,
          dependencyStack,
          visitedDependencies,
          dependantStack,
          visitedDependants,
        );
      } else {
        // All the dependencies are fully resolved, so we can now compute the action's value
        // Retrieve the resolved dependency values
        const dependencyValues = getDependencyValues(dependencies) as Array<GraphNode>;
        const contextValues = getDependencyValues(contextDependencies) as Array<GraphNode>;
        // Check if the dependencies have changed, to determine whether to recompute the node value
        const previousDependencies = cachedEntry.dependencyValues;
        let dependenciesHaveChanged = !previousDependencies;
        for (let i = 0; previousDependencies && i < previousDependencies.length; i++) {
          if (dependencyValues[i].id !== previousDependencies[i].id) {
            dependenciesHaveChanged = true;
            break;
          }
        }
        // If the dependencies have not changed, reuse the previous result (if one exists)
        const cachedResult = !dependenciesHaveChanged ? cachedEntry.previousResult : undefined;
        // Otherwise compute the new value based on the resolved dependency values and the node state
        const nodeCache = getNodeCache(store, action.node)!;
        const result =
          cachedResult ||
          (cachedEntry.previousResult = getNodeActionValue(
            action,
            nodeCache.state,
            nodeCache.data,
            dependencyValues,
            contextValues,
          ));
        // Store the current dependency values for use in the next update check
        cachedEntry.dependencyValues = dependencyValues;
        if (isGraphAction(result)) {
          // The action returned another action, so we need to chain a dependency for the result
          // The action might be identical to the last one, so reuse the existing value if possible
          const resultHasChanged = !(cachedEntry.next && cachedEntry.next.action.id === result.id);
          if (!resultHasChanged && cachedEntry.next!.value) {
            // The previous result action already exists in the cache, so grab the current value
            cachedEntry.value = cachedEntry.next!.value;
          } else {
            // Clean up any outdated result subscription and set up a new result subscription
            const outdatedResult = resultHasChanged ? cachedEntry.next : undefined;
            if (outdatedResult) {
              outdatedResult.dependants.splice(outdatedResult.dependants.indexOf(cachedEntry), 1);
              cachedEntry.next = undefined;
            }
            const nextResult = resultHasChanged
              ? retrieveCachedAction(
                  store,
                  result,
                  dependencyStack,
                  visitedDependencies,
                  typeof dependantStack === 'number'
                    ? dependantStack + 1
                    : pushStackItem(cachedEntry, dependantStack),
                  visitedDependants && addHashSetItem(action.id, visitedDependants),
                )
              : cachedEntry.next!;
            // If the subscription has changed, update the cache entry and retain the new result
            if (resultHasChanged) {
              assignCachedActionResult(store, cachedEntry, nextResult);
            }
            // Now the new subscription has been retained, we can dispose of the previous subscription
            if (outdatedResult) {
              releaseCachedNodeAction(store, outdatedResult);
            }
          }
        } else {
          // The action resolved to a concrete value so clean up previous results and update the cache
          releaseCachedActionResult(store, cachedEntry);
          cachedEntry.value = result;
          cachedEntry.previousResult = result;
        }
        // TODO: call the onUpdate lifecycle BEFORE recalculating the value
        // Everything's now in a consistent state, so we can invoke the onUpdate lifecycle method
        if (dependenciesHaveChanged) {
          onUpdateNodeAction(
            action,
            nodeCache.state,
            nodeCache.data,
            dependencyValues,
            contextValues,
            previousDependencies,
          );
        }
      }
    }
    if (cachedEntry.value) {
      // We've successfully computed this action's value, so now we can recompute dependant actions
      for (let i = cachedEntry.dependants.length - 1; i >= 0; i--) {
        queueCachedAction(
          store,
          cachedEntry.dependants[i],
          false,
          typeof dependencyStack === 'number' ? 0 : EMPTY_STACK,
          visitedDependencies && EMPTY_HASH_SET,
          typeof dependantStack === 'number' ? 0 : EMPTY_STACK,
          visitedDependants && EMPTY_HASH_SET,
        );
      }
      // If there are any subscriptions registered for this action, make a note of them for later
      if (getSubscriptions(store, action)) {
        subscribedUpdates.push(cachedEntry);
      }
    }
  }
  store.isFlushing = false;
  // We're done with the flush operation, so now we can invoke any updated subscription callbacks
  if (subscribedUpdates.length > 0) {
    // If an action's value has updated multiple times during this flush, only run the callback once
    const deduplicatedSubscriptionUpdates = uniqBy(({ action }) => action.id, subscribedUpdates);

    store.events.emit({ type: TRANSACTION_START, payload: undefined });
    deduplicatedSubscriptionUpdates.forEach((cachedEntry) => {
      // Get all node subscriptions and make sure that there are any to call
      const subscriptions = getSubscriptions(store, cachedEntry.action);
      if (!subscriptions) return;
      // Run all the callbacks registered for this action
      subscriptions.forEach((subscription) => {
        if (!cachedEntry.value) {
          return;
        }
        const { callback } = subscription;
        callback(cachedEntry.value);
      });
    });
    store.events.emit({ type: TRANSACTION_END, payload: undefined });
  }
}

function getDependencyValues(dependencies: Array<CachedDependency>): Array<GraphNode | undefined> {
  const dependenciesLength = dependencies.length;
  // tslint:disable-next-line:prefer-array-literal
  const values: Array<GraphNode | undefined> = new Array(dependenciesLength);
  for (let index = 0; index < dependenciesLength; index++) {
    values[index] = dependencies[index].target.value;
  }
  return values;
}

function getScopeCache(store: Store, scope: Scope): ScopeCache | undefined {
  return store.scopes.get(scope.id);
}

function removeScopeFromCache(store: Store, scope: Scope): void {
  if (scope.parent) {
    const scopeCache = getScopeCache(store, scope);
    const parentScopeCache = getScopeCache(store, scope.parent);
    if (scopeCache && parentScopeCache) {
      const parentScopeIndex = parentScopeCache.childScopes.indexOf(scopeCache);
      parentScopeCache.childScopes.splice(parentScopeIndex, 1);
    }
  }
  store.scopes.delete(scope.id);
}

function addScopeToCache(store: Store, scope: Scope): ScopeCache {
  const scopeCache = createScopeCache(scope);
  store.scopes.set(scope.id, scopeCache);
  if (scope.parent) {
    const parentScopeCache = retrieveScopeCache(store, scope.parent);
    parentScopeCache.childScopes.push(scopeCache);
  }
  return scopeCache;
}

function getNodeCache(store: Store, node: GraphNode): NodeCache | undefined {
  return store.nodes.get(node.id);
}

function removeNodeFromCache(store: Store, node: GraphNode): void {
  const nodeCache = getNodeCache(store, node);
  if (!nodeCache) {
    return;
  }
  store.nodes.delete(node.id);
  const scopeCache = getScopeCache(store, node.scope);
  if (!scopeCache) {
    return;
  }
  const scopeCacheIndex = scopeCache.nodes.indexOf(nodeCache);
  if (scopeCacheIndex === -1) {
    return;
  }
  scopeCache.nodes.splice(scopeCacheIndex, 1);
}

function addNodeToCache(
  store: Store,
  node: GraphNode,
  state: NodeState | undefined,
  data: NodeData | undefined,
): NodeCache {
  const nodeCache = createNodeCache(node, state, data);
  store.nodes.set(node.id, nodeCache);
  return nodeCache;
}

function getActionCache(store: Store, action: GraphAction): ActionCache | undefined {
  return store.actions.get(action.id);
}

function addActionToCache(store: Store, action: GraphAction): CachedAction {
  const cachedEntry = createCachedAction(action);
  const existingActionCache = getActionCache(store, action);
  if (existingActionCache) {
    existingActionCache.instances!.push(cachedEntry);
    return cachedEntry;
  }
  store.actions.set(action.id, createActionCache(cachedEntry));
  store.instances.set(cachedEntry.id, cachedEntry);
  return cachedEntry;
}

function getCachedAction(store: Store, action: GraphAction): CachedAction | undefined {
  const actionCache = getActionCache(store, action);
  return actionCache && (actionCache.cacheable ? actionCache.instance : undefined);
}

function removeActionFromCache(store: Store, cachedAction: CachedAction): void {
  const action = cachedAction.action;
  const nodeCache = getNodeCache(store, action.node)!;
  const cachedNodeActions = nodeCache.instances;
  const cachedActionIndex = cachedNodeActions.indexOf(cachedAction);
  if (cachedActionIndex !== -1) {
    cachedNodeActions.splice(cachedActionIndex, 1);
  }
  const actionCache = getActionCache(store, action)!;
  if (actionCache.cacheable) {
    store.actions.delete(action.id);
  } else {
    const cachedEntries = actionCache.instances;
    const cachedEntryIndex = cachedEntries.indexOf(cachedAction);
    if (cachedEntryIndex !== -1) {
      cachedEntries.splice(cachedEntryIndex, 1);
      if (cachedEntries.length === 0) {
        store.actions.delete(action.id);
      }
    }
  }
  store.instances.delete(cachedAction.id);
}

function getSubscriptions(store: Store, action: GraphAction): Array<Subscription> | undefined {
  return store.subscriptions.get(action.id);
}

function createScopeCache(scope: Scope): ScopeCache {
  return {
    scope,
    childScopes: [],
    nodes: [],
    retainCount: 0,
  };
}

function createNodeCache(
  node: GraphNode,
  state: NodeState | undefined,
  data: NodeData | undefined,
): NodeCache {
  return {
    node,
    state,
    data,
    instances: [],
    retainCount: 0,
  };
}

function createActionCache(cachedAction: CachedAction): ActionCache {
  if (cachedAction.cacheable) {
    return {
      action: cachedAction.action,
      cacheable: true,
      instance: cachedAction,
      instances: undefined,
    };
  }
  return {
    action: cachedAction.action,
    cacheable: false,
    instance: undefined,
    instances: [cachedAction],
  };
}

let cachedActionId = 0;
function createCachedAction(action: GraphAction): CachedAction {
  const isCacheable = getIsCacheable(action);
  return {
    id: ++cachedActionId,
    action,
    cacheable: isCacheable,
    contextDependencies: [],
    dependencies: [],
    dependants: [],
    value: undefined,
    next: undefined,
    dependencyValues: undefined,
    previousResult: undefined,
    retainCount: 0,
    queuedAction: undefined,
    isInvalidating: false,
    isAwaitingOnInvalidate: false,
  };
}

function getIsCacheable(action: GraphAction): boolean {
  const operation = action.operation;
  // Resolve operations can comprise non-cacheable sub-operations, making the overall resolve
  // action non-cacheable. To sidestep this, we've taken the naive approach of setting all resolve
  // actions as non-cacheable, but this can sometimes create infinite unsubscribe/resubscribe loops.
  // A better solution might be to initially define the resolve action as cacheable, but manage the
  // action's isCacheable property based on whether its sub-operations turn out to be cacheable.
  if (isResolveOperation(operation)) {
    return false;
  }
  const nodeType = action.node.definition.type;
  if (!isDynamicNodeType(nodeType)) {
    return true;
  }
  const operationName =
    action.operation.type.name in nodeType.operations
      ? action.operation.type.name
      : WILDCARD_OPERATION;
  const operationHandler = nodeType.operations[operationName];
  return Boolean(operationHandler && operationHandler.cacheable);
}

function createQueuedAction(
  target: CachedAction,
  dependencyStack: Stack<CachedAction> | number,
  visitedDependencies: HashSet | undefined,
  dependantStack: Stack<CachedAction> | number,
  visitedDependants: HashSet | undefined,
): QueuedAction {
  return {
    target,
    dependencyStack,
    visitedDependencies,
    dependantStack,
    visitedDependants,
  };
}

function getInitialNodeState(node: GraphNode): NodeState | undefined {
  return isStatefulNode(node)
    ? node.definition.type.getInitialState(node.definition.properties)
    : undefined;
}

function getInitialNodeData(node: GraphNode): NodeData | undefined {
  return isStatefulNode(node) ? {} : undefined;
}

function getNodeActionDependencies(action: GraphAction): Array<GraphDependency> {
  const operation = action.operation;
  if (isIdentityOperation(operation)) {
    return [];
  }
  if (isResolveOperation(operation)) {
    // If supported, create a dependency that will run the evaluate operation on the current node
    return supportsEvaluateOperation(action.node) &&
      !(operation.properties.until && operation.properties.until.predicate(action.node)) &&
      !(operation.properties.acceptNil && NilNodeType.is(action.node))
      ? [
          {
            target: createGraphAction(action.node, evaluateOperation()),
            allowErrors: true,
            allowPending: true,
            invalidate: true,
          },
        ]
      : [];
  }
  if (!supportsOperationType(operation.type.name, action.node)) {
    return [];
  }
  const operationName =
    action.operation.type.name in action.node.definition.type.operations
      ? operation.type.name
      : WILDCARD_OPERATION;
  return action.node.definition.type.operations[operationName]
    .getDependencies(action.node.definition, operation)
    .map((dependency: Dependency) => ({
      target: createGraphAction(
        isGraphNode(dependency.target)
          ? dependency.target
          : withScopeFrom(action.node, dependency.target),
        dependency.operation,
      ),
      allowErrors: dependency.allowErrors,
      allowPending: dependency.allowPending,
      invalidate: dependency.invalidate,
    }));
}

function getNodeActionContextDependencies(action: GraphAction): Array<GraphDependency> {
  const operation = action.operation;
  if (isIdentityOperation(operation) || isResolveOperation(operation)) {
    return [];
  }
  if (!supportsOperationType(action.operation.type.name, action.node)) {
    return [];
  }
  const operationName =
    action.operation.type.name in action.node.definition.type.operations
      ? action.operation.type.name
      : WILDCARD_OPERATION;
  return action.node.definition.type.operations[operationName]
    .getContextDependencies(action.node.definition, action.operation)
    .map((contextDependency: ContextDependency) => {
      const dependency = parseContextDependency(action.node, contextDependency);
      const target = dependency.target;
      const targetNode = isGraphNode(target) ? target : withScopeFrom(action.node, target);
      return {
        target: createGraphAction(targetNode, dependency.operation),
        allowErrors: dependency.allowErrors,
        allowPending: dependency.allowPending,
        invalidate: dependency.invalidate,
      };
    });
}

function getNodeActionValue(
  action: GraphAction,
  state: NodeState | undefined,
  data: NodeData | undefined,
  dependencyValues: Array<GraphNode>,
  contextValues: Array<GraphNode>,
): GraphNode | GraphAction {
  const operation = action.operation;
  if (isIdentityOperation(operation)) {
    return action.node;
  }
  if (isResolveOperation(operation)) {
    const result = dependencyValues[0] || action.node;
    const until = operation.properties.until;
    // If there was a terminating condition specified, and this node meets it, bail out
    const hasMetUntilCondition =
      Boolean(until && until.predicate(result)) ||
      (!operation.properties.allowErrors && ErrorNodeType.is(result)) ||
      (!operation.properties.allowPending && PendingNodeType.is(result)) ||
      (operation.properties.acceptNil && NilNodeType.is(result));
    if (hasMetUntilCondition) {
      return result;
    }
    // If the evaluate operation returned a dynamic value, continue resolving the result
    if (supportsEvaluateOperation(result)) {
      return createGraphAction(result, operation);
    }
    // We've resolved as far as we can, so if there was an unmet condition return an error
    if (until) {
      return withScopeFrom(result, error(until.errorMessage(result)));
    }
    // The action has fully resolved to a static value, so return that value
    return result;
  }
  if (!supportsOperationType(operation.type.name, action.node)) {
    const nodeName = action.node.definition.type.name;
    const operationName = operation.type.name;
    return withScopeFrom(
      action.node,
      error(`${pascalCase(nodeName)} node does not support the "${operationName}" operation`),
    );
  }
  const operationId =
    action.operation.type.name in action.node.definition.type.operations
      ? operation.type.name
      : WILDCARD_OPERATION;
  const operationHandler = (action.node as StatefulGraphNode).definition.type.operations[
    operationId
  ];
  return operationHandler.run(action.node, operation, dependencyValues, contextValues, state!);
}

function onSubscribeScope(scope: Scope): void {
  if (scope.onSubscribe) {
    scope.onSubscribe();
  }
}

function onSubscribeNode(node: GraphNode): void {
  if (isStatefulNode(node) && node.definition.type.onSubscribe) {
    node.definition.type.onSubscribe(node);
  }
}

function onSubscribeNodeAction(action: GraphAction): void {
  const node = action.node;
  const operation = action.operation;
  if (isResolveOperation(operation) || isIdentityOperation(operation)) {
    return;
  }
  if (isStatefulNode(node)) {
    const nodeType = node.definition.type;
    const operationType = operation.type;
    const operationName =
      operationType.name in nodeType.operations ? operationType.name : WILDCARD_OPERATION;
    const operationHandler = nodeType.operations[operationName];
    if (operationHandler && operationHandler.onSubscribe) {
      operationHandler.onSubscribe(node, operation);
    }
  }
}

function onUnsubscribeScope(scope: Scope): void {
  if (scope.onUnsubscribe) {
    scope.onUnsubscribe();
  }
}

function onUnsubscribeNode(node: GraphNode): void {
  if (isStatefulNode(node) && node.definition.type.onUnsubscribe) {
    node.definition.type.onUnsubscribe(node);
  }
}

function onUnsubscribeNodeAction(action: GraphAction): void {
  if (isResolveOperation(action.operation) || isIdentityOperation(action.operation)) {
    return;
  }
  if (isStatefulNode(action.node) && action.node.definition) {
    const operation = action.operation;
    const operationName =
      operation.type.name in action.node.definition.type.operations
        ? operation.type.name
        : WILDCARD_OPERATION;
    const operationHandler = action.node.definition.type.operations[operationName];
    if (operationHandler && operationHandler.onUnsubscribe) {
      operationHandler.onUnsubscribe(action.node, operation);
    }
  }
}

function onInvalidateNodeAction(action: GraphAction): void {
  if (isResolveOperation(action.operation) || isIdentityOperation(action.operation)) {
    return;
  }
  if (isStatefulNode(action.node) && action.node.definition) {
    const operation = action.operation;
    const operationName =
      operation.type.name in action.node.definition.type.operations
        ? operation.type.name
        : WILDCARD_OPERATION;
    const operationHandler = action.node.definition.type.operations[operationName];
    if (operationHandler && operationHandler.onInvalidate) {
      operationHandler.onInvalidate(action.node, operation);
    }
  }
}

function onUpdateNodeAction(
  action: GraphAction,
  state: NodeState | undefined,
  data: NodeData | undefined,
  dependencyValues: Array<GraphNode>,
  contextValues: Array<GraphNode>,
  previousDependencyValues: Array<GraphNode> | undefined,
): void {
  if (isStatefulNode(action.node) && action.node.definition) {
    const operationName =
      action.operation.type.name in action.node.definition.type.operations
        ? action.operation.type.name
        : WILDCARD_OPERATION;
    const operationHandler = action.node.definition.type.operations[operationName];
    if (operationHandler && operationHandler.onUpdate) {
      operationHandler.onUpdate(
        action.node,
        action.operation,
        dependencyValues,
        contextValues,
        previousDependencyValues,
      );
    }
  }
}

function uniqBy<T>(iteratee: (value: T) => string, queue: Queue<T>): Array<T> {
  const ids: { [key: string]: true } = {};
  const filteredItems: Array<T> = [];
  let item: QueueItem<T> = queue.head!;
  if (!item) return filteredItems;
  do {
    const value = item.value;
    const id = iteratee(value);
    if (ids[id]) continue;
    ids[id] = true;
    filteredItems.push(value);
  } while ((item = item.next!));
  return filteredItems;
}

function mapQ<T, R>(iteratee: (item: T) => R, queue: Queue<T>): Array<R> {
  const output: Array<R> = [];
  let item: QueueItem<T> = queue.head!;
  if (!item) return output;
  do {
    output.push(iteratee(item.value));
  } while ((item = item.next!));
  return output;
}

function once(fn: () => void): () => void {
  let hasBeenCalled = false;
  return () => {
    if (hasBeenCalled) {
      return;
    }
    hasBeenCalled = true;
    fn();
  };
}

function getMaxStackDepthErrorMessage(
  message: string,
  stack: Stack<CachedAction> | undefined,
  queue: Queue<{ target: CachedAction }>,
): string {
  const stackItems = stack && getStackItems(stack).map((frame) => frame.action);
  const queueItems = mapQ((item) => item.target.action, queue);
  return getStackErrorMessage(message, stackItems, queueItems);
}

function getStackErrorMessage(
  message: string,
  stack?: Array<GraphAction>,
  queue?: Array<GraphAction>,
): string {
  const stackFramesTop = 5;
  const stackFramesBottom = 5;
  const numQueueItems = 10;
  const maxStackLineNumberLength = stack ? stack.length.toString().length : 0;
  const maxQueueLineNumberLength = numQueueItems.toString().length;
  return [
    message,
    ...(stack && stack.length > 0
      ? [
          ' Visited paths:',
          ...removeConsecutiveDuplicates(
            stack.map((action) => `  ${formatPath(getPath(action.node.context))}`),
          ),
          '',
          ' Operation stack:',
          '',
          ...addLineNumbers(stack.slice(-stackFramesTop).map(getType), {
            offset: 1 + Math.max(0, stack.length - stackFramesTop),
            minLength: maxStackLineNumberLength,
          })
            .reverse()
            .map((line, index) => `${index === 0 ? '\u25CF ' : '  '}${line}`),
          ...(stack.length > stackFramesTop + stackFramesBottom
            ? [
                `  ${leftPad(maxStackLineNumberLength, '…')} | [ ${stack.length -
                  stackFramesTop -
                  stackFramesBottom} more ${
                  stack.length - stackFramesTop - stackFramesBottom === 1 ? 'item' : 'items'
                } ]`,
              ]
            : []),
          ...addLineNumbers(
            stack
              .slice(0, Math.min(Math.max(0, stack.length - stackFramesTop), stackFramesBottom))
              .map(getType),
            {
              offset: 1,
              minLength: maxStackLineNumberLength,
            },
          )
            .reverse()
            .map((line) => `  ${line}`),
        ]
      : []),
    ...(queue && queue.length > 0
      ? [
          '',
          ' Queued operations:',
          '',
          ...addLineNumbers(
            queue.slice(0, numQueueItems).map((action, index) => `${getType(action)}`),
            { offset: 1 },
          ).map((line) => `  ${line}`),
          ...(queue.length > numQueueItems
            ? [
                `  ${leftPad(maxQueueLineNumberLength, '…')} | [ ${queue.length -
                  numQueueItems} more ${queue.length - numQueueItems === 1 ? 'item' : 'items'} ]`,
              ]
            : []),
        ]
      : []),
  ].join('\n');
}

function addLineNumbers(
  lines: Array<string>,
  options: {
    offset?: number;
    minLength?: number;
  } = {},
): Array<string> {
  const offset = options && typeof options.offset === 'number' ? options.offset : 0;
  const minLength =
    options && typeof options.minLength === 'number'
      ? options.minLength
      : (offset + lines.length - 1).toString().length;
  return lines.map((line, index) => `${leftPad(minLength, (offset + index).toString())} | ${line}`);
}

function leftPad(minLength: number, value: string): string {
  if (value.length >= minLength) {
    return value;
  }
  return leftPad(minLength, ` ${value}`);
}

function removeConsecutiveDuplicates<T>(array: Array<T>): Array<T> {
  return array.reduce(
    (acc, x) => (acc.length > 0 && x === acc[acc.length - 1] ? acc : [...acc, x]),
    [],
  );
}
