import { supportsCallOperation } from '../../../operations/call';
import {
  GraphAction,
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../../types/graph';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../../utils/get-invalid-type-error';
import * as graphTypes from '../../../utils/graph-types';
import { untilValueNode } from '../../../utils/is-value-node';
import withScopeFrom from '../../../utils/with-scope-from';
import { apply } from '../../graph/apply';
import { error } from '../../graph/error';
import { fn } from '../../graph/fn';
import { resolve } from '../../graph/resolve';
import { toValue, value, ValueNode } from '../../graph/value';
import { nodeList } from '../node-list';
import { ResultOperation } from '../operations/result';
import { StepOperation } from '../operations/step';
import { TransformItemsOperation } from '../operations/transform-items';
import { transduce } from '../transduce';

/**
 * An instance of the [[groupBy]] node.
 * See the [[groupBy]] documentation to find out more.
 */
export interface GroupByNode extends StatelessGraphNode<'group-by', GroupByNodeProperties> {}

/**
 * A definition of the [[groupBy]] node.
 * See the [[groupBy]] documentation to find out more.
 */
export interface GroupByNodeDefinition
  extends StatelessNodeDefinition<'group-by', GroupByNodeProperties> {}

export interface GroupByNodeProperties {
  predicate: NodeDefinition;
}

/**
 * The implementation of the [[groupBy]].
 * See the [[groupBy]] documentation to learn more.
 */
export const GroupByNodeType: StatelessNodeType<'group-by', GroupByNodeProperties> = createNodeType(
  'group-by',
  {
    shape: {
      predicate: graphTypes.nodeDefinition,
    },
    operations: {
      transformItems: {
        getDependencies(
          { predicate }: GroupByNodeProperties,
          operation: TransformItemsOperation,
        ): Array<NodeDependency> {
          return operation.properties.items.map((item) => ({
            target: apply([item], predicate),
            until: untilIsValueNode,
          }));
        },
        run(
          node: GroupByNode,
          operation: TransformItemsOperation,
          groupByResults: Array<ValueNode<any>>,
        ): NodeDefinition {
          const { items } = operation.properties;
          const groupedItems: Map<any, Array<GraphNode>> = new Map();
          items.forEach((item, index) => {
            const key = groupByResults[index].definition.properties.value;
            const items = groupedItems.get(key);
            if (items) items.push(item);
            else groupedItems.set(key, [item]);
          });
          return nodeList(
            [...groupedItems.entries()].map(([key, items]) => withScopeFrom(node, nodeList(items))),
          );
        },
      },
      init: {
        run(node: GroupByNode): NodeDefinition {
          const initialState = [] as Array<GraphNode>;
          return value(initialState);
        },
      },
      step: {
        run(node: GroupByNode, operation: StepOperation<Array<GraphNode>>): NodeDefinition {
          const { acc, item } = operation.properties;
          return value([...acc, item]);
        },
      },
      result: {
        getDependencies({ predicate }: GroupByNodeProperties): Array<NodeDependency> {
          return [
            {
              target: predicate,
              until: untilSupportsCallOperation,
            },
          ];
        },
        run(
          node: GroupByNode,
          operation: ResultOperation<Array<GraphNode>>,
          [predicate]: [GraphNode],
        ): NodeDefinition | GraphAction {
          const { acc, next } = operation.properties;
          if (!next) {
            return error('group-by reducer cannot be used as a base reducer');
          }
          const sortedItems = resolve(
            acc.map((item) => ({
              target: apply([item], predicate.definition),
              until: untilIsValueNode,
            })),
            (groupByResults: Array<ValueNode<any>>) => {
              const groupedItems: Map<any, Array<GraphNode>> = new Map();
              acc.forEach((item, index) => {
                const key = groupByResults[index].definition.properties.value;
                const items = groupedItems.get(key);
                if (items) items.push(item);
                else groupedItems.set(key, [item]);
              });
              return nodeList(
                [...groupedItems.entries()].map(([key, items]) =>
                  withScopeFrom(node, nodeList(items)),
                ),
              );
            },
          );
          return value(transduce(sortedItems, [next]));
        },
      },
    },
  },
);

const untilSupportsCallOperation: NodeDependency['until'] = {
  predicate: supportsCallOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(`GroupBy predicate is not callable`, { received: node });
  },
};

const untilIsValueNode = untilValueNode(GroupByNodeType, 'predicate');

/**
 * Creates a new instance of a [[groupBy]] transform, which is a type of collection transform used to group
 * the items by a given predicate.
 * The [[groupBy]] node takes a predicate node that needs to implement a `call` operation (e.g. [[fn]], [[action]]).
 * The [[groupBy]] transform returns an array of grouped items. Consider a following example:
 * ```js
 * muster({
 *    items: [
 *      { category: 'vegetable', name: 'carrot' },
 *      { category: 'fruit', name: 'apple' },
 *      { category: 'fruit', name: 'plum' },
 *      { category: 'vegetable', name: 'potato' },
 *      { category: 'confectionery', name: 'chocolate' },
 *    ],
 *    groupedItems: applyTransforms(
 *      ref('items'),
 *      [groupBy((item) => get(item, 'category'))],
 *    ),
 *  })
 * ```
 * The `groupedItems` collection has following items:
 * ```js
 * array([
 *   array([
 *     { category: 'vegetable', name: 'carrot' },
 *     { category: 'vegetable', name: 'potato' },
 *   ]),
 *   array([
 *     { category: 'fruit', name: 'apple' },
 *     { category: 'fruit', name: 'plum' },
 *   ]),
 *   array([{ category: 'confectionery', name: 'chocolate' }])
 * ])
 * ```
 */
export function groupBy(
  predicate: NodeDefinition | NodeLike | ((item: NodeDefinition) => NodeDefinition | NodeLike),
): GroupByNodeDefinition {
  return createNodeDefinition(GroupByNodeType, {
    predicate:
      typeof predicate === 'function'
        ? fn((item: NodeDefinition) => toValue(predicate(item)))
        : isNodeDefinition(predicate)
        ? predicate
        : value(predicate),
  });
}
