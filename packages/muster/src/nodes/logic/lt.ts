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
 * An instance of the [[lt]] node.
 * See the [[lt]] documentation to find out more.
 */
export interface LtNode extends StatelessGraphNode<'lt', LtNodeProperties> {}

/**
 * A definition of the [[lt]] node.
 * See the [[lt]] documentation to find out more.
 */
export interface LtNodeDefinition extends StatelessNodeDefinition<'lt', LtNodeProperties> {}

export interface LtNodeProperties {
  left: NodeDefinition;
  right: NodeDefinition;
}

/**
 * The implementation of the [[lt]] node.
 * See the [[lt]] documentation to learn more.
 */
export const LtNodeType: StatelessNodeType<'lt', LtNodeProperties> = createNodeType<
  'lt',
  LtNodeProperties
>('lt', {
  shape: {
    left: graphTypes.nodeDefinition,
    right: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ left, right }: LtNodeProperties): Array<NodeDependency> {
        return [left, right].map((operand) => ({
          target: operand,
          until: {
            predicate: ValueNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Lt node operands must resolve to value() nodes', {
                expected: ValueNodeType,
                received: node.definition,
              });
            },
          },
        }));
      },
      run(
        node: LtNode,
        options: never,
        [left, right]: [ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        const leftValue = left.definition.properties.value;
        const rightValue = right.definition.properties.value;
        return value(leftValue < rightValue);
      },
    },
  },
});

/**
 * Creates a new instance of a [[lt]] node, which is used to check if a given node's value is less than
 * the value of another graph node. This comparison is done with the `<` operator.
 *
 *
 * @example **Comparing values**
 * ```js
 * import muster, { computed, lt } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(lt(5, 4)) // === false
 * await app.resolve(lt(5, 5)) // === false
 * await app.resolve(lt(5, 6)) // === true
 * await app.resolve(lt(computed([], () => 100), 99)) // === false
 * await app.resolve(lt(computed([], () => 100), 100)) // === false
 * await app.resolve(lt(computed([], () => 100), 101)) // === true
 * ```
 */
export function lt(
  left: NodeDefinition | NodeLike,
  right: NodeDefinition | NodeLike,
): LtNodeDefinition {
  return createNodeDefinition(LtNodeType, {
    left: isNodeDefinition(left) ? left : value(left),
    right: isNodeDefinition(right) ? right : value(right),
  });
}

export function isLtNodeDefinition(value: NodeDefinition): value is LtNodeDefinition {
  return value.type === LtNodeType;
}
