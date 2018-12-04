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
import * as types from '../../utils/types';
import { value, ValueNode, ValueNodeType } from '../graph/value';

/**
 * An instance of the [[and]] node.
 * See the [[and]] documentation to find out more.
 */
export interface AndNode extends StatelessGraphNode<'and', AndNodeProperties> {}

/**
 * A definition of the [[and]] node.
 * See the [[and]] documentation to find out more.
 */
export interface AndNodeDefinition extends StatelessNodeDefinition<'and', AndNodeProperties> {}

export interface AndNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[and]] node.
 * See the [[and]] documentation to learn more.
 */
export const AndNodeType: StatelessNodeType<'and', AndNodeProperties> = createNodeType<
  'and',
  AndNodeProperties
>('and', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: AndNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: {
            predicate: ValueNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('And node operands must resolve to value() nodes', {
                expected: ValueNodeType,
                received: node.definition,
              });
            },
          },
        }));
      },
      run(node: AndNode, options: never, operands: Array<ValueNode<any>>): NodeDefinition {
        return value(operands.every((operand) => Boolean(operand.definition.properties.value)));
      },
    },
  },
});

/**
 * Creates a new instance of an [[and]] node, which introduces the `and` expression. It checks if every operand of
 * this [[and]] is truthy. The conversion to boolean is done with the help of the `Boolean` JS
 * function. It requires every operand to resolve to a [[value]]. It throws an error if an
 * operand resolves to a graph node other than a [[value]].
 *
 *
 * @example **Different variants of `and` operands**
 * ```js
 * import muster, { and, computed, value } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(and(true)) // === true
 * await app.resolve(and(false)) // === false
 * await app.resolve(and(value(true))) // === true - it is equivalent to and(true)
 * await app.resolve(and('hello world')) // === true
 * await app.resolve(and(true, false)) // === false
 * await app.resolve(and(computed([], () => false))) // === false
 * await app.resolve(and(computed([], () => true))) // === true
 * await app.resolve(and(computed([], () => true), true)) // === true
 * await app.resolve(and(computed([], () => true), false)) // === false
 * ```
 *
 *
 * @example **Dynamic operands**
 * ```ts
 * import muster, { and, gt, lte, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   balance: variable(100),
 *   stake: variable(51),
 *   canPlaceBet: and(
 *     gt(ref('stake'), 0),
 *     lte(ref('stake'), ref('balance')),
 *   ),
 * });
 *
 * app.resolve(ref('canPlaceBet')).subscribe((res) => {
 *   console.log(`Can place bet: ${res}`);
 * });
 *
 * console.log('Changing stake to 150');
 * await app.resolve(set('stake', 150));
 *
 * console.log('Changing balance to 150');
 * await app.resolve(set('balance', 150));
 *
 * // Console output:
 * // Can place bet: true
 * // Changing stake to 150
 * // Can place bet: false
 * // Changing balance to 150
 * // Can place bet: true
 * ```
 *  This example shows how the [[and]] can be used in conjunction with other logic graph
 *  nodes to produce expected results. The `canPlaceBet` node checks if the stake is greater than
 *  zero and if the stake can be covered by user's balance. This is done thanks to [[gt]] and
 *  [[lte]].
 */
export function and(...operands: Array<NodeDefinition | NodeLike>): AndNodeDefinition {
  return createNodeDefinition(AndNodeType, {
    operands: operands.map((operand) => (isNodeDefinition(operand) ? operand : value(operand))),
  });
}

export function isAndNodeDefinition(value: NodeDefinition): value is AndNodeDefinition {
  return value.type === AndNodeType;
}
