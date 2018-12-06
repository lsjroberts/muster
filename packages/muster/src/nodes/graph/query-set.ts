import zip from 'lodash/zip';
import { evaluateOperation, isEvaluateOperation } from '../../operations/evaluate';
import { getItemsOperation } from '../../operations/get-items';
import { identityOperation } from '../../operations/identity';
import { isResolveOperation, resolveOperation } from '../../operations/resolve';
import {
  DisposeCallback,
  GraphAction,
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import { valueOf } from '../../utils/value-of';
import withScopeFrom from '../../utils/with-scope-from';
import withTransaction from '../../utils/with-transaction';
import { array, ArrayNode, ArrayNodeType } from '../collection/array';
import { nodeList, NodeListNode, NodeListNodeType } from '../collection/node-list';
import { call } from './call';
import { CreateCallerNodeDefinition, isCreateCallerNodeDefinition } from './create-caller';
import { CreateSetterNodeDefinition, isCreateSetterNodeDefinition } from './create-setter';
import { error, ErrorNodeType, withErrorPath } from './error';
import { fuzzyTraverse } from './fuzzy-traverse';
import { getPath } from './get';
import { ifError } from './if-error';
import { ifPending } from './if-pending';
import { ItemPlaceholderNodeType } from './item-placeholder';
import { NilNodeType } from './nil';
import { ok } from './ok';
import { pending, PendingNodeType } from './pending';
import { PlaceholderNodeType } from './placeholder';
import {
  isQuerySetCallOperationNodeDefinition,
  QuerySetCallOperationNodeDefinition,
} from './query-set-call-operation';
import {
  isQuerySetCatchErrorNodeDefinition,
  QuerySetCatchErrorNodeDefinition,
} from './query-set-catch-error';
import { isQuerySetDeferNodeDefinition, QuerySetDeferNodeDefinition } from './query-set-defer';
import {
  isQuerySetGetChildOperationNodeDefinition,
  QuerySetGetChildOperationNode,
  QuerySetGetChildOperationNodeDefinition,
} from './query-set-get-child-operation';
import {
  isQuerySetGetItemsOperationNodeDefinition,
  QuerySetGetItemsOperationNode,
  QuerySetGetItemsOperationNodeDefinition,
} from './query-set-get-items-operation';
import {
  isQuerySetIsPendingNodeDefinition,
  QuerySetIsPendingNodeDefinition,
} from './query-set-is-pending';
import {
  isQuerySetOperationNodeDefinition,
  QuerySetOperationNode,
  QuerySetOperationNodeDefinition,
} from './query-set-operation';
import {
  isQuerySetSetOperationNodeDefinition,
  QuerySetSetOperationNodeDefinition,
} from './query-set-set-operation';
import { resolve } from './resolve';
import { set } from './set';
import { takeLast } from './take-last';
import { value, ValueNode } from './value';

export interface QuerySetNode extends StatelessGraphNode<'query-set', QuerySetNodeProperties> {}

export interface QuerySetNodeDefinition
  extends StatelessNodeDefinition<'query-set', QuerySetNodeProperties> {}

export type SerializableQuerySetChild =
  | QuerySetOperationNodeDefinition
  | QuerySetGetChildOperationNodeDefinition
  | QuerySetGetItemsOperationNodeDefinition
  | QuerySetCallOperationNodeDefinition
  | QuerySetSetOperationNodeDefinition;

export function isSerializableQuerySetChild(
  node: NodeDefinition,
): node is SerializableQuerySetChild {
  return (
    isQuerySetOperationNodeDefinition(node) ||
    isQuerySetGetChildOperationNodeDefinition(node) ||
    isQuerySetGetItemsOperationNodeDefinition(node) ||
    isQuerySetCallOperationNodeDefinition(node) ||
    isQuerySetSetOperationNodeDefinition(node)
  );
}

export type QuerySetChild =
  | SerializableQuerySetChild
  | CreateCallerNodeDefinition
  | CreateSetterNodeDefinition
  | QuerySetCatchErrorNodeDefinition
  | QuerySetDeferNodeDefinition
  | QuerySetIsPendingNodeDefinition;

export function isQuerySetChild(node: NodeDefinition): node is QuerySetChild {
  return (
    isSerializableQuerySetChild(node) ||
    isCreateCallerNodeDefinition(node) ||
    isCreateSetterNodeDefinition(node) ||
    isQuerySetCatchErrorNodeDefinition(node) ||
    isQuerySetDeferNodeDefinition(node) ||
    isQuerySetIsPendingNodeDefinition(node)
  );
}

interface QuerySetOptions {
  bubbleErrorsToTop: boolean;
}

const DEFAULT_QUERY_SET_OPTIONS: QuerySetOptions = {
  bubbleErrorsToTop: false,
};

export interface QuerySetNodeProperties {
  children: Array<QuerySetChild>;
  options: QuerySetOptions;
  root: NodeDefinition;
}

export const QuerySetNodeType: StatelessNodeType<
  'query-set',
  QuerySetNodeProperties
> = createNodeType<'query-set', QuerySetNodeProperties>('query-set', {
  shape: {
    children: types.optional(types.arrayOf(graphTypes.nodeDefinition)),
    options: types.shape({
      bubbleErrorsToTop: types.bool,
    }),
    root: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      run(node: QuerySetNode): NodeDefinition {
        const { children, options, root } = node.definition.properties;
        return resolveOperations(withScopeFrom(node, root), children, withScopeFrom(
          node,
          value(options),
        ) as ValueNode<QuerySetOptions>);
      },
    },
  },
});

