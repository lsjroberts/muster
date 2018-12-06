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
import * as types from '../../utils/types';
import { value, ValueNode, ValueNodeType } from '../graph/value';

/**
 * An instance of the [[or]] node.
 * See the [[or]] documentation to find out more.
 */
export interface OrNode extends StatelessGraphNode<'or', OrNodeProperties> {}

/**
 * A definition of the [[or]] node.
 * See the [[or]] documentation to find out more.
 */
export interface OrNodeDefinition extends StatelessNodeDefinition<'or', OrNodeProperties> {}

export interface OrNodeProperties {
  operands: Array<NodeDefinition>;
}

/**
 * The implementation of the [[or]] node.
 * See the [[or]] documentation to learn more.
 */
export const OrNodeType: StatelessNodeType<'or', OrNodeProperties> = createNodeType<
  'or',
  OrNodeProperties
>('or', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      getDependencies({ operands }: OrNodeProperties): Array<NodeDependency> {
        return operands.map((operand) => ({
          target: operand,
          until: {
            predicate: ValueNodeType.is,
            errorMessage(node: GraphNode): string {
              return getInvalidTypeErrorMessage('Or node operands must resolve to value() nodes', {
                expected: ValueNodeType,
                received: node.definition,
              });
            },
          },
        }));
      },
      run(node: OrNode, options: never, operands: Array<ValueNode<any>>): NodeDefinition {
        return value(operands.some((operand) => Boolean(operand.definition.properties.value)));
      },
    },
  },
});

/**
 * Creates a new instance of a [[or]] node, which introduces an `or` expression. It checks if at least one of its
 * operands resolves to truthy. The conversion to boolean is done with the `Boolean` JS
 * function.  It requires every operand to resolve to a [[value]]. It throws an error if an
 * operand resolves to any other node type.
 *
 * @example **Different variants of `or` operands**
 * ```js
 * import muster, { computed, or, value } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(or(true)) // === true
 * await app.resolve(or(false)) // === false
 * await app.resolve(or(value(true))) // === true - it is equivalent to or(true)
 * await app.resolve(or('hello world')) // === true
 * await app.resolve(or(true, false)) // === true
 * await app.resolve(or(false, false)) // === false
 * await app.resolve(or(computed([], () => false))) // === false
 * await app.resolve(or(computed([], () => true))) // === true
 * await app.resolve(or(computed([], () => true), true)) // === true
 * await app.resolve(or(computed([], () => true), false)) // === true
 * await app.resolve(or(computed([], () => false), false)) // === false
 * ```
 */
export function or(...operands: Array<NodeDefinition | NodeLike>): OrNodeDefinition {
  return createNodeDefinition(OrNodeType, {
    operands: operands.map((operand) => (isNodeDefinition(operand) ? operand : value(operand))),
  });
}

export function isOrNodeDefinition(value: NodeDefinition): value is OrNodeDefinition {
  return value.type === OrNodeType;
}
