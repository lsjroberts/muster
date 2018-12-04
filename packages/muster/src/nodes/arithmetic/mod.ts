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
 * An instance of the [[mod]] node.
 * See the [[mod]] documentation to find out more.
 */
export interface ModNode extends StatelessGraphNode<'mod', ModNodeProperties> {}

/**
 * A definition of the [[mod]] node.
 * See the [[mod]] documentation to find out more.
 */
export interface ModNodeDefinition extends StatelessNodeDefinition<'mod', ModNodeProperties> {}

export interface ModNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[mod]] node.
 * See the [[mod]] documentation to learn more.
 */
export const ModNodeType: StatelessNodeType<'mod', ModNodeProperties> = createNodeType<
  'mod',
  ModNodeProperties
>('mod', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: ModNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: untilNumberValueNode(ModNodeType, 'operand'),
        }));
      },
      run(node: ModNode, options: never, operands: Array<ValueNode<number>>): NodeDefinition {
        assertEnoughOperands(operands);
        const operandValues = operands.map((operand) => operand.definition.properties.value);
        return value(operandValues.reduce((total, value) => total % value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[mod]] node, which is a  type of [[NodeDefinition]] used to perform a modulo operation
 * on number-based [values](_nodes_graph_value_.html#value).
 * The [[mod]] node takes any number of operands. It will throw an error if the number of
 * operands is below 2 as it doesn't make sense to do the modulo operation with a single operand.
 * @returns {ModNodeDefinition}
 *
 *
 * @example **Modulo 5**
 * ```js
 * import muster, { mod, ref } from '@dws/muster';
 *
 * const app = muster({
 *   fourteen: 14,
 *   five: 5,
 * });
 *
 * const result = await app.resolve(
 *   mod(ref('fourteen'), ref('five')),
 * );
 * // result === 4
 * ```
 * This example shows how to do the modulo operation with the use of [[mod]].
 */
export function mod(...operands: Array<NodeDefinition | number>): ModNodeDefinition {
  assertEnoughOperands(operands);
  return createNodeDefinition(ModNodeType, {
    operands: operands.map((operand) => (isNodeDefinition(operand) ? operand : value(operand))),
  });
}

export function isModNodeDefinition(value: NodeDefinition): value is ModNodeDefinition {
  return value.type === ModNodeType;
}

function assertEnoughOperands(operands: Array<any>): void {
  if (operands.length < 2) {
    throw new Error('Modulo requires at least two operands');
  }
}