export function querySet(
  root: NodeLike,
  children: Array<QuerySetChild>,
  options?: Partial<QuerySetOptions>,
): QuerySetNodeDefinition {
  return createNodeDefinition(QuerySetNodeType, {
    children,
    root: toNode(root),
    options: options ? { ...DEFAULT_QUERY_SET_OPTIONS, ...options } : DEFAULT_QUERY_SET_OPTIONS,
  });
}

export function isQuerySetNodeDefinition(value: NodeDefinition): value is QuerySetNodeDefinition {
  return value.type === QuerySetNodeType;
}

function resolveOperations(
  parent: GraphNode,
  children: Array<QuerySetChild>,
  options: ValueNode<QuerySetOptions>,
): NodeDefinition {
  const { bubbleErrorsToTop } = options.definition.properties.value;
  return resolve(
    children.map(
      (child): GraphAction | NodeDependency => {
        if (isQuerySetGetChildOperationNodeDefinition(child)) {
          return resolveGetChildOperation(parent, child, options);
        }
        if (isQuerySetOperationNodeDefinition(child)) {
          return resolveQuerySetOperation(parent, child, options);
        }
        if (isQuerySetGetItemsOperationNodeDefinition(child)) {
          return resolveGetItemsOperation(parent, child, options);
        }
        if (isQuerySetCallOperationNodeDefinition(child)) {
          return resolveQuerySetCallOperation(parent, child, options);
        }
        if (isQuerySetSetOperationNodeDefinition(child)) {
          return resolveQuerySetSetOperation(parent, child, options);
        }
        if (isCreateCallerNodeDefinition(child)) {
          return createCallerFunction(parent, child);
        }
        if (isCreateSetterNodeDefinition(child)) {
          return createSetterFunction(parent, child);
        }
        if (isQuerySetCatchErrorNodeDefinition(child)) {
          return resolveQuerySetCatchError(parent, child, options);
        }
        if (isQuerySetDeferNodeDefinition(child)) {
          return resolveQuerySetDefer(parent, child, options);
        }
        if (isQuerySetIsPendingNodeDefinition(child)) {
          return resolveQuerySetIsPending(parent, child, options);
        }
        // Someone was a bit careless and used an incorrect type of child...
        const invalidTypeError = getInvalidTypeErrorMessage('Incorrect type of query set child.', {
          expected: ['operation', 'get-child', 'get-items'],
          received: child,
        });
        return createGraphAction(
          withScopeFrom(parent, error(invalidTypeError)),
          identityOperation(),
        );
      },
    ),
    bubbleErrorsToTop ? firstErrorOrToNodeDefinitionArray : toNodeDefinitionArray,
  );
}

