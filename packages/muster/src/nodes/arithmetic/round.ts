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
 * An instance of the [[round]] node.
 * See the [[round]] documentation to find out more.
 */
export interface RoundNode extends StatelessGraphNode<'round', RoundNodeProperties> {}

/**
 * A definition of the [[round]] node.
 * See the [[round]] documentation to find out more.
 */
export interface RoundNodeDefinition
  extends StatelessNodeDefinition<'round', RoundNodeProperties> {}

export interface RoundNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[round]] node.
 * See the [[round]] documentation to learn more.
 */
export const RoundNodeType: StatelessNodeType<'round', RoundNodeProperties> = createNodeType<
  'round',
  RoundNodeProperties
>('round', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: RoundNodeProperties): Array<NodeDependency> {
        return [{ target, until: untilNumberValueNode(RoundNodeType, 'target') }];
      },
      run(node: RoundNode, options: never, [target]: [ValueNode<number>]): NodeDefinition {
        return toValue(Math.round(target.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[round]] node, which is a type of a [[NodeDefinition]] used when rounding a number
 * to the nearest integer. It works in the same way as the `Math.round` from JavaScript.
 * @returns {RoundNodeDefinition}
 *
 *
 * @example **Round the value**
 * ```js
 * import muster, { round, ref } from '@dws/muster';
 *
 * const app = muster({
 *   fivePointThree: 5.3,
 *   fivePointSeven: 5.7,
 * });
 *
 * await app.resolve(round(5));
 * // === 5
 *
 * await app.resolve(round(5.2));
 * // === 5
 *
 * await app.resolve(round(5.6));
 * // === 6
 *
 * await app.resolve(round(ref('fivePointThree')));
 * // === 5
 *
 * await app.resolve(round(ref('fivePointSeven')));
 * // === 6
 * ```
 */
export function round(target: NodeLike): RoundNodeDefinition {
  return createNodeDefinition(RoundNodeType, {
    target: toValue(target),
  });
}

export function isRoundNodeDefinition(value: NodeDefinition): value is RoundNodeDefinition {
  return value.type === RoundNodeType;
}
