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
 * An instance of the [[not]] node.
 * See the [[not]] documentation to find out more.
 */
export interface NotNode extends StatelessGraphNode<'not', NotNodeProperties> {}

/**
 * A definition of the [[not]] node.
 * See the [[not]] documentation to find out more.
 */
export interface NotNodeDefinition extends StatelessNodeDefinition<'not', NotNodeProperties> {}

export interface NotNodeProperties {
  condition: NodeDefinition;
}

/**
 * The implementation of the [[not]] node.
 * See the [[not]] documentation to learn more.
 */
export const NotNodeType: StatelessNodeType<'not', NotNodeProperties> = createNodeType<
  'not',
  NotNodeProperties
>('not', {
  shape: {
    condition: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ condition }: NotNodeProperties): Array<NodeDependency> {
        return [
          {
            target: condition,
            until: {
              predicate: ValueNodeType.is,
              errorMessage(node: GraphNode): string {
                return getInvalidTypeErrorMessage(
                  'Not node condition must resolve to a value() node',
                  {
                    expected: ValueNodeType,
                    received: node.definition,
                  },
                );
              },
            },
          },
        ];
      },
      run(node: NotNode, options: never, [condition]: [ValueNode<any>]): NodeDefinition {
        return value(!condition.definition.properties.value);
      },
    },
  },
});

/**
 * Creates a new instance of a [[not]] node, which is used when negating the value of a graph node.
 * This node expects the expression to resolve to a [[value]]. It throws an error if an
 * expression resolves to any other type.
 *
 * @example **Negating values**
 * ```js
 * import muster, { computed, not, value } from '@dws/muster';
 *
 * const app = muster({});
 * await app.resolve(not(false)) // === true
 * await app.resolve(not(true)) // === false
 * await app.resolve(not('hello world')) // === false
 * await app.resolve(not(123)) // === false
 * await app.resolve(not(value({ }))) // === false
 * await app.resolve(not(not(true))) // === true
 * await app.resolve(not(computed([], () => false))) // === true
 * await app.resolve(not(computed([], () => true))) // === false
 * ```
 */
export function not(condition: NodeDefinition | NodeLike): NotNodeDefinition {
  return createNodeDefinition(NotNodeType, {
    condition: isNodeDefinition(condition) ? condition : value(condition),
  });
}

export function isNotNodeDefinition(value: NodeDefinition): value is NotNodeDefinition {
  return value.type === NotNodeType;
}
