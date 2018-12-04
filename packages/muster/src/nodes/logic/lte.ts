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
 * An instance of the [[lte]] node.
 * See the [[lte]] documentation to find out more.
 */
export interface LteNode extends StatelessGraphNode<'lte', LteNodeProperties> {}

/**
 * A definition of the [[lte]] node.
 * See the [[lte]] documentation to find out more.
 */
export interface LteNodeDefinition extends StatelessNodeDefinition<'lte', LteNodeProperties> {}

export interface LteNodeProperties {
  left: NodeDefinition;
  right: NodeDefinition;
}

/**
 * The implementation of the [[lte]] node.
 * See the [[lte]] documentation to learn more.
 */
export const LteNodeType: StatelessNodeType<'lte', LteNodeProperties> = createNodeType<
  'lte',
  LteNodeProperties
>('lte', {
  shape: {
    left: graphTypes.nodeDefinition,
    right: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ left, right }: LteNodeProperties): Array<NodeDependency> {
        return [left, right].map((operand) => ({
          target: operand,
          until: {
            predicate: ValueNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Lte node operands must resolve to value() nodes', {
                expected: ValueNodeType,
                received: node.definition,
              });
            },
          },
        }));
      },
      run(
        node: LteNode,
        options: never,
        [left, right]: [ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        const leftValue = left.definition.properties.value;
        const rightValue = right.definition.properties.value;
        return value(leftValue <= rightValue);
      },
    },
  },
});

/**
 * Creates a new instance of a [[lte]] node, which is used to check if a given node's value is less than or equal to
 * the value of another graph node. This comparison is done with the `<=` operator.
 *
 *
 * @example **Comparing values**
 * ```js
 * import muster, { computed, lte } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(lte(5, 4)) // === false
 * await app.resolve(lte(5, 5)) // === true
 * await app.resolve(lte(5, 6)) // === true
 * await app.resolve(lte(computed([], () => 100), 99)) // === false
 * await app.resolve(lte(computed([], () => 100), 100)) // === true
 * await app.resolve(lte(computed([], () => 100), 101)) // === true
 * ```
 */
export function lte(
  left: NodeDefinition | NodeLike,
  right: NodeDefinition | NodeLike,
): LteNodeDefinition {
  return createNodeDefinition(LteNodeType, {
    left: isNodeDefinition(left) ? left : value(left),
    right: isNodeDefinition(right) ? right : value(right),
  });
}

export function isLteNodeDefinition(value: NodeDefinition): value is LteNodeDefinition {
  return value.type === LteNodeType;
}
