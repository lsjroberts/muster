import {
  getChildOperation,
  GetChildOperation,
  isGetChildOperation,
} from '../../operations/get-child';
import {
  ChildKey,
  isGraphOperation,
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

export interface QuerySetGetChildOperationNode
  extends StaticGraphNode<
      'query-set-get-child-operation',
      QuerySetGetChildOperationNodeProperties
    > {}

export interface QuerySetGetChildOperationNodeDefinition
  extends StaticNodeDefinition<
      'query-set-get-child-operation',
      QuerySetGetChildOperationNodeProperties
    > {}

export interface QuerySetGetChildOperationNodeProperties {
  children?: Array<QuerySetChild>;
  operation: GetChildOperation;
}

export const QuerySetGetChildOperationNodeType: StaticNodeType<
  'query-set-get-child-operation',
  QuerySetGetChildOperationNodeProperties
> = createNodeType<'query-set-get-child-operation', QuerySetGetChildOperationNodeProperties>(
  'query-set-get-child-operation',
  {
    shape: {
      children: types.optional(types.arrayOf(graphTypes.nodeDefinition)),
      operation: graphTypes.graphOperation,
    },
  },
);

export function querySetGetChildOperation(
  operation: GetChildOperation,
  children?: Array<QuerySetChild>,
): QuerySetGetChildOperationNodeDefinition;
export function querySetGetChildOperation(
  key: ChildKey,
  children?: Array<QuerySetChild>,
): QuerySetGetChildOperationNodeDefinition;
export function querySetGetChildOperation(
  operation: GetChildOperation | ChildKey,
  children?: Array<QuerySetChild>,
): QuerySetGetChildOperationNodeDefinition {
  return createNodeDefinition(QuerySetGetChildOperationNodeType, {
    children,
    operation:
      isGraphOperation(operation) && isGetChildOperation(operation)
        ? operation
        : getChildOperation(operation),
  } as QuerySetGetChildOperationNodeProperties);
}

export function isQuerySetGetChildOperationNodeDefinition(
  value: NodeDefinition,
): value is QuerySetGetChildOperationNodeDefinition {
  return value.type === QuerySetGetChildOperationNodeType;
}
