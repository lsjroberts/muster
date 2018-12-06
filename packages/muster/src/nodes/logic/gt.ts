import {
  GraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import { value, ValueNode, ValueNodeType } from '../graph/value';

/**
 * An instance of the [[gt]] node.
 * See the [[gt]] documentation to find out more.
 */
export interface GtNode extends StatelessGraphNode<'gt', GtNodeProperties> {}

/**
 * A definition of the [[gt]] node.
 * See the [[gt]] documentation to find out more.
 */
export interface GtNodeDefinition extends StatelessNodeDefinition<'gt', GtNodeProperties> {}

export interface GtNodeProperties {
  left: NodeDefinition;
  right: NodeDefinition;
}

/**
 * The implementation of the [[gt]] node.
 * See the [[gt]] documentation to learn more.
 */
export const GtNodeType: StatelessNodeType<'gt', GtNodeProperties> = createNodeType<
  'gt',
  GtNodeProperties
>('gt', {
  shape: {
    left: graphTypes.nodeDefinition,
    right: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ left, right }: GtNodeProperties): Array<NodeDependency> {
        return [left, right].map((operand) => ({
          target: operand,
          until: {
            predicate: ValueNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Gt node operands must resolve to value() nodes', {
                expected: ValueNodeType,
                received: node.definition,
              });
            },
          },
        }));
      },
      run(
        node: GtNode,
        options: never,
        [left, right]: [ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        const leftValue = left.definition.properties.value;
        const rightValue = right.definition.properties.value;
        return value(leftValue > rightValue);
      },
    },
  },
});

/**
 * Creates a new instance of a [[gt]] node, which checks if a given node's value is greater than the value
 * of another graph node. This comparison is done with the `>` operator.
 *
 *
 * @example **Comparing values**
 * ```js
 * import muster, { computed, gt } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(gt(5, 4)) // === true
 * await app.resolve(gt(5, 5)) // === false
 * await app.resolve(gt(5, 6)) // === false
 * await app.resolve(gt(computed([], () => 100), 99)) // === true
 * await app.resolve(gt(computed([], () => 99), 100)) // === false
 * ```
 */
export function gt(
  left: NodeDefinition | NodeLike,
  right: NodeDefinition | NodeLike,
): GtNodeDefinition {
  return createNodeDefinition(GtNodeType, {
    left: isNodeDefinition(left) ? left : value(left),
    right: isNodeDefinition(right) ? right : value(right),
  });
}

export function isGtNodeDefinition(value: NodeDefinition): value is GtNodeDefinition {
  return value.type === GtNodeType;
}
