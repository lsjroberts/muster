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
 * An instance of the [[floor]] node.
 * See the [[floor]] documentation to find out more.
 */
export interface FloorNode extends StatelessGraphNode<'floor', FloorNodeProperties> {}

/**
 * A definition of the [[floor]] node.
 * See the [[floor]] documentation to find out more.
 */
export interface FloorNodeDefinition
  extends StatelessNodeDefinition<'floor', FloorNodeProperties> {}

export interface FloorNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[floor]] node.
 * See the [[floor]] documentation to learn more.
 */
export const FloorNodeType: StatelessNodeType<'floor', FloorNodeProperties> = createNodeType<
  'floor',
  FloorNodeProperties
>('floor', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: FloorNodeProperties): Array<NodeDependency> {
        return [{ target, until: untilNumberValueNode(FloorNodeType, 'target') }];
      },
      run(node: FloorNode, options: never, [target]: [ValueNode<number>]): NodeDefinition {
        return toValue(Math.floor(target.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[floor]] node, which is a type of a [[NodeDefinition]] used when converting a number
 * (int or float) to a largest integer lower or equal to the current number.
 * It works in the same way as the `Math.floor` from JavaScript.
 * @returns {FloorNodeDefinition}
 *
 *
 * @example **Floor the value**
 * ```js
 * import muster, { floor, ref } from '@dws/muster';
 *
 * const app = muster({
 *   fivePointThree: 5.3,
 * });
 *
 * await app.resolve(floor(5));
 * // === 5
 *
 * await app.resolve(floor(5.2));
 * // === 5
 *
 * await app.resolve(floor(ref('fivePointThree')));
 * // === 5
 * ```
 */
export function floor(target: NodeLike): FloorNodeDefinition {
  return createNodeDefinition(FloorNodeType, {
    target: toValue(target),
  });
}

export function isFloorNodeDefinition(value: NodeDefinition): value is FloorNodeDefinition {
  return value.type === FloorNodeType;
}
