import { GetItemsOperation } from '../../operations/get-items';
import {
  GraphAction,
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import { createContext } from '../../utils/create-context';
import createGraphAction from '../../utils/create-graph-action';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { untilBooleanValueNode } from '../../utils/is-boolean-value-node';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { apply } from '../graph/apply';
import { iteratorResult } from '../graph/iterator-result';
import { nil } from '../graph/nil';
import { resolve } from '../graph/resolve';
import { toValue, value, ValueNode } from '../graph/value';
import { nodeList } from './node-list';
import { ContainsOperation } from './operations/contains';

const ITEM_ID_CONTEXT = '$$array:item-id';

/**
 * An instance of the [[array]] node.
 * See the [[array]] documentation to find out more.
 */
export interface ArrayNode extends StatelessGraphNode<'array', ArrayNodeProperties> {}

/**
 * A definition of the [[array]] node.
 * See the [[array]] documentation to find out more.
 */
export interface ArrayNodeDefinition
  extends StatelessNodeDefinition<'array', ArrayNodeProperties> {}

export interface ArrayNodeProperties {
  items: Array<NodeDefinition>;
}

/**
 * The implementation of the [[array]].
 * See the [[array]] documentation to learn more.
 */
export const ArrayNodeType: StatelessNodeType<'array', ArrayNodeProperties> = createNodeType<
  'array',
  ArrayNodeProperties
>('array', {
  shape: {
    items: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    getItems: {
      run(node: ArrayNode, operation: GetItemsOperation): NodeDefinition | GraphAction {
        const items = toGraphNodesWithIndices(node, node.definition.properties.items);
        const itemsNode = nodeList(items);
        return operation.properties.transforms.length === 0
          ? itemsNode
          : createGraphAction(withScopeFrom(node, itemsNode), operation);
      },
    },
    iterate: {
      run(node: ArrayNode): NodeDefinition {
        const items = toGraphNodesWithIndices(node, node.definition.properties.items);
        if (items.length === 0) {
          return nil();
        }
        return iteratorResult(items[0], nodeList(items.slice(1)));
      },
    },
    length: {
      run(node: ArrayNode): NodeDefinition {
        return value(node.definition.properties.items.length);
      },
    },
    contains: {
      run(node: ArrayNode, operation: ContainsOperation): NodeDefinition {
        const items = toGraphNodesWithIndices(node, node.definition.properties.items);
        const { item: otherItem, comparator } = operation.properties;
        return resolve(
          items.map((item) => ({
            target: apply([item, otherItem], comparator),
            until: untilBooleanValueNodeItem,
          })),
          (results: Array<ValueNode<boolean>>) =>
            value(results.some((item) => item.definition.properties.value)),
        );
      },
    },
  },
});

const untilBooleanValueNodeItem = untilBooleanValueNode(ArrayNodeType, 'item');

/**
 * Creates a new instance of an [[array]] node, which is a type of [[NodeDefinition]] used for storing an array of graph nodes.
 * This is one of the most basic types of nodes used by Muster.
 * The main use for this node is when resolving a [[query]] that targets a collection.
 * In that case, the [[array]] holds a list of items returned by that query.
 */
export function array(items: Array<NodeDefinition | NodeLike>): ArrayNodeDefinition {
  return createNodeDefinition(ArrayNodeType, {
    items: items.map((item) => (isNodeDefinition(item) ? item : toValue(item))),
  });
}

export function isArrayNodeDefinition(array: NodeDefinition): array is ArrayNodeDefinition {
  return array.type === ArrayNodeType;
}

export function toGraphNodesWithIndices(
  owner: GraphNode,
  items: Array<NodeDefinition>,
): Array<GraphNode> {
  return items.map((item, index) =>
    createGraphNode(
      owner.scope,
      createContext(owner.context, {
        [ITEM_ID_CONTEXT]: withScopeFrom(owner, value(index)),
      }),
      item,
    ),
  );
}
