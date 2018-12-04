import {
  GraphOperation,
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

export interface QuerySetOperationNode
  extends StaticGraphNode<'query-set-operation', QuerySetOperationNodeProperties> {}

export interface QuerySetOperationNodeDefinition
  extends StaticNodeDefinition<'query-set-operation', QuerySetOperationNodeProperties> {}

export interface QuerySetOperationNodeProperties {
  children?: Array<QuerySetChild>;
  operation: GraphOperation;
}

export const QuerySetOperationNodeType: StaticNodeType<
  'query-set-operation',
  QuerySetOperationNodeProperties
> = createNodeType<'query-set-operation', QuerySetOperationNodeProperties>('query-set-operation', {
  shape: {
    children: types.optional(types.arrayOf(graphTypes.nodeDefinition)),
    operation: graphTypes.graphOperation,
  },
});

export function querySetOperation(
  operation: GraphOperation,
  children?: Array<QuerySetChild>,
): QuerySetOperationNodeDefinition {
  return createNodeDefinition(QuerySetOperationNodeType, {
    operation,
    children,
  } as QuerySetOperationNodeProperties);
}

export function isQuerySetOperationNodeDefinition(
  value: NodeDefinition,
): value is QuerySetOperationNodeDefinition {
  return value.type === QuerySetOperationNodeType;
}
