import {
  GraphAction,
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { fn } from '../graph/fn';
import { toValue } from '../graph/value';
import { eq } from '../logic/eq';
import { containsOperation, supportsContainsOperation } from './operations/contains';

/**
 * An instance of the [[contains]] node.
 * See the [[contains]] documentation to find out more.
 */
export interface ContainsNode extends StatelessGraphNode<'contains', ContainsNodeProperties> {}

/**
 * A definition of the [[contains]] node.
 * See the [[contains]] documentation to find out more.
 */
export interface ContainsNodeDefinition
  extends StatelessNodeDefinition<'contains', ContainsNodeProperties> {}

export interface ContainsNodeProperties {
  item: NodeDefinition;
  comparator: NodeDefinition;
  target: NodeDefinition;
}

/**
 * The implementation of the [[contains]].
 * See the [[contains]] documentation for more information.
 */
export const ContainsNodeType: StatelessNodeType<
  'contains',
  ContainsNodeProperties
> = createNodeType<'contains', ContainsNodeProperties>('contains', {
  shape: {
    item: graphTypes.nodeDefinition,
    target: graphTypes.nodeDefinition,
    comparator: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: ContainsNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: {
              predicate: supportsContainsOperation,
              errorMessage(node: GraphNode) {
                return getInvalidTypeErrorMessage(
                  'Target node does not support contains operation',
                  { received: node.definition },
                );
              },
            },
          },
        ];
      },
      run(node: ContainsNode, operation: never, [target]: [GraphNode]): GraphAction {
        const { item, comparator } = node.definition.properties;
        return createGraphAction(target, containsOperation(item, comparator));
      },
    },
  },
});

/**
 * Creates an instance of a [[contains]] node, which can be used to determine whether a given value or item exists in a collection. Existence is determined through implicit use of the [[eq]] node unless a custom `comparator` function is supplied.
 *
 * @example **Simple usage**
 * ```javascript
 * import muster, { array, contains, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: array([3, 2, 1]),
 * });
 *
 * const contains3 = await app.resolve(contains(ref('numbers'), 3)));
 * // contains3 === true
 * const contains5 = await app.resolve(contains(ref('numbers'), 5)));
 * // contains5 === false
 * ```
 * This example demonstrates how to assert whether a simple value exists in an array.
 *
 * @example **Usage with custom comparator**
 * ```javascript
 * import muster, { arrayList, contains, ref, toNode } from '@dws/muster';
 *
 * const app = muster({
 *   products: arrayList([
 *     { name: 'Apple', category: 'Fruit' },
 *     { name: 'Bicycle', category: 'Toy' },
 *     { name: 'Pear', category: 'Fruit' },
 *     { name: 'Banana', category: 'Fruit' },
 *   ]),
 * });
 *
 * const containsBananaString = await app.resolve(contains(
 *   ref('products'),
 *   'Banana',
 *   fn((left, right) => eq(get(left, 'name'), right)),
 * )));
 * // containsBananaString === true
 *
 * const containsBananaObject = await app.resolve(contains(
 *   ref('products'),
 *   toNode({ name: 'Banana' }),
 *   fn((left, right) => eq(get(left, 'name'), get(right, 'name'))),
 * )));
 * // containsBananaObject === true
 * ```
 * This example demonstrates how to use a custom comparator function (in this case, an [[fn]] node) to determine equality between items. The first query uses a simple string, the second converts the supplied target item to a node to allow consistent use of the [[get]] node between collection and target.
 */
export function contains(
  target: NodeDefinition,
  item: NodeLike,
  comparator?: NodeDefinition,
): ContainsNodeDefinition {
  return createNodeDefinition(ContainsNodeType, {
    target,
    item: toValue(item),
    comparator: getComparator(comparator),
  });
}

function getComparator(
  comparator?: NodeDefinition | ((item: NodeDefinition) => NodeDefinition | NodeLike),
): NodeDefinition {
  if (typeof comparator === 'function') {
    return fn((item: NodeDefinition) => toValue(comparator(item)));
  }
  return comparator || fn((left, right) => eq(left, right));
}
