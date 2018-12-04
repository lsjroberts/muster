import {
  CallArgumentArray,
  CallArgumentMap,
  callOperation,
  CallOperation,
  isCallOperation,
} from '../../operations/call';
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

export interface QuerySetCallOperationNode
  extends StatelessGraphNode<'query-set-call-operation', QuerySetCallOperationNodeProperties> {}

export interface QuerySetCallOperationNodeDefinition
  extends StatelessNodeDefinition<
      'query-set-call-operation',
      QuerySetCallOperationNodeProperties
    > {}

export interface QuerySetCallOperationNodeProperties {
  operation: CallOperation;
}

export const QuerySetCallOperationNodeType: StatelessNodeType<
  'query-set-call-operation',
  QuerySetCallOperationNodeProperties
> = createNodeType<'query-set-call-operation', QuerySetCallOperationNodeProperties>(
  'query-set-call-operation',
  {
    shape: {
      operation: graphTypes.graphOperation,
    },
    operations: {},
  },
);

export function querySetCallOperation(
  args?: CallArgumentArray | CallArgumentMap,
): QuerySetCallOperationNodeDefinition;
export function querySetCallOperation(
  operation: CallOperation,
): QuerySetCallOperationNodeDefinition;
export function querySetCallOperation(
  operation?: CallOperation | CallArgumentArray | CallArgumentMap,
): QuerySetCallOperationNodeDefinition {
  return createNodeDefinition(QuerySetCallOperationNodeType, {
    operation:
      operation && isGraphOperation(operation) && isCallOperation(operation)
        ? operation
        : callOperation(operation),
  });
}

export function isQuerySetCallOperationNodeDefinition(
  value: NodeDefinition,
): value is QuerySetCallOperationNodeDefinition {
  return value.type === QuerySetCallOperationNodeType;
}
