import { getItemsOperation, supportsGetItemsOperation } from '../../operations/get-items';
import { IterableGraphNode, supportsIterateOperation } from '../../operations/iterate';
import {
  GraphNode,
  isGraphNode,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import pascalCase from '../../utils/pascal-case';
import withScopeFrom from '../../utils/with-scope-from';
import { ItemPlaceholderNode, ItemPlaceholderNodeType } from '../graph/item-placeholder';
import { IteratorResultNode, IteratorResultNodeType } from '../graph/iterator-result';
import { nil, NilNode, NilNodeType } from '../graph/nil';
import { PlaceholderNode, PlaceholderNodeType } from '../graph/placeholder';
import { resolve } from '../graph/resolve';
import { traverse } from '../graph/traverse';
import { applyTransforms } from './apply-transforms';
import { fetchItems } from './fetch-items';
import { NodeListNode, NodeListNodeType } from './node-list';
import { getNextIteratorResult } from './reduce';
import { firstItem } from './transforms/first-item';

/**
 * An instance of the [[head]] node.
 * See the [[head]] documentation to find out more.
 */
export interface HeadNode extends StatelessGraphNode<'head', HeadNodeProperties> {}

/**
 * A definition of the [[head]] node.
 * See the [[head]] documentation to find out more.
 */
export interface HeadNodeDefinition extends StatelessNodeDefinition<'head', HeadNodeProperties> {}

export interface HeadNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[head]] node.
 * See the [[head]] documentation to learn more.
 */
export const HeadNodeType: StatelessNodeType<'head', HeadNodeProperties> = createNodeType<
  'head',
  HeadNodeProperties
>('head', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: HeadNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilValidTargetNode,
          },
        ];
      },
      run(
        node: HeadNode,
        options: never,
        [targetNode]: [NodeListNode | IterableGraphNode | PlaceholderNode | ItemPlaceholderNode],
      ): GraphNode | NodeDefinition {
        if (
          NilNodeType.is(targetNode) ||
          ItemPlaceholderNodeType.is(targetNode) ||
          PlaceholderNodeType.is(targetNode)
        ) {
          return targetNode;
        }
        if (NodeListNodeType.is(targetNode)) {
          const { items } = targetNode.definition.properties;
          return items.length > 0 ? items[0] : nil();
        }
        if (supportsIterateOperation(node)) {
          return getNextIteratorResult(targetNode, resolveIteratorResult);
        }
        // the item must support get items operation then
        return withScopeFrom(
          targetNode,
          resolve(
            [
              {
                target: traverse(targetNode, getItemsOperation()),
                until: untilValidGetItemsResult,
              },
            ],
            ([itemsNode]: [NodeListNode]) => {
              if (
                NilNodeType.is(itemsNode) ||
                ItemPlaceholderNodeType.is(itemsNode) ||
                PlaceholderNodeType.is(itemsNode)
              ) {
                return itemsNode;
              }
              const { items } = itemsNode.definition.properties;
              return items.length > 0 ? items[0] : nil();
            },
          ),
        );
      },
    },
  },
});

const untilValidTargetNode = {
  predicate(node: GraphNode) {
    return (
      NodeListNodeType.is(node) ||
      PlaceholderNodeType.is(node) ||
      ItemPlaceholderNodeType.is(node) ||
      NilNodeType.is(node) ||
      supportsIterateOperation(node) ||
      supportsGetItemsOperation(node)
    );
  },
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(
      `${pascalCase(HeadNodeType.name)} target does not allow list access`,
      {
        received: node.definition,
      },
    );
  },
};

const untilValidGetItemsResult = {
  predicate: (node: GraphNode) =>
    NodeListNodeType.is(node) ||
    PlaceholderNodeType.is(node) ||
    ItemPlaceholderNodeType.is(node) ||
    NilNodeType.is(node),
};

function resolveIteratorResult(result: IteratorResultNode | NilNode) {
  return IteratorResultNodeType.is(result)
    ? isGraphNode(result.definition.properties.value)
      ? result.definition.properties.value
      : withScopeFrom(result, result.definition.properties.value)
    : result;
}

/**
 * Creates a new instance of a [[head]] node, which is a type of a [[NodeDefinition]] used by the [[get]]
 * when extracting the first item from the collection.
 * It serves as a helper node that generates a [[firstItem]] transform and applies that to the target collection.
 * This node resolves to a single [[NodeDefinition]] or a [[nil]] when the collection is found to be empty.
 *
 * @example **Take first item from the collection**
 * ```js
 * import muster, { head, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4],
 * });
 *
 * await app.resolve(head(ref('numbers')));
 * // === 1
 * ```
 * This example shows how to use the [[head]] node to extract the first item from the [[array]].
 */
export function head(target: NodeDefinition): HeadNodeDefinition {
  return createNodeDefinition(HeadNodeType, {
    target: fetchItems(applyTransforms(target, [firstItem()])),
  });
}
