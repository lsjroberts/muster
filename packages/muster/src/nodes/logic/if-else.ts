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
import { toNode } from '../../utils/to-node';
import { value, ValueNode, ValueNodeType } from '../graph/value';

/**
 * An instance of the [[ifElse]] node.
 * See the [[ifElse]] documentation to find out more.
 */
export interface IfElseNode extends StatelessGraphNode<'ifElse', IfElseNodeProperties> {}

/**
 * A definition of the [[ifElse]] node.
 * See the [[ifElse]] documentation to find out more.
 */
export interface IfElseNodeDefinition
  extends StatelessNodeDefinition<'ifElse', IfElseNodeProperties> {}

export interface IfElseNodeProperties {
  if: NodeDefinition;
  then: NodeDefinition;
  else: NodeDefinition;
}

/**
 * The implementation of the [[ifElse]] node.
 * See the [[ifElse]] documentation to learn more.
 */
export const IfElseNodeType: StatelessNodeType<'ifElse', IfElseNodeProperties> = createNodeType<
  'ifElse',
  IfElseNodeProperties
>('ifElse', {
  shape: {
    if: graphTypes.nodeDefinition,
    then: graphTypes.nodeDefinition,
    else: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ if: ifNode }: IfElseNodeProperties): Array<NodeDependency> {
        return [
          {
            target: ifNode,
            until: {
              predicate: ValueNodeType.is,
              errorMessage(node: GraphNode): string {
                return getInvalidTypeErrorMessage(
                  'IfElse node condition must resolve to value() nodes',
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
      run(node: IfElseNode, options: never, [condition]: [ValueNode<any>]): NodeDefinition {
        const { then: thenNode, else: elseNode } = node.definition.properties;
        const conditionValue = condition.definition.properties.value;
        return conditionValue ? thenNode : elseNode;
      },
    },
  },
});

/**
 * Creates a new instance of an [[ifElse]] node, which allows creation of conditional expressions. You can think of it as
 * a `if ... else ...` statement in any programming language. This node by conditionally resolving
 * to `then` node when the `if` condition resolves to `true`; otherwise resolves to `else`.
 * The `if`, `then` and `else` nodes can be any graph nodes.
 *
 *
 * @example **Simple if-else**
 * ```ts
 * import muster, { ifElse, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   isLoggedIn: variable(false),
 *   greeting: ifElse({
 *     if: ref('isLoggedIn'),
 *     then: 'Hello, logged-in user!',
 *     else: 'Hello, guest!',
 *   }),
 * });
 *
 * app.resolve(ref('greeting')).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Logging in');
 * await app.resolve(set('isLoggedIn', true));
 *
 * // Console output:
 * // Hello, guest!
 * // Logging in
 * // Hello, logged-in user!
 * ```
 */
export function ifElse(definition: {
  if: NodeDefinition | NodeLike;
  then: NodeDefinition | NodeLike;
  else: NodeDefinition | NodeLike;
}): IfElseNodeDefinition {
  return createNodeDefinition(IfElseNodeType, {
    if: isNodeDefinition(definition.if) ? definition.if : value(definition.if),
    then: isNodeDefinition(definition.then) ? definition.then : toNode(definition.then),
    else: isNodeDefinition(definition.else) ? definition.else : toNode(definition.else),
  });
}

export function isIfElseNodeDefinition(value: NodeDefinition): value is IfElseNodeDefinition {
  return value.type === IfElseNodeType;
}
