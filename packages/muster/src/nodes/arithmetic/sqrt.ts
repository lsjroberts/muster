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
 * An instance of the [[sqrt]] node.
 * See the [[sqrt]] documentation to find out more.
 */
export interface SqrtNode extends StatelessGraphNode<'sqrt', SqrtNodeProperties> {}

/**
 * A definition of the [[sqrt]] node.
 * See the [[sqrt]] documentation to find out more.
 */
export interface SqrtNodeDefinition extends StatelessNodeDefinition<'sqrt', SqrtNodeProperties> {}

export interface SqrtNodeProperties {
  operand: NodeDefinition;
}

/**
 * The implementation of the [[sqrt]] node.
 * See the [[sqrt]] documentation to learn more.
 */
export const SqrtNodeType: StatelessNodeType<'sqrt', SqrtNodeProperties> = createNodeType<
  'sqrt',
  SqrtNodeProperties
>('sqrt', {
  shape: {
    operand: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ operand }: SqrtNodeProperties): Array<NodeDependency> {
        return [
          {
            target: operand,
            until: untilNumberValueNode(SqrtNodeType, 'base'),
          },
        ];
      },
      run(node: SqrtNode, options: never, [operand]: [ValueNode<number>]): NodeDefinition {
        return value(Math.sqrt(operand.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[sqrt]] node, which is a type of [[NodeDefinition]] used to compute
 * a square root of a given number for number-based [values](_nodes_graph_value_.html#value).
 * @returns {SqrtNodeDefinition}
 *
 *
 * @example **Square root of four**
 * ```js
 * import muster, { sqrt, ref } from '@dws/muster';
 *
 * const app = muster({
 *   four: 4,
 * });
 *
 * const result = await app.resolve(sqrt(ref('four')));
 * // result === 2
 * ```
 * This example shows how to use [[sqrt]] node.
 */
export function sqrt(operand: NodeLike): SqrtNodeDefinition {
  return createNodeDefinition(SqrtNodeType, {
    operand: toValue(operand),
  });
}

export function isSqrtNodeDefinition(value: NodeDefinition): value is SqrtNodeDefinition {
  return value.type === SqrtNodeType;
}
