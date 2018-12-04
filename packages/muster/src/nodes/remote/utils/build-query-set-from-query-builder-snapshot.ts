import { isCallOperation } from '../../../operations/call';
import { isEvaluateOperation } from '../../../operations/evaluate';
import { GetChildOperation } from '../../../operations/get-child';
import { GetItemsOperation } from '../../../operations/get-items';
import { resolveOperation } from '../../../operations/resolve';
import { isSetOperation } from '../../../operations/set';
import { GraphOperation, isNodeDefinition, NodeDefinition } from '../../../types/graph';
import { getInvalidTypeError } from '../../../utils/get-invalid-type-error';
import {
  array,
  ArrayNodeDefinition,
  ArrayNodeType,
  isArrayNodeDefinition,
} from '../../collection/array';
import {
  emptyItem,
  EmptyItemNodeDefinition,
  isEmptyItemNodeDefinition,
} from '../../graph/empty-item';
import { error, isErrorNodeDefinition, withErrorPath } from '../../graph/error';
import {
  ItemOperationResult,
  itemPlaceholder,
  ItemPlaceholderNodeDefinition,
} from '../../graph/item-placeholder';
import { isNilNodeDefinition, NilNodeDefinition } from '../../graph/nil';
import { querySet, QuerySetNodeDefinition, SerializableQuerySetChild } from '../../graph/query-set';
import { querySetCallOperation } from '../../graph/query-set-call-operation';
import { querySetGetChildOperation } from '../../graph/query-set-get-child-operation';
import { querySetGetItemsOperation } from '../../graph/query-set-get-items-operation';
import { querySetOperation } from '../../graph/query-set-operation';
import { querySetSetOperation } from '../../graph/query-set-set-operation';
import { root } from '../../graph/root';
import { QueriesSnapshot } from './get-query-builder-snapshot';
import { QueryBuilder } from './query-builder';

export type QuerySetCallback = (node: NodeDefinition) => void;

export interface QuerySetWithCallback {
  callback: QuerySetCallback;
  node: QuerySetNodeDefinition;
}

export interface QuerySetOperationsWithCallback {
  callback: QuerySetCallback;
  children: Array<SerializableQuerySetChild>;
}

export function buildQuerySetFromQueryBuilderSnapshot(
  snapshot: QueriesSnapshot,
  queryBuilder: QueryBuilder,
): QuerySetWithCallback {
  const operationsWithCallbacks = buildQuerySetOperationsForQueriesSnapshot(snapshot, queryBuilder);
  return {
    callback(node) {
      operationsWithCallbacks.callback(node);
    },
    node: querySet(root(), operationsWithCallbacks.children),
  };
}

function buildQuerySetOperationsForQueriesSnapshot(
  snapshot: QueriesSnapshot,
  queryBuilder: QueryBuilder,
): QuerySetOperationsWithCallback {
  const callbacks: Array<QuerySetCallback> = [];
  const operations: Array<SerializableQuerySetChild> = [];
  // Add getChild operations and callbacks
  snapshot.getChild.forEach((getChild) => {
    const getChildOperationsWithCallbacks = buildQuerySetOperationsForQueriesSnapshot(
      getChild,
      getChild.queryBuilder,
    );
    operations.push(
      querySetGetChildOperation(
        getChild.pathPart.operation as GetChildOperation,
        getChildOperationsWithCallbacks.children,
      ),
    );
    callbacks.push(getChildOperationsWithCallbacks.callback);
  });
  // Add getItems operations and callbacks
  snapshot.getItems.forEach((getItems) => {
    const getItemsOperationsWithCallbacks = buildQuerySetOperationsForQueriesSnapshot(
      getItems,
      getItems.queryBuilder,
    );
    operations.push(
      querySetGetItemsOperation({
        children: getItemsOperationsWithCallbacks.children,
        operation: getItems.pathPart.operation as GetItemsOperation,
      }),
    );
    callbacks.push((node) => {
      const request = queryBuilder.findRequest(getItems.path);
      if (!request) return;
      // Special handling for the nil node - make sure to subscribe to all child operations
      if (isNilNodeDefinition(node)) {
        const items = array([createItemPlaceholderFromResult(getItems, node, true)]);
        request.setValue(items);
        return;
      }
      // Make sure this is an array node
      if (!isArrayNodeDefinition(node)) {
        const sanitizedNode = !isErrorNodeDefinition(node)
          ? error(
              getInvalidTypeError('Invalid type of getItems response', {
                expected: [ArrayNodeType],
                received: node,
              }),
            )
          : node;
        request.setValue(assignRemotePathIfError(sanitizedNode));
        return;
      }
      if (node.properties.items.length === 0) {
        request.setValue(array([createItemPlaceholderFromResult(getItems, emptyItem(), true)]));
        return;
      }
      const items = array(
        node.properties.items.map((item) =>
          createItemPlaceholderFromResult(getItems, item as ArrayNodeDefinition),
        ),
      );
      request.setValue(items);
    });
  });
  // Add call operations and callbacks
  snapshot.otherOperations.forEach((call) => {
    operations.push(getQuerySetChildForPathPart(call.pathPart.operation));
    callbacks.push((node) => {
      const request = queryBuilder.findRequest(call.path);
      if (!request) return;
      request.setValue(assignRemotePathIfError(node));
    });
  });

  // Return the callback and combined operations
  return {
    callback(node) {
      // Validate the response type
      if (!isArrayNodeDefinition(node)) {
        const sanitizedError = !isErrorNodeDefinition(node)
          ? error(
              getInvalidTypeError('Incorrect type of the node received.', {
                expected: [ArrayNodeType],
                received: node,
              }),
            )
          : node;
        callbacks.forEach((callback) => callback(sanitizedError));
        return;
      }
      node.properties.items.forEach((item, itemIndex) => {
        callbacks[itemIndex](item);
      });
    },
    children: operations,
  };
}

