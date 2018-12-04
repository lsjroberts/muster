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
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[pow]] node.
 * See the [[pow]] documentation to find out more.
 */
export interface PowNode extends StatelessGraphNode<'pow', PowNodeProperties> {}

/**
 * A definition of the [[pow]] node.
 * See the [[pow]] documentation to find out more.
 */
export interface PowNodeDefinition extends StatelessNodeDefinition<'pow', PowNodeProperties> {}

export interface PowNodeProperties {
  base: NodeDefinition;
  exponent: NodeDefinition;
}

/**
 * The implementation of the [[pow]] node.
 * See the [[pow]] documentation to learn more.
 */
export const PowNodeType: StatelessNodeType<'pow', PowNodeProperties> = createNodeType<
  'pow',
  PowNodeProperties
>('pow', {
  shape: {
    base: graphTypes.nodeDefinition,
    exponent: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ base, exponent }: PowNodeProperties): Array<NodeDependency> {
        return [
          {
            target: base,
            until: untilNumberValueNode(PowNodeType, 'base'),
          },
          {
            target: exponent,
            until: untilNumberValueNode(PowNodeType, 'exponent'),
          },
        ];
      },
      run(
        node: PowNode,
        options: never,
        [base, exponent]: [ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        return value(
          Math.pow(base.definition.properties.value, exponent.definition.properties.value),
        );
      },
    },
  },
});

/**
 * Creates a new instance of a [[pow]] node, which is a type of [[NodeDefinition]] used to compute
 * the `base` to the `exponent` power for number-based [values](_nodes_graph_value_.html#value).
 * The [[pow]] takes two arguments: base and exponent..
 * @returns {PowNodeDefinition}
 *
 *
 * @example **Power of two**
 * ```js
 * import muster, { pow, ref } from '@dws/muster';
 *
 * const app = muster({
 *   five: 5,
 *   two: 2,
 * });
 *
 * const result = await app.resolve(
 *   pow(ref('five'), ref('two')),
 * );
 * // result === 25
 * ```
 * This example shows how to use [[pow]] node.
 */
export function pow(base: NodeLike, exponent: NodeLike): PowNodeDefinition {
  return createNodeDefinition(PowNodeType, {
    base: toValue(base),
    exponent: toValue(exponent),
  });
}

export function isPowNodeDefinition(value: NodeDefinition): value is PowNodeDefinition {
  return value.type === PowNodeType;
}
