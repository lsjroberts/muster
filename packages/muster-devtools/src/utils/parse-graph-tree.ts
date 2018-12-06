import {
  ActionId,
  CachedActionId,
  EvaluateOperationType,
  GetChildOperationType,
  GetItemsOperationType,
  NodeDefinition,
  NodeId,
  OperationId,
  root,
  sanitize,
  SerializedCachedAction,
  SerializedContext,
  SerializedGraphAction,
  SerializedGraphNode,
  SerializedGraphOperation,
  SerializedNodeType,
  SerializedScope,
  SerializedStore,
} from '@dws/muster';
import flatMap from 'lodash/flatMap';
import identity from 'lodash/identity';
import { TreeHelpers } from '../types/tree-helpers';
import { TreeEdge, TreeNode } from '../types/tree-node';

export interface GraphTreeNode<T extends SerializedGraphNode = SerializedGraphNode>
  extends TreeNode<SerializedGraphNode, SerializedGraphOperation> {
  value: T;
}

export interface GraphTreeEdge<T extends SerializedGraphOperation = SerializedGraphOperation>
  extends TreeEdge<SerializedGraphNode, SerializedGraphOperation> {
  value: T;
}

export interface GraphTreeHelpers
  extends TreeHelpers<SerializedGraphNode, SerializedGraphOperation> {
  getNodeType(name: string): SerializedNodeType | undefined;
}

interface ParserHelpers {
  getCachedActionsForNode(node: SerializedGraphNode): Array<SerializedCachedAction>;
  getNode(id: NodeId): SerializedGraphNode;
  getOperation(id: OperationId): SerializedGraphOperation;
  getAction(id: ActionId): SerializedGraphAction;
  getCachedAction(id: CachedActionId): SerializedCachedAction;
  transforms: {
    [nodeType: string]: (node: GraphTreeNode) => GraphTreeNode;
  };
}

export default function parseGraphTree(
  store: SerializedStore & {
    scope: SerializedScope;
    context: SerializedContext;
  },
  transforms?: {
    [nodeType: string]: (node: GraphTreeNode) => GraphTreeNode;
  },
): Array<GraphTreeNode> {
  const helpers = createParserHelpers(store, transforms);
  const rootNode = createDummyNode(store.scope, store.context, root());
  const subscriptions = flatMap(
    store.subscriptions.filter((subscription) => subscription.debug),
    (subscription) => helpers.getAction(subscription.action),
  ).filter((action) => helpers.getNode(action.node).id !== rootNode.id);
  return [
    parseCacheTree(rootNode, helpers),
    ...subscriptions.map((action) => parseCacheTree(helpers.getNode(action.node), helpers)),
  ];
}

export function createGraphParser(
  store: SerializedStore & {
    scope: SerializedScope;
    context: SerializedContext;
  },
  transforms?: {
    [nodeType: string]: (node: GraphTreeNode) => GraphTreeNode;
  },
): (root: SerializedGraphNode) => GraphTreeNode {
  const helpers = createParserHelpers(store, transforms);
  return (root: SerializedGraphNode) => parseCacheTree(root, helpers);
}

export function createDummyNode(
  scope: SerializedScope,
  context: SerializedContext,
  definition: NodeDefinition,
): SerializedGraphNode {
  return {
    id: `${scope}:${context}:${definition.id}`,
    scope,
    context,
    definition: sanitize(definition),
  };
}

function createParserHelpers(
  store: SerializedStore,
  transforms:
    | {
        [nodeType: string]: (node: GraphTreeNode) => GraphTreeNode;
      }
    | undefined,
): ParserHelpers {
  const nodesById = store.cache.nodes;
  const operationsById = store.cache.operations;
  const cachedActionsById = store.cache.cache;
  const actionsByNodeId = Object.keys(store.cache.actions).reduce((acc, actionId) => {
    const actionCache = store.cache.actions[actionId];
    const nodeId = getNode(actionCache.action.node).id;
    const existingNodeActions = acc.get(nodeId);
    const cachedActions = (actionCache.cacheable
      ? [actionCache.instance]
      : actionCache.instances
    ).map(getCachedAction);
    if (existingNodeActions) {
      existingNodeActions.push(...cachedActions);
    } else {
      acc.set(nodeId, cachedActions);
    }
    return acc;
  }, new Map<NodeId, Array<SerializedCachedAction>>());
  return {
    getCachedActionsForNode,
    getNode,
    getOperation,
    getAction,
    getCachedAction,
    transforms: transforms || {},
  };

  function getCachedActionsForNode(node: SerializedGraphNode): Array<SerializedCachedAction> {
    return actionsByNodeId.get(node.id) || [];
  }

  function getNode(id: NodeId): SerializedGraphNode {
    return nodesById[id] || throwError(`Node not found: ${id}`);
  }

  function getOperation(id: OperationId): SerializedGraphOperation {
    return operationsById[id] || throwError(`Operation not found: ${id}`);
  }

  function getAction(id: ActionId): SerializedGraphAction {
    const actionCache = store.cache.actions[id];
    return (actionCache && actionCache.action) || throwError(`Action not found: ${id}`);
  }

  function getCachedAction(id: CachedActionId): SerializedCachedAction {
    return cachedActionsById[id] || throwError(`Cached action not found: ${id}`);
  }

  function throwError(message: string): never {
    throw new Error(message);
  }
}

function parseCacheTree(node: SerializedGraphNode, helpers: ParserHelpers): GraphTreeNode {
  const result = parseCacheTreeRecursive(node, new Set(), helpers, []);
  return (
    filterGraphTree(result, isVisibleAction) || {
      value: result.value,
      edges: [],
    }
  );
}

function filterGraphTree(
  root: GraphTreeNode,
  predicate: (node: SerializedGraphNode, operation: SerializedGraphOperation) => boolean,
): GraphTreeNode {
  return {
    value: root.value,
    edges: root.edges.reduce(
      (acc, edge) => [
        ...acc,
        ...(predicate(root.value, edge.value)
          ? [
              {
                value: edge.value,
                target: filterGraphTree(edge.target, predicate),
              },
            ]
          : []),
      ],
      [],
    ),
    path: root.path,
  };
}

function parseCacheTreeRecursive(
  node: SerializedGraphNode,
  visited: Set<NodeId>,
  helpers: ParserHelpers,
  path: Array<SerializedGraphOperation>,
): GraphTreeNode {
  const cachedNodeActions = helpers.getCachedActionsForNode(node);
  const transform = helpers.transforms[node.definition.$type] || identity;
  return transform({
    value: node,
    edges: visited.has(node.id)
      ? []
      : flatMap(cachedNodeActions, (cachedAction) => {
          const action = helpers.getAction(cachedAction.action);
          const operation = helpers.getOperation(action.operation);
          const childNode =
            cachedAction.value === undefined ? undefined : helpers.getNode(cachedAction.value);
          if (!childNode) {
            throw new Error(`Missing value for action ID: ${action.id}`);
          }
          return [
            {
              value: operation,
              target: parseCacheTreeRecursive(childNode, addToSet(node.id, visited), helpers, [
                ...path,
                operation,
              ]),
            },
          ];
        }),
    path,
  });
}

const VISIBLE_ACTION_TYPES = [
  EvaluateOperationType.name,
  GetChildOperationType.name,
  GetItemsOperationType.name,
];

function isVisibleAction(node: SerializedGraphNode, operation: SerializedGraphOperation): boolean {
  return VISIBLE_ACTION_TYPES.some((type) => operation.$operation === type);
}

function addToSet<T>(value: T, set: Set<T>): Set<T> {
  return new Set(set).add(value);
}
