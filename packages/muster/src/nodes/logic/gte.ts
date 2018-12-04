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
 * An instance of the [[gte]] node.
 * See the [[gte]] documentation to find out more.
 */
export interface GteNode extends StatelessGraphNode<'gte', GteNodeProperties> {}

/**
 * A definition of the [[gte]] node.
 * See the [[gte]] documentation to find out more.
 */
export interface GteNodeDefinition extends StatelessNodeDefinition<'gte', GteNodeProperties> {}

export interface GteNodeProperties {
  left: NodeDefinition;
  right: NodeDefinition;
}

/**
 * The implementation of the [[gte]] node.
 * See the [[gte]] documentation to learn more.
 */
export const GteNodeType: StatelessNodeType<'gte', GteNodeProperties> = createNodeType<
  'gte',
  GteNodeProperties
>('gte', {
  shape: {
    left: graphTypes.nodeDefinition,
    right: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ left, right }: GteNodeProperties): Array<NodeDependency> {
        return [left, right].map((operand) => ({
          target: operand,
          until: {
            predicate: ValueNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Gte node operands must resolve to value() nodes', {
                expected: ValueNodeType,
                received: node.definition,
              });
            },
          },
        }));
      },
      run(
        node: GteNode,
        options: never,
        [left, right]: [ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        const leftValue = left.definition.properties.value;
        const rightValue = right.definition.properties.value;
        return value(leftValue >= rightValue);
      },
    },
  },
});

/**
 * Creates a new instance of a [[gte]] node, which is used to check if a given node's value is greater or equal than
 * the value of another graph node. This comparison is done with the `>=` operator.
 *
 *
 * @example **Comparing values**
 * ```js
 * import muster, { computed, gte } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(gte(5, 4)) // === true
 * await app.resolve(gte(5, 5)) // === true
 * await app.resolve(gte(5, 6)) // === false
 * await app.resolve(gte(computed([], () => 100), 99)) // === true
 * await app.resolve(gte(computed([], () => 100), 100)) // === true
 * await app.resolve(gte(computed([], () => 100), 101)) // === false
 * ```
 */
export function gte(
  left: NodeDefinition | NodeLike,
  right: NodeDefinition | NodeLike,
): GteNodeDefinition {
  return createNodeDefinition(GteNodeType, {
    left: isNodeDefinition(left) ? left : value(left),
    right: isNodeDefinition(right) ? right : value(right),
  });
}

export function isGteNodeDefinition(value: NodeDefinition): value is GteNodeDefinition {
  return value.type === GteNodeType;
}
