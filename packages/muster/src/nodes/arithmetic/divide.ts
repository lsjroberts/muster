import {
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { untilNumberValueNode } from '../../utils/is-number-value-node';
import * as types from '../../utils/types';
import { value, ValueNode } from '../graph/value';

/**
 * An instance of the [[divide]] node.
 * See the [[divide]] documentation to find out more.
 */
export interface DivideNode extends StatelessGraphNode<'divide', DivideNodeProperties> {}

/**
 * A definition of the [[divide]] node.
 * See the [[divide]] documentation to find out more.
 */
export interface DivideNodeDefinition
  extends StatelessNodeDefinition<'divide', DivideNodeProperties> {}

export interface DivideNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[divide]] node.
 * See the [[divide]] documentation to learn more.
 */
export const DivideNodeType: StatelessNodeType<'divide', DivideNodeProperties> = createNodeType<
  'divide',
  DivideNodeProperties
>('divide', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: DivideNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: untilNumberValueNode(DivideNodeType, 'operand'),
        }));
      },
      run(node: DivideNode, options: never, operands: Array<ValueNode<number>>): NodeDefinition {
        assertEnoughOperands(operands);
        const operandValues = operands.map((operand) => operand.definition.properties.value);
        return value(operandValues.reduce((total, value) => total / value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[divide]] node, which is a type of [[NodeDefinition]] used to divide number-based
 * [values](_nodes_graph_value_.html#value)..
 * The [[divide]] node takes any number of operands. It will throw an error if the number of
 * operands is below 2 as it doesn't make sense to do the division operation with a single operand.
 * @returns {DivideNodeDefinition}
 *
 * @example **Divide by two**
 * ```js
 * import muster, { divide, ref } from '@dws/muster';
 *
 * const app = muster({
 *   eight: 8,
 *   two: 2,
 * });
 *
 * const result = await app.resolve(
 *   divide(ref('eight'), ref('two')),
 * );
 * // result === 4
 * ```
 * This example shows how to divide with the use of [[divide]] node.
 *
 *
 * @example **Divide five numbers**
 * ```js
 * import muster, { add, computed, divide, ref, variable } from '@dws/muster';
 *
 * const app = muster({
 *   twelve: 12,
 *   four: computed([], () => 4),
 *   three: variable(3),
 *   two: add(ref('one'), ref('one')),
 *   one: 1,
 * });
 *
 * const result = await app.resolve(
 *   divide(ref('twelve'), ref('four'), ref('three'), ref('two'), ref('one')),
 * );
 * // result === 0.5
 * ```
 * This example shows how to divide five differently computed numbers. As mentioned in the
 * description above, this node can handle any number of operands as long as they
 * resolve to a numeric [value](_nodes_graph_value_.html#value).
 */
export function divide(...operands: Array<NodeDefinition | number>): DivideNodeDefinition {
  assertEnoughOperands(operands);
  return createNodeDefinition(DivideNodeType, {
    operands: operands.map((operand) => (isNodeDefinition(operand) ? operand : value(operand))),
  });
}

export function isDivideNodeDefinition(value: NodeDefinition): value is DivideNodeDefinition {
  return value.type === DivideNodeType;
}

function assertEnoughOperands(operands: Array<any>): void {
  if (operands.length < 2) {
    throw new Error('Division requires at least two operands');
  }
}
