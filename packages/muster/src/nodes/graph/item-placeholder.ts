import { supportsEvaluateOperation } from '../../operations/evaluate';
import { isSetOperation } from '../../operations/set';
import {
  GraphNode,
  GraphOperation,
  NodeDefinition,
  NodeDependency,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { WILDCARD_OPERATION } from '../../utils/wildcard-operation';
import { OperationPathPart, QueryBuilder } from '../remote/utils/query-builder';
import { isOkNodeDefinition } from './ok';
import { PendingNodeType } from './pending';
import { placeholder, PlaceholderNode, PlaceholderNodeType } from './placeholder';
import { traverse } from './traverse';

export interface ItemOperationResult {
  node: NodeDefinition;
  pathPart: OperationPathPart<GraphOperation>;
}

/**
 * An instance of the [[itemPlaceholder]] node.
 * See the [[itemPlaceholder]] documentation to find out more.
 */
export interface ItemPlaceholderNode
  extends GraphNode<'item-placeholder', ItemPlaceholderNodeProperties> {}

/**
 * A definition of the [[itemPlaceholder]] node.
 * See the [[itemPlaceholder]] documentation to find out more.
 */
export interface ItemPlaceholderNodeDefinition
  extends NodeDefinition<'item-placeholder', ItemPlaceholderNodeProperties> {}

export interface ItemPlaceholderNodeProperties {
  results: Array<ItemOperationResult>;
  isEmpty: boolean;
  path: Array<OperationPathPart>;
  queryBuilder: QueryBuilder;
}

/**
 * An implementation of the [[itemPlaceholder]] node.
 * See the [[itemPlaceholder]] documentation to find out more.
 */
export const ItemPlaceholderNodeType: StatelessNodeType<
  'item-placeholder',
  ItemPlaceholderNodeProperties
> = createNodeType<'item-placeholder', ItemPlaceholderNodeProperties>('item-placeholder', {
  shape: {
    results: types.arrayOf(
      types.shape({
        node: graphTypes.nodeDefinition,
        pathPart: types.shape({
          id: types.string,
          operation: graphTypes.graphOperation,
        }),
      }),
    ),
    isEmpty: types.bool,
    path: types.arrayOf(
      types.shape({
        id: types.string,
        operation: graphTypes.graphOperation,
      }),
    ),
    queryBuilder: types.saveHash(types.any),
  },
  operations: {
    [WILDCARD_OPERATION]: {
      getDependencies(
        { path, queryBuilder }: ItemPlaceholderNodeProperties,
        operation: GraphOperation,
      ): Array<NodeDependency> {
        return [
          {
            target: traverse(placeholder(queryBuilder, path), operation),
            allowPending: true,
            until: untilValidPlaceholderResult,
          },
        ];
      },
      run(
        node: ItemPlaceholderNode,
        operation: GraphOperation,
        [placeholder]: [PlaceholderNode],
      ): NodeDefinition | GraphNode {
        const { results } = node.definition.properties;
        const matchingResult = results.find((result) => result.pathPart.id === operation.id);
        if (!matchingResult) return placeholder;
        return isSetOperation(operation) && isOkNodeDefinition(matchingResult.node)
          ? operation.properties.value
          : matchingResult.node;
      },
    },
  },
});

const untilValidPlaceholderResult = {
  predicate(node: GraphNode) {
    return (
      !supportsEvaluateOperation(node) || PlaceholderNodeType.is(node) || PendingNodeType.is(node)
    );
  },
};

/**
 * Creates a new instance of the [[itemPlaceholder]] node. This node is used internally by [[proxy]] and [[placeholder]]
 * nodes to enable queries against collection items. The [[itemPlaceholder]] node is responsible for gathering information
 * about which operations are subscribed to items from a given 'remote' collection, and what parameters were used when
 * calling given operation.
 */
export function itemPlaceholder(
  queryBuilder: QueryBuilder,
  path: Array<OperationPathPart>,
  results: Array<ItemOperationResult>,
  isEmpty: boolean = false,
): ItemPlaceholderNodeDefinition {
  return createNodeDefinition(ItemPlaceholderNodeType, {
    isEmpty,
    path,
    queryBuilder,
    results,
  });
}

export function isItemPlaceholderNodeDefinition(
  value: NodeDefinition,
): value is ItemPlaceholderNodeDefinition {
  return value.type === ItemPlaceholderNodeType;
}
