import { isSetOperation, setOperation, SetOperation } from '../../operations/set';
import {
  isGraphOperation,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';

export interface QuerySetSetOperationNode
  extends StatelessGraphNode<'query-set-set-operation', QuerySetSetOperationNodeProperties> {}

export interface QuerySetSetOperationNodeDefinition
  extends StatelessNodeDefinition<'query-set-set-operation', QuerySetSetOperationNodeProperties> {}

export interface QuerySetSetOperationNodeProperties {
  operation: SetOperation;
}

export const QuerySetSetOperationNodeType: StatelessNodeType<
  'query-set-set-operation',
  QuerySetSetOperationNodeProperties
> = createNodeType<'query-set-set-operation', QuerySetSetOperationNodeProperties>(
  'query-set-set-operation',
  {
    shape: {
      operation: graphTypes.graphOperation,
    },
    operations: {},
  },
);

export function querySetSetOperation(operation: SetOperation): QuerySetSetOperationNodeDefinition;
export function querySetSetOperation(value: NodeDefinition): QuerySetSetOperationNodeDefinition;
export function querySetSetOperation(
  operation: SetOperation | NodeDefinition,
): QuerySetSetOperationNodeDefinition {
  return createNodeDefinition(QuerySetSetOperationNodeType, {
    operation:
      isGraphOperation(operation) && isSetOperation(operation)
        ? operation
        : setOperation(operation),
  });
}

export function isQuerySetSetOperationNodeDefinition(
  value: NodeDefinition,
): value is QuerySetSetOperationNodeDefinition {
  return value.type === QuerySetSetOperationNodeType;
}
