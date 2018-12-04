import { getItemsOperation, GetItemsOperation } from '../../operations/get-items';
import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { QuerySetChild } from './query-set';

export interface QuerySetGetItemsOperationNode
  extends StaticGraphNode<
      'query-set-get-items-operation',
      QuerySetGetItemsOperationNodeProperties
    > {}

export interface QuerySetGetItemsOperationNodeDefinition
  extends StaticNodeDefinition<
      'query-set-get-items-operation',
      QuerySetGetItemsOperationNodeProperties
    > {}

export interface QuerySetGetItemsOperationNodeProperties {
  children?: Array<QuerySetChild>;
  operation: GetItemsOperation;
}

export const QuerySetGetItemsOperationNodeType: StaticNodeType<
  'query-set-get-items-operation',
  QuerySetGetItemsOperationNodeProperties
> = createNodeType<'query-set-get-items-operation', QuerySetGetItemsOperationNodeProperties>(
  'query-set-get-items-operation',
  {
    shape: {
      children: types.optional(types.arrayOf(graphTypes.nodeDefinition)),
      operation: graphTypes.graphOperation,
    },
  },
);

export function querySetGetItemsOperation(options?: {
  children?: Array<QuerySetChild>;
  operation?: GetItemsOperation;
}): QuerySetGetItemsOperationNodeDefinition {
  return createNodeDefinition(QuerySetGetItemsOperationNodeType, {
    children: options && options.children,
    operation: (options && options.operation) || getItemsOperation(),
  } as QuerySetGetItemsOperationNodeProperties);
}

export function isQuerySetGetItemsOperationNodeDefinition(
  value: NodeDefinition,
): value is QuerySetGetItemsOperationNodeDefinition {
  return value.type === QuerySetGetItemsOperationNodeType;
}
