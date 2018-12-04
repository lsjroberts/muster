import {
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { untilNumberValueNode } from '../../utils/is-number-value-node';
import * as types from '../../utils/types';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[max]] node.
 * See the [[max]] documentation to find out more.
 */
export interface MaxNode extends StatelessGraphNode<'max', MaxNodeProperties> {}

/**
 * A definition of the [[max]] node.
 * See the [[max]] documentation to find out more.
 */
export interface MaxNodeDefinition extends StatelessNodeDefinition<'max', MaxNodeProperties> {}

export interface MaxNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[max]] node.
 * See the [[max]] documentation to learn more.
 */
export const MaxNodeType: StatelessNodeType<'max', MaxNodeProperties> = createNodeType<
  'max',
  MaxNodeProperties
>('max', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: MaxNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: untilNumberValueNode(MaxNodeType, 'operand'),
        }));
      },
      run(node: MaxNode, options: never, operands: Array<ValueNode<number>>): NodeDefinition {
        if (operands.length === 0) {
          return value(0);
        }
        return value(Math.max(...operands.map((operand) => operand.definition.properties.value)));
      },
    },
  },
});

/**
 * Creates a new instance of a [[max]] node, which is a type of a [[NodeDefinition]] used when retrieving a maximum value
 * of given operands. The node expects the operands to be a [value](_nodes_graph_value_.html#value) node
 * that contains a numeric value. It work in a similar way as the `Math.max(...)` function from JS.
 * @returns {MaxNodeDefinition}
 *
 *
 * @example **Compute the maximum value**
 * ```js
 * import muster, { max, ref } from '@dws/muster';
 *
 * const app = muster({
 *   zero: 0,
 * });
 *
 * await app.resolve(max(1, ref('zero'), 0.5));
 * // === '1'
 * ```
 */
export function max(...operands: Array<NodeLike>): MaxNodeDefinition {
  return createNodeDefinition(MaxNodeType, {
    operands: operands.map(toValue),
  });
}

export function isMaxNodeDefinition(value: NodeDefinition): value is MaxNodeDefinition {
  return value.type === MaxNodeType;
}
