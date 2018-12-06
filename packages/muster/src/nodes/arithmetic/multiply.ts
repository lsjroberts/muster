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
 * An instance of the [[multiply]] node.
 * See the [[multiply]] documentation to find out more.
 */
export interface MultiplyNode extends StatelessGraphNode<'multiply', MultiplyNodeProperties> {}

/**
 * A definition of the [[multiply]] node.
 * See the [[multiply]] documentation to find out more.
 */
export interface MultiplyNodeDefinition
  extends StatelessNodeDefinition<'multiply', MultiplyNodeProperties> {}

export interface MultiplyNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[multiply]] node.
 * See the [[multiply]] documentation to learn more.
 */
export const MultiplyNodeType: StatelessNodeType<
  'multiply',
  MultiplyNodeProperties
> = createNodeType<'multiply', MultiplyNodeProperties>('multiply', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: MultiplyNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: untilNumberValueNode(MultiplyNodeType, 'operand'),
        }));
      },
      run(node: MultiplyNode, options: never, operands: Array<ValueNode<number>>): NodeDefinition {
        const operandValues = operands.map((operand) => operand.definition.properties.value);
        return value(operandValues.reduce((total, value) => total * value, 1));
      },
    },
  },
});

/**
 * Creates a new instance of a [[multiply]] node, which is a type of [[NodeDefinition]] used to multiply
 * number-based [values](_nodes_graph_value_.html#value).
 * The [[multiply]] takes any number of operands. It will throw an error if the number of
 * operands is below 2 as it doesn't make sense to do the multiplication with a single operand.
 * @returns {MultiplyNodeDefinition}
 *
 *
 * @example **Multiply by two**
 * ```js
 * import muster, { multiply, ref } from '@dws/muster';
 *
 * const app = muster({
 *   five: 5,
 *   two: 2,
 * });
 *
 * const result = await app.resolve(
 *   multiply(ref('five'), ref('two')),
 * );
 * // result === 10
 * ```
 * This example shows how to multiply with the use of the [[multiply]].
 *
 *
 * @example **Multiply five numbers**
 * ```js
 * import muster, { add, computed, multiply, ref, variable } from '@dws/muster';
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
 *   multiply(ref('five'), ref('four'), ref('three'), ref('two'), ref('one')),
 * );
 * // result === 120
 * ```
 * This example shows how to multiply five differently computed numbers. As mentioned in the
 * description above, this node can handle any number of operands as long as they
 * resolve to a numeric [value](_nodes_graph_value_.html#value) node.
 */
export function multiply(...operands: Array<NodeDefinition | number>): MultiplyNodeDefinition {
  return createNodeDefinition(MultiplyNodeType, {
    operands: operands.map((operand) => (isNodeDefinition(operand) ? operand : value(operand))),
  });
}

export function isMultiplyNodeDefinition(value: NodeDefinition): value is MultiplyNodeDefinition {
  return value.type === MultiplyNodeType;
}
