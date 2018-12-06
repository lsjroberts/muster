import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { QuerySetChild } from './query-set';

export interface QuerySetIsPendingNode
  extends StaticGraphNode<'query-set-is-pending', QuerySetIsPendingNodeProperties> {}

export interface QuerySetIsPendingNodeDefinition
  extends StaticNodeDefinition<'query-set-is-pending', QuerySetIsPendingNodeProperties> {}

export interface QuerySetIsPendingNodeProperties {
  target: QuerySetChild;
}

export const QuerySetIsPendingNodeType: StaticNodeType<
  'query-set-is-pending',
  QuerySetIsPendingNodeProperties
> = createNodeType<'query-set-is-pending', QuerySetIsPendingNodeProperties>(
  'query-set-is-pending',
  {
    deserialize: false,
    serialize: false,
    shape: {
      target: graphTypes.nodeDefinition,
    },
  },
);

export function querySetIsPending(target: QuerySetChild): QuerySetIsPendingNodeDefinition {
  return createNodeDefinition(QuerySetIsPendingNodeType, { target });
}

export function isQuerySetIsPendingNodeDefinition(
  value: NodeDefinition,
): value is QuerySetIsPendingNodeDefinition {
  return value.type === QuerySetIsPendingNodeType;
}
