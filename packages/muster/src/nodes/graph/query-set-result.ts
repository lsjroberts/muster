import { CallOperation } from '../../operations/call';
import { isEvaluateOperation } from '../../operations/evaluate';
import { GetChildOperation } from '../../operations/get-child';
import { GetItemsOperation } from '../../operations/get-items';
import { isResolveOperation } from '../../operations/resolve';
import {
  NodeDefinition,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import getType from '../../utils/get-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { ArrayNodeDefinition, ArrayNodeType, isArrayNodeDefinition } from '../collection/array';
import { error } from './error';
import { notFound } from './not-found';
import { QuerySetChild } from './query-set';
import { isQuerySetCallOperationNodeDefinition } from './query-set-call-operation';
import {
  isQuerySetGetChildOperationNodeDefinition,
  QuerySetGetChildOperationNodeDefinition,
} from './query-set-get-child-operation';
import {
  isQuerySetGetItemsOperationNodeDefinition,
  QuerySetGetItemsOperationNodeDefinition,
} from './query-set-get-items-operation';
import {
  isQuerySetOperationNodeDefinition,
  QuerySetOperationNodeDefinition,
} from './query-set-operation';
import { isQuerySetSetOperationNodeDefinition } from './query-set-set-operation';

export interface QuerySetResultNode
  extends StatefulGraphNode<
      'query-set-result',
      QuerySetResultNodeProperties,
      QuerySetResultNodeState,
      QuerySetResultNodeData
    > {}

export interface QuerySetResultNodeDefinition
  extends StatefulNodeDefinition<
      'query-set-result',
      QuerySetResultNodeProperties,
      QuerySetResultNodeState,
      QuerySetResultNodeData
    > {}

export interface QuerySetResultNodeProperties {
  queries: Array<QuerySetChild>;
  result: ArrayNodeDefinition;
}

export interface QuerySetResultNodeState {}

export interface QuerySetResultNodeData {}

export const QuerySetResultNodeType: StatefulNodeType<
  'query-set-result',
  QuerySetResultNodeProperties,
  QuerySetResultNodeState,
  QuerySetResultNodeData
> = createNodeType<
  'query-set-result',
  QuerySetResultNodeProperties,
  QuerySetResultNodeState,
  QuerySetResultNodeData
>('query-set-result', {
  shape: {
    queries: types.arrayOf(graphTypes.nodeDefinition),
    result: graphTypes.nodeDefinition,
  },
  state: {},
  getInitialState() {
    return {};
  },
  operations: {
    call: {
      run(node: QuerySetResultNode, operation: CallOperation): NodeDefinition {
        const { queries, result } = node.definition.properties;
        const queryIndex = queries.findIndex(
          (query) =>
            isQuerySetCallOperationNodeDefinition(query) &&
            query.properties.operation.id === operation.id,
        );
        if (queryIndex === -1) {
          return error(`Could not find 'call' result for operation: ${operation.id}`);
        }
        const query = queries[queryIndex] as QuerySetOperationNodeDefinition;
        const queryResult = result.properties.items[queryIndex];
        if (!query.properties.children) {
          return queryResult;
        }
        if (!isArrayNodeDefinition(queryResult)) {
          return error(
            getInvalidTypeErrorMessage('Invalid query result', {
              expected: ArrayNodeType,
              received: queryResult,
            }),
          );
        }
        return querySetResult(query.properties.children, queryResult);
      },
    },
    evaluate: {
      run(node: QuerySetResultNode): NodeDefinition {
        const { queries, result } = node.definition.properties;
        const queryIndex = queries.findIndex(
          (query) =>
            isQuerySetOperationNodeDefinition(query) &&
            (isEvaluateOperation(query.properties.operation) ||
              isResolveOperation(query.properties.operation)),
        );
        if (queryIndex === -1) {
          return error('Node does not support `evaluate` operation.');
        }
        const query = queries[queryIndex] as QuerySetOperationNodeDefinition;
        const queryResult = result.properties.items[queryIndex];
        if (!query.properties.children) {
          return queryResult;
        }
        if (!isArrayNodeDefinition(queryResult)) {
          return error(
            getInvalidTypeErrorMessage('Invalid query result', {
              expected: ArrayNodeType,
              received: queryResult,
            }),
          );
        }
        return querySetResult(query.properties.children, queryResult);
      },
    },
    getChild: {
      run(node: QuerySetResultNode, operation: GetChildOperation): NodeDefinition {
        const { queries, result } = node.definition.properties;
        const queryIndex = queries.findIndex(
          (query) =>
            isQuerySetGetChildOperationNodeDefinition(query) &&
            query.properties.operation.id === operation.id,
        );
        if (queryIndex === -1) {
          const { key } = operation.properties;
          return notFound(`Could not find 'getChild' result for key: ${getType(key)}`);
        }
        const query = queries[queryIndex] as QuerySetGetChildOperationNodeDefinition;
        const queryResult = result.properties.items[queryIndex];
        if (!query.properties.children) {
          return queryResult;
        }
        if (!isArrayNodeDefinition(queryResult)) {
          return error(
            getInvalidTypeErrorMessage('Invalid query result', {
              expected: ArrayNodeType,
              received: queryResult,
            }),
          );
        }
        return querySetResult(query.properties.children, queryResult);
      },
    },
    getItems: {
      run(node: QuerySetResultNode, operation: GetItemsOperation): NodeDefinition {
        const { queries, result } = node.definition.properties;
        const queryIndex = queries.findIndex(
          (query) =>
            isQuerySetGetItemsOperationNodeDefinition(query) &&
            (query.properties.operation
              ? query.properties.operation.id === operation.id
              : operation.properties.transforms.length === 0),
        );
        if (queryIndex === -1) {
          return error(`Could not find 'getItems' result for operation: ${operation.id}.`);
        }
        const query = queries[queryIndex] as QuerySetGetItemsOperationNodeDefinition;
        const queryResult = result.properties.items[queryIndex];
        if (!query.properties.children) {
          return queryResult;
        }
        if (!isArrayNodeDefinition(queryResult)) {
          return error(
            getInvalidTypeErrorMessage('Invalid query result', {
              expected: ArrayNodeType,
              received: queryResult,
            }),
          );
        }
        return querySetResult(query.properties.children, queryResult);
      },
    },
    set: {
      run(node: QuerySetResultNode, operation: CallOperation): NodeDefinition {
        const { queries, result } = node.definition.properties;
        const queryIndex = queries.findIndex(
          (query) =>
            isQuerySetSetOperationNodeDefinition(query) &&
            query.properties.operation.id === operation.id,
        );
        if (queryIndex === -1) {
          return error(`Could not find 'set' result for operation: ${operation.id}`);
        }
        const query = queries[queryIndex] as QuerySetGetItemsOperationNodeDefinition;
        const queryResult = result.properties.items[queryIndex];
        if (!query.properties.children) {
          return queryResult;
        }
        if (!isArrayNodeDefinition(queryResult)) {
          return error(
            getInvalidTypeErrorMessage('Invalid query result', {
              expected: ArrayNodeType,
              received: queryResult,
            }),
          );
        }
        return querySetResult(query.properties.children, queryResult);
      },
    },
  },
});

export function querySetResult(
  queries: Array<QuerySetChild>,
  result: ArrayNodeDefinition,
): QuerySetResultNodeDefinition {
  return createNodeDefinition(QuerySetResultNodeType, {
    queries,
    result,
  });
}

export function isQuerySetResultNodeDefinition(
  value: NodeDefinition,
): value is QuerySetResultNodeDefinition {
  return value.type === QuerySetResultNodeType;
}
