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
 * An instance of the [[subtract]] node.
 * See the [[subtract]] documentation to find out more.
 */
export interface SubtractNode extends StatelessGraphNode<'subtract', SubtractNodeProperties> {}

/**
 * A definition of the [[subtract]] node.
 * See the [[subtract]] documentation to find out more.
 */
export interface SubtractNodeDefinition
  extends StatelessNodeDefinition<'subtract', SubtractNodeProperties> {}

export interface SubtractNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[subtract]] node.
 * See the [[subtract]] documentation to learn more.
 */
export const SubtractNodeType: StatelessNodeType<
  'subtract',
  SubtractNodeProperties
> = createNodeType<'subtract', SubtractNodeProperties>('subtract', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: SubtractNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: untilNumberValueNode(SubtractNodeType, 'operand'),
        }));
      },
      run(node: SubtractNode, options: never, operands: Array<ValueNode<number>>): NodeDefinition {
        assertEnoughOperands(operands);
        const operandValues = operands.map((operand) => operand.definition.properties.value);
        return value(operandValues.reduce((total, value) => total - value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[subtract]] node, which is a type of [[NodeDefinition]] used to compute the difference
 * between multiple number-based [values](_nodes_graph_value_.html#value).
 * The [[subtract]] node takes any number of operands. It will throw an error if the number of operands is below 2
 * as it doesn't make sense to do the subtraction operation with a single operand.
 * @returns {SubtractNodeDefinition}
 *
 *
 * @example **Subtract two numbers**
 * ```js
 * import muster, { ref, subtract } from '@dws/muster';
 *
 * const app = muster({
 *   five: 5,
 *   three: 3,
 * });
 *
 * const result = await app.resolve(
 *   subtract(ref('five'), ref('three')),
 * );
 * // result === 2
 * ```
 * This example shows how to compute a difference between 5 and 3 with the use of a [[subtract]] node.
 *
 *
 * @example **Subtract five numbers**
 * ```js
 * import muster, { add, computed, ref, subtract, variable } from '@dws/muster';
 *
 * const app = muster({
 *   five: 5,
 *   four: computed([], () => 4),
 *   three: variable(3),
 *   two: add(ref('one'), ref('one')),
 *   one: 1,
 * });
 *
 * const result = await app.resolve(
 *   subtract(ref('five'), ref('four'), ref('three'), ref('two'), ref('one')),
 *   // Same as 5-4-3-2-1 in JS
 * );
 * // result === -5
 * ```
 * This example shows how to subtract five differently computed numbers. As mentioned in the
 * description above, this node can handle any number of operands as long as they
 * resolve to a numeric [value](_nodes_graph_value_.html#value).
 */
export function subtract(...operands: Array<NodeDefinition | number>): SubtractNodeDefinition {
  assertEnoughOperands(operands);
  return createNodeDefinition(SubtractNodeType, {
    operands: operands.map((operand) => (isNodeDefinition(operand) ? operand : value(operand))),
  });
}

export function isSubtractNodeDefinition(value: NodeDefinition): value is SubtractNodeDefinition {
  return value.type === SubtractNodeType;
}

function assertEnoughOperands(operands: Array<any>): void {
  if (operands.length < 2) {
    throw new Error('Subtraction requires at least two operands');
  }
}