function toNodeDefinitionArray(graphNodes: Array<GraphNode>): NodeDefinition {
  if (graphNodes.some(PendingNodeType.is)) return pending();
  return array(graphNodes.map((node) => assignPathIfError(node).definition));
}

function firstErrorOrToNodeDefinitionArray(
  graphNodes: Array<GraphNode>,
): GraphNode | NodeDefinition {
  const firstError = graphNodes.find(ErrorNodeType.is);
  return firstError || toNodeDefinitionArray(graphNodes);
}

function resolveQuerySetCallOperation(
  parent: GraphNode,
  child: QuerySetCallOperationNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): NodeDependency {
  const { args } = child.properties.operation.properties;
  return {
    target: withScopeFrom(parent, args ? call(parent.definition, args) : call(parent.definition)),
    allowErrors: !options.definition.properties.value.bubbleErrorsToTop,
  };
}

function createEmptyDisposeEmitter() {
  return () => () => {};
}

function createCallerFunction(parent: GraphNode, child: CreateCallerNodeDefinition): GraphAction {
  return createGraphAction(
    withScopeFrom(
      parent,
      value(async (...args: Array<NodeLike>) => {
        if (!child.properties.matcher(args)) {
          throw new Error(`Invalid arguments received by the caller '${child.properties.key}'.`);
        }
        const callNodeDefinition = call(parent.definition, [child.properties.key], args);
        const callNode = withScopeFrom(parent, callNodeDefinition);
        const result = await resolveTransaction(
          callNode,
          child.properties.disposeEmitter || createEmptyDisposeEmitter(),
        );
        if (ErrorNodeType.is(result)) {
          throw valueOf(result);
        }
        return valueOf(result);
      }),
    ),
    identityOperation(),
  );
}

function createSetterFunction(parent: GraphNode, child: CreateSetterNodeDefinition): GraphAction {
  return createGraphAction(
    withScopeFrom(
      parent,
      value(async (value: NodeLike) => {
        if (!child.properties.matcher(value)) {
          throw new Error(`Invalid value received by the setter '${child.properties.key}'.`);
        }
        const setNodeDefinition = set(parent.definition, child.properties.key, value);
        const setNode = withScopeFrom(parent, setNodeDefinition);
        const result = await resolveTransaction(
          setNode,
          child.properties.disposeEmitter || createEmptyDisposeEmitter(),
        );
        if (ErrorNodeType.is(result)) {
          throw valueOf(result);
        }
        return valueOf(result);
      }),
    ),
    identityOperation(),
  );
}

function unwrapResult([result]: [ArrayNode]): GraphNode {
  return withScopeFrom(result, result.definition.properties.items[0]);
}

function resolveQuerySetCatchError(
  parent: GraphNode,
  child: QuerySetCatchErrorNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): NodeDependency {
  const { bubbleErrorsToTop } = options.definition.properties.value;
  const { fallbackGenerator, target } = child.properties;
  const resolveTargetAndUnwrapResult = resolve(
    [
      {
        target: resolveOperations(
          parent,
          [target],
          bubbleErrorsToTop
            ? options
            : (withScopeFrom(
                options,
                value({
                  ...options.definition.properties.value,
                  bubbleErrorsToTop: true,
                }),
              ) as ValueNode<QuerySetOptions>),
        ),
        acceptNil: true,
      },
    ],
    unwrapResult,
  );
  return {
    target: withScopeFrom(parent, ifError(fallbackGenerator, resolveTargetAndUnwrapResult)),
    acceptNil: true,
    allowErrors: !bubbleErrorsToTop,
  };
}

function resolveQuerySetDefer(
  parent: GraphNode,
  child: QuerySetDeferNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): NodeDependency {
  const { fallbackGenerator, target } = child.properties;
  const resolveTargetAndUnwrapResult = resolve(
    [
      {
        target: resolveOperations(parent, [target], options),
        acceptNil: true,
      },
    ],
    unwrapResult,
  );
  return {
    target: withScopeFrom(parent, ifPending(fallbackGenerator, resolveTargetAndUnwrapResult)),
    acceptNil: true,
    allowErrors: !options.definition.properties.value.bubbleErrorsToTop,
  };
}

