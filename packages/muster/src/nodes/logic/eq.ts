import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { value, ValueNode, ValueNodeType } from '../graph/value';

/**
 * An instance of the [[eq]] node.
 * See the [[eq]] documentation to find out more.
 */
export interface EqNode extends StatelessGraphNode<'eq', EqNodeProperties> {}

/**
 * A definition of the [[eq]] node.
 * See the [[eq]] documentation to find out more.
 */
export interface EqNodeDefinition extends StatelessNodeDefinition<'eq', EqNodeProperties> {}

export interface EqNodeProperties {
  left: NodeDefinition;
  right: NodeDefinition;
}

/**
 * The implementation of the [[eq]] node.
 * See the [[eq]] documentation to learn more.
 */
export const EqNodeType: StatelessNodeType<'eq', EqNodeProperties> = createNodeType<
  'eq',
  EqNodeProperties
>('eq', {
  shape: {
    left: graphTypes.nodeDefinition,
    right: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ left, right }: EqNodeProperties): Array<NodeDependency> {
        return [left, right].map((operand) => ({
          target: operand,
          until: {
            predicate: ValueNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Eq node operands must resolve to value() nodes', {
                expected: ValueNodeType,
                received: node.definition,
              });
            },
          },
        }));
      },
      run(
        node: EqNode,
        options: never,
        [left, right]: [ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        const leftValue = left.definition.properties.value;
        const rightValue = right.definition.properties.value;
        return value(leftValue === rightValue);
      },
    },
  },
});

/**
 * Creates a new instance of an [[eq]] node, which is used when comparing values of two other graph nodes.
 * It resolves to `value(true)` when the values are equal (using the strict equality operator) or to
 * `value(false)` when they're not equal.
 *
 * Both operands of the [[eq]] must resolve to a [[value]]. It will throw an error if either
 * one of them does not resolve to a [[value]].
 *
 *
 * @example **Comparing values**
 * ```js
 * import muster, { computed, eq } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(eq(1, 1)) // === true
 * await app.resolve(eq(123, 321)) // === false
 * await app.resolve(eq('1', 1)) // === false
 * await app.resolve(eq('Hello world', 'Hello world')) // === true
 * await app.resolve(eq(computed([], () => 123), 123)) // === true
 * await app.resolve(eq('test 1', 'test 2')) //=== false
 * ```
 */
export function eq(
  left: NodeDefinition | NodeLike,
  right: NodeDefinition | NodeLike,
): EqNodeDefinition {
  return createNodeDefinition(EqNodeType, {
    left: isNodeDefinition(left) ? left : value(left),
    right: isNodeDefinition(right) ? right : value(right),
  });
}

export function isEqNodeDefinition(value: NodeDefinition): value is EqNodeDefinition {
  return value.type === EqNodeType;
}
