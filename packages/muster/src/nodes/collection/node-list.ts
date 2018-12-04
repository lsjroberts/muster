import {
  getItemsOperation,
  GetItemsOperation,
  ListGraphNode,
  supportsGetItemsOperation,
} from '../../operations/get-items';
import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { iteratorResult } from '../graph/iterator-result';
import { nil } from '../graph/nil';
import { resolve } from '../graph/resolve';
import { traverse } from '../graph/traverse';
import { value } from '../graph/value';
import { supportsTransformItemsOperation, transformItems } from './operations/transform-items';

/**
 * An instance of the [[nodeList]] node.
 * See the [[nodeList]] documentation to find out more.
 */
export interface NodeListNode<T extends GraphNode = GraphNode>
  extends StatelessGraphNode<'nodeList', NodeListNodeProperties<T>> {}

/**
 * A definition of the [[nodeList]] node.
 * See the [[nodeList]] documentation to find out more.
 */
export interface NodeListNodeDefinition<T extends GraphNode = GraphNode>
  extends StatelessNodeDefinition<'nodeList', NodeListNodeProperties<T>> {}

export interface NodeListNodeProperties<T extends GraphNode = GraphNode> {
  items: Array<T>;
}

/**
 * An implementation of the [[nodeList]] node.
 * See the [[nodeList]] documentation to find out more.
 */
export const NodeListNodeType: StatelessNodeType<
  'nodeList',
  NodeListNodeProperties
> = createNodeType<'nodeList', NodeListNodeProperties>('nodeList', {
  shape: {
    items: types.arrayOf(graphTypes.graphNode),
  },
  operations: {
    getItems: {
      getDependencies(
        properties: NodeListNodeProperties,
        operation: GetItemsOperation,
      ): Array<NodeDependency> {
        const { transforms } = operation.properties;
        return transforms.length === 0
          ? []
          : [
              {
                target: transforms[0],
                until: untilSupportsTransformItemsOperation,
              },
            ];
      },
      run(
        node: NodeListNode,
        operation: GetItemsOperation,
        [firstTransform]: [GraphNode],
      ): NodeDefinition | GraphNode {
        const { items } = node.definition.properties;
        const { transforms } = operation.properties;
        if (transforms.length === 0) {
          return node;
        }
        const remainingTransforms = transforms.slice(1);
        return resolve(
          [
            {
              target: traverse(firstTransform, transformItems(items)),
              until: untilSupportsGetItemsOperation,
            },
          ],
          ([transformedItems]: [ListGraphNode]) =>
            remainingTransforms.length === 0
              ? transformedItems
              : createGraphAction(transformedItems, getItemsOperation(remainingTransforms)),
        );
      },
    },
    iterate: {
      run(node: NodeListNode): NodeDefinition {
        const { items } = node.definition.properties;
        if (items.length === 0) {
          return nil();
        }
        return iteratorResult(items[0], nodeList(items.slice(1)));
      },
    },
    length: {
      run(node: NodeListNode): NodeDefinition {
        return value(node.definition.properties.items.length);
      },
    },
  },
});

const untilSupportsTransformItemsOperation: NodeDependency['until'] = {
  predicate: supportsTransformItemsOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Target node is not a list transformer', {
      received: node.definition,
    });
  },
};

const untilSupportsGetItemsOperation: NodeDependency['until'] = {
  predicate: supportsGetItemsOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Target node does not allow list access', {
      received: node.definition,
    });
  },
};

/**
 * Creates a new instance of the [[nodeList]] node, which serves as a low-lever implementation of the [[array]] node.
 * This node stores every item as a GraphNode, which is bound to a correct scope and context.
 */
export function nodeList<T extends GraphNode = GraphNode>(
  items: Array<T>,
): NodeListNodeDefinition<T> {
  return createNodeDefinition(NodeListNodeType, {
    items: items as Array<GraphNode>,
  }) as NodeListNodeDefinition<T>;
}

export function isNodeListNodeDefinition(value: NodeDefinition): value is NodeListNodeDefinition {
  return value.type === NodeListNodeType;
}