function isNotPending(): NodeDefinition {
  return value(false);
}

function resolveQuerySetIsPending(
  parent: GraphNode,
  child: QuerySetIsPendingNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): NodeDependency {
  const { target } = child.properties;
  const resolveTarget = resolve(
    [{ target: resolveOperations(parent, [target], options) }],
    isNotPending,
  );
  return {
    target: withScopeFrom(parent, ifPending(trueFallback, resolveTarget)),
    acceptNil: true,
    allowErrors: options.definition.properties.value.bubbleErrorsToTop,
  };
}

function trueFallback() {
  return true;
}

function resolveQuerySetSetOperation(
  parent: GraphNode,
  child: QuerySetSetOperationNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): NodeDependency {
  return {
    target: withScopeFrom(
      parent,
      takeLast([set(parent.definition, child.properties.operation.properties.value), ok()]),
    ),
    acceptNil: true,
    allowErrors: !options.definition.properties.value.bubbleErrorsToTop,
  };
}

function resolveQuerySetOperation(
  parent: GraphNode,
  child: QuerySetOperationNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): GraphAction {
  const { children, operation } = child.properties;
  const parentAction =
    isResolveOperation(operation) || isEvaluateOperation(operation)
      ? createGraphAction(parent, operation)
      : createGraphAction(
          withScopeFrom(parent, fuzzyTraverse(parent, operation)),
          evaluateOperation(),
        );
  if (!children) {
    return parentAction;
  }
  return createGraphAction(
    withScopeFrom(
      parent,
      resolve(
        [
          parentAction,
          createGraphAction(withScopeFrom(parent, child), identityOperation()),
          createGraphAction(options, identityOperation()),
        ],
        resolveQuerySetOperation_children,
      ),
    ),
    resolveOperation(),
  );
}

function resolveQuerySetOperation_children([result, child, options]: [
  GraphNode,
  QuerySetOperationNode,
  ValueNode<QuerySetOptions>
]): GraphNode {
  return withScopeFrom(
    result,
    resolveOperations(result, child.definition.properties.children!, options),
  );
}

function resolveGetChildOperation(
  parent: GraphNode,
  child: QuerySetGetChildOperationNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): NodeDependency | GraphAction {
  const { children } = child.properties;
  const traverseOperationNode = withScopeFrom(
    parent,
    fuzzyTraverse(parent, child.properties.operation),
  );
  const { bubbleErrorsToTop } = options.definition.properties.value;
  if (!children) {
    return createGraphAction(
      traverseOperationNode,
      resolveOperation({
        acceptNil: true,
        allowErrors: !bubbleErrorsToTop,
        allowPending: false,
      }),
    );
  }
  return {
    target: withScopeFrom(
      parent,
      resolve(
        [
          createGraphAction(traverseOperationNode, evaluateOperation()),
          createGraphAction(withScopeFrom(parent, child), identityOperation()),
          createGraphAction(options, identityOperation()),
        ],
        // Run child operations
        resolveGetChildOperation_children,
      ),
    ),
    acceptNil: true,
    allowErrors: !bubbleErrorsToTop,
  };
}

function resolveGetChildOperation_children([result, child, options]: [
  GraphNode,
  QuerySetGetChildOperationNode,
  ValueNode<QuerySetOptions>
]): GraphNode {
  return withScopeFrom(
    result,
    resolveOperations(result, child.definition.properties.children!, options),
  );
}

