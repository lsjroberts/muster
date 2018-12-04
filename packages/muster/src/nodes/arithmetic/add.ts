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
 * An instance of the [[add]] node.
 * See the [[add]] documentation to find out more.
 */
export interface AddNode extends StatelessGraphNode<'add', AddNodeProperties> {}

/**
 * A definition of the [[add]] node.
 * See the [[add] documentation to find out more.
 */
export interface AddNodeDefinition extends StatelessNodeDefinition<'add', AddNodeProperties> {}

export interface AddNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[add]] node.
 * See the [[add]] documentation to learn more.
 */
export const AddNodeType: StatelessNodeType<'add', AddNodeProperties> = createNodeType<
  'add',
  AddNodeProperties
>('add', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: AddNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: untilNumberValueNode(AddNodeType, 'operand'),
        }));
      },
      run(node: AddNode, options: never, operands: Array<ValueNode<number>>): NodeDefinition {
        const operandValues = operands.map((operand) => operand.definition.properties.value);
        return value(operandValues.reduce((total, value) => total + value, 0));
      },
    },
  },
});

/**
 * Creates a new instance of an [[add]] which is a type of [[NodeDefinition]] used to compute
 * the sum of multiple number-based [values](_nodes_graph_value_.html#value).
 * The [[add]] takes any number of operands. It will throw an error if the number of operands
 * is below 2 as it doesn't make sense to do the sum operation with a single operand.
 * @returns {AddNodeDefinition}
 *
 * @example **Add two numbers**
 * ```js
 * import muster, { add, ref } from '@dws/muster';
 *
 * const app = muster({
 *   five: 5,
 *   three: 3,
 * });
 *
 * const result = await app.resolve(
 *   add(ref('five'), ref('three')),
 * );
 * // result === 8
 * ```
 * This example shows how to compute a sum of 5 and 3 with the use of an [[add]].
 *
 *
 * @example **Add five numbers**
 * ```js
 * import muster, { add, computed, ref, variable } from '@dws/muster';
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
 *   add(ref('five'), ref('four'), ref('three'), ref('two'), ref('one')),
 *   // Same as 5+4+3+2+1 in JS
 * );
 * // result === 15
 * ```
 * This example shows how to add five differently computed numbers. As mentioned in the
 * description above, this node can handle any number of operands as long as they
 * resolve to a numeric [value](_nodes_graph_value_.html#value).
 */
export function add(...operands: Array<NodeDefinition | number>): AddNodeDefinition {
  return createNodeDefinition(AddNodeType, {
    operands: operands.map((operand) => (isNodeDefinition(operand) ? operand : value(operand))),
  });
}

export function isAddNodeDefinition(value: NodeDefinition): value is AddNodeDefinition {
  return value.type === AddNodeType;
}
