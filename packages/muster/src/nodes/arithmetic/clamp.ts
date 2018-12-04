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
 * An instance of the [[clamp]] node.
 * See the [[clamp]] documentation to find out more.
 */
export interface ClampNode extends StatelessGraphNode<'clamp', ClampNodeProperties> {}

/**
 * A definition of a [[clamp]] node.
 * See the [[clamp]] documentation to find out more.
 */
export interface ClampNodeDefinition
  extends StatelessNodeDefinition<'clamp', ClampNodeProperties> {}

export interface ClampNodeProperties {
  max: NodeDefinition;
  min: NodeDefinition;
  value: NodeDefinition;
}

/**
 * The implementation of the [[clamp]] node.
 * See the [[clamp]] documentation to learn more.
 */
export const ClampNodeType: StatelessNodeType<'clamp', ClampNodeProperties> = createNodeType<
  'clamp',
  ClampNodeProperties
>('clamp', {
  shape: {
    max: graphTypes.nodeDefinition,
    min: graphTypes.nodeDefinition,
    value: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ max, min, value }: ClampNodeProperties): Array<NodeDependency> {
        return [
          { target: max, until: untilNumberValueNode(ClampNodeType, 'max') },
          { target: min, until: untilNumberValueNode(ClampNodeType, 'min') },
          { target: value, until: untilNumberValueNode(ClampNodeType, 'value') },
        ];
      },
      run(
        node: ClampNode,
        options: never,
        [max, min, value]: [ValueNode<number>, ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        const maxNumber = max.definition.properties.value;
        const minNumber = min.definition.properties.value;
        const valueNumber = value.definition.properties.value;
        return toValue(Math.min(Math.max(valueNumber, minNumber), maxNumber));
      },
    },
  },
});

/**
 * Creates a new instance of a [[clamp]] node, which is a type of a [[NodeDefinition]] used when retrieving a value
 * that is clamped between minimum and maximum range.
 * @returns {ClampNodeDefinition}
 *
 * @example **Clamp the value**
 * ```js
 * import muster, { clamp, ref } from '@dws/muster';
 *
 * const app = muster({
 *   ten: 10,
 *   hundred: 100,
 * });
 *
 * await app.resolve(clamp(31, { min: ref('ten'), max: ref('hundred') }));
 * // === 31
 *
 * await app.resolve(clamp(9, { min: ref('ten'), max: ref('hundred') }));
 * // === 10
 *
 * await app.resolve(clamp(101, { min: ref('ten'), max: ref('hundred') }));
 * // === 100
 * ```
 */
export function clamp(
  value: NodeLike,
  options: { min: NodeLike; max: NodeLike },
): ClampNodeDefinition {
  return createNodeDefinition(ClampNodeType, {
    max: toValue(options.max),
    min: toValue(options.min),
    value: toValue(value),
  });
}

export function isClampNodeDefinition(value: NodeDefinition): value is ClampNodeDefinition {
  return value.type === ClampNodeType;
}