function resolveGetItemsOperation(
  parent: GraphNode,
  child: QuerySetGetItemsOperationNodeDefinition,
  options: ValueNode<QuerySetOptions>,
): NodeDependency {
  const { children, operation } = child.properties;
  return {
    acceptNil: true,
    target: withScopeFrom(
      parent,
      resolve(
        // Resolve the parent until it supports the correct operation, then resolve the result
        [
          createGraphAction(
            withScopeFrom(parent, fuzzyTraverse(parent, operation || getItemsOperation())),
            resolveOperation({
              acceptNil: true,
              allowErrors: !options.definition.properties.value.bubbleErrorsToTop,
              allowPending: false,
              until: children ? untilValidGetItemsResult : undefined,
            }),
          ),
          createGraphAction(withScopeFrom(parent, child), identityOperation()),
          createGraphAction(options, identityOperation()),
        ],
        resolveGetItemsOperation_processItems,
      ),
    ),
  };
}

function resolveGetItemsOperation_processItems([result, child, options]: [
  GraphNode,
  QuerySetGetItemsOperationNode,
  ValueNode<QuerySetOptions>
]): NodeDefinition | GraphNode {
  const { children } = child.definition.properties;
  // Check if the result of the operation is a placeholder - apply the child operations if
  // it is
  if (PlaceholderNodeType.is(result)) {
    return resolve([{ target: resolveOperations(result, children!, options) }], returnPending);
  }
  // Verify the result is correct type
  if (!ArrayNodeType.is(result) && !NodeListNodeType.is(result)) {
    // Something went wrong, there must be an error in the `result`
    return result;
  }
  // Get the items
  const itemsArray: Array<GraphNode | NodeDefinition> = result.definition.properties.items;
  const items: Array<GraphNode> = itemsArray.map((item) =>
    isGraphNode(item) ? item : withScopeFrom(result, item),
  );
  // Check if there are any children operations - return items if not
  if (!children) return toNodeDefinitionArray(items);
  // Resolve operations for each item in the collection
  return resolve(
    [
      createGraphAction(withScopeFrom(result, nodeList(items)), identityOperation()),
      ...items.map((item) => ({
        target: resolveOperations(item, children, options),
      })),
    ],
    resolveGetItemsOperation_getItems,
  );
}

function returnPending() {
  return pending();
}

function resolveGetItemsOperation_getItems([originalItems, ...resolvedItems]: [
  NodeListNode,
  GraphNode
]): NodeDefinition {
  return toNodeDefinitionArray(zip(originalItems.definition.properties.items, resolvedItems)
    .filter(
      ([item]: [GraphNode, GraphNode]) =>
        !ItemPlaceholderNodeType.is(item) || !item.definition.properties.isEmpty,
    )
    .map(([item, resolvedItem]) => resolvedItem) as Array<GraphNode>);
}

const untilValidGetItemsResult = {
  predicate(node: GraphNode) {
    return (
      ArrayNodeType.is(node) ||
      NodeListNodeType.is(node) ||
      PlaceholderNodeType.is(node) ||
      NilNodeType.is(node) ||
      ErrorNodeType.is(node)
    );
  },
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Iterable node resolved to incorrect graph node.', {
      expected: [ArrayNodeType, NodeListNodeType, NilNodeType, PlaceholderNodeType],
      received: node.definition,
    });
  },
};

function assignPathIfError<T extends GraphNode>(node: T): T {
  if (!ErrorNodeType.is(node)) return node;
  return withScopeFrom(node, withErrorPath(node.definition, { path: getPath(node.context) })) as T;
}

function resolveTransaction(
  node: GraphNode,
  disposeEmitter: (listener: () => void) => DisposeCallback,
): Promise<GraphNode> {
  const store = node.scope.store;
  return new Promise((resolve, reject) => {
    withTransaction(node.scope, () => {
      try {
        let isAsync = false;
        let isCompleted = false;
        let unsubscribe: () => void;
        const unsubscribeDispose = disposeEmitter(() => {
          unsubscribe();
          unsubscribeDispose();
        });
        unsubscribe = store.subscribe(node, resolveOperation(), (value: GraphNode) => {
          if (PendingNodeType.is(value)) {
            return;
          }
          isCompleted = true;
          resolve(value);
          if (isAsync) {
            unsubscribeDispose();
            unsubscribe();
          }
        });
        isAsync = true;
        if (isCompleted) {
          unsubscribeDispose();
          unsubscribe();
        }
      } catch (ex) {
        reject(ex);
      }
    });
  });
}
