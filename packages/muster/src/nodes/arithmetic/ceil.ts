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
import { toValue, ValueNode } from '../graph/value';

/**
 * An instance of the [[ceil]] node.
 * See the [[ceil]] documentation to find out more.
 */
export interface CeilNode extends StatelessGraphNode<'ceil', CeilNodeProperties> {}

/**
 * A definition of the [[ceil]] node.
 * See the [[ceil]] documentation to find out more.
 */
export interface CeilNodeDefinition extends StatelessNodeDefinition<'ceil', CeilNodeProperties> {}

export interface CeilNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[ceil]] node.
 * See the [[ceil]] documentation to learn more.
 */
export const CeilNodeType: StatelessNodeType<'ceil', CeilNodeProperties> = createNodeType<
  'ceil',
  CeilNodeProperties
>('ceil', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: CeilNodeProperties): Array<NodeDependency> {
        return [{ target, until: untilNumberValueNode(CeilNodeType, 'target') }];
      },
      run(node: CeilNode, options: never, [target]: [ValueNode<number>]): NodeDefinition {
        return toValue(Math.ceil(target.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[ceil]] node, which is a type of a [[NodeDefinition]] used when converting a number
 * (int or float) to a smallest integer greater or equal to the current number.
 * It works in the same way as the `Math.ceil` from JavaScript.
 * @returns {CeilNodeDefinition}
 *
 * @example **Ceil the value**
 * ```js
 * import muster, { ceil, ref } from '@dws/muster';
 *
 * const app = muster({
 *   fivePointThree: 5.3,
 * });
 *
 * await app.resolve(ceil(5));
 * // === 5
 *
 * await app.resolve(ceil(5.2));
 * // === 6
 *
 * await app.resolve(ceil(ref('fivePointThree')));
 * // === 6
 * ```
 */
export function ceil(target: NodeLike): CeilNodeDefinition {
  return createNodeDefinition(CeilNodeType, {
    target: toValue(target),
  });
}

export function isCeilNodeDefinition(value: NodeDefinition): value is CeilNodeDefinition {
  return value.type === CeilNodeType;
}
