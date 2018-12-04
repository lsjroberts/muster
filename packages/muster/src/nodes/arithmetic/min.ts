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
 * An instance of the [[min]] node.
 * See the [[min]] documentation to find out more.
 */
export interface MinNode extends StatelessGraphNode<'min', MinNodeProperties> {}

/**
 * A definition of the [[min]] node.
 * See the [[min]] documentation to find out more.
 */
export interface MinNodeDefinition extends StatelessNodeDefinition<'min', MinNodeProperties> {}

export interface MinNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[min]] node.
 * See the [[min]] documentation to learn more.
 */
export const MinNodeType: StatelessNodeType<'min', MinNodeProperties> = createNodeType<
  'min',
  MinNodeProperties
>('min', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: MinNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: untilNumberValueNode(MinNodeType, 'operand'),
        }));
      },
      run(node: MinNode, options: never, operands: Array<ValueNode<number>>): NodeDefinition {
        if (operands.length === 0) {
          return value(0);
        }
        return value(Math.min(...operands.map((operand) => operand.definition.properties.value)));
      },
    },
  },
});

/**
 * Creates a new instance of a [[min]] node, which is a type of a [[NodeDefinition]] used when retrieving a minimum value
 * of given operands. The node expects the operands to be a [value](_nodes_graph_value_.html#value) node
 * that contains a numeric value. It work in a similar way as the `Math.min(...)` function from JS.
 * @returns {MinNodeDefinition}
 *
 *
 * @example **Compute the minimum value**
 * ```js
 * import muster, { min, ref } from '@dws/muster';
 *
 * const app = muster({
 *   zero: 0,
 * });
 *
 * await app.resolve(min(1, ref('zero'), 0.5));
 * // === '0.5'
 * ```
 */
export function min(...operands: Array<NodeLike>): MinNodeDefinition {
  return createNodeDefinition(MinNodeType, {
    operands: operands.map(toValue),
  });
}

export function isMinNodeDefinition(value: NodeDefinition): value is MinNodeDefinition {
  return value.type === MinNodeType;
}