function getQuerySetChildForPathPart(operation: GraphOperation): SerializableQuerySetChild {
  if (isCallOperation(operation)) {
    return querySetCallOperation(operation);
  }
  if (isSetOperation(operation)) {
    return querySetSetOperation(operation);
  }
  return querySetOperation(
    isEvaluateOperation(operation)
      ? resolveOperation({
          acceptNil: true,
          allowErrors: false,
          allowPending: false,
        })
      : operation,
  );
}

function createItemPlaceholderFromResult(
  snapshot: QueriesSnapshot,
  result: ArrayNodeDefinition | EmptyItemNodeDefinition | NilNodeDefinition,
  isEmpty: boolean = false,
): ItemPlaceholderNodeDefinition {
  const results = isArrayNodeDefinition(result) ? result.properties.items.slice(0) : result;
  const values: Array<ItemOperationResult> = [];
  if (snapshot.getChild.length > 0) {
    values.push(
      ...snapshot.getChild.map((getChild) => ({
        node: createItemPlaceholderFromResult(getChild, getNextResult(), isEmpty),
        pathPart: getChild.pathPart,
      })),
    );
  }
  if (snapshot.getItems.length > 0) {
    values.push(
      ...snapshot.getItems.map((getItems) => {
        const getItemsResult = getNextResult()!;
        if (isEmptyItemNodeDefinition(getItemsResult)) {
          return {
            node: array([createItemPlaceholderFromResult(getItems, getItemsResult, isEmpty)]),
            pathPart: getItems.pathPart,
          };
        }
        if (!isArrayNodeDefinition(getItemsResult) && !isNilNodeDefinition(getItemsResult)) {
          return {
            node: getItemsResult,
            pathPart: getItems.pathPart,
          };
        }
        return {
          node: array(
            isNilNodeDefinition(getItemsResult)
              ? [createItemPlaceholderFromResult(getItems, getItemsResult, true)]
              : getItemsResult.properties.items.map((item) =>
                  createItemPlaceholderFromResult(getItems, item as ArrayNodeDefinition, isEmpty),
                ),
          ),
          pathPart: getItems.pathPart,
        };
      }),
    );
  }
  if (snapshot.otherOperations.length > 0) {
    values.push(
      ...snapshot.otherOperations.map((other) => ({
        node: assignRemotePathIfError(getNextResult()),
        pathPart: other.pathPart,
      })),
    );
  }
  return itemPlaceholder(snapshot.queryBuilder, snapshot.path, values, isEmpty);

  function getNextResult(): NodeDefinition {
    if (isNodeDefinition(results)) return results;
    return results.shift()! as ArrayNodeDefinition;
  }
}

function assignRemotePathIfError<T extends NodeDefinition>(node: T): T {
  if (!isErrorNodeDefinition(node)) return node;
  const { path } = node.properties;
  if (!path) return node;
  return withErrorPath(node, { remotePath: path }) as T;
}
