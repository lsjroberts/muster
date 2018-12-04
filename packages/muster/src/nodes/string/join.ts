import flatMap from 'lodash/flatMap';
import {
  GraphNode,
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
import { untilStringValueNode } from '../../utils/is-string-value-node';
import * as types from '../../utils/types';
import { entries } from '../graph/entries';
import { NilNodeType } from '../graph/nil';
import { query } from '../graph/query';
import { toValue, value, ValueNode, ValueNodeType } from '../graph/value';

/**
 * An instance of the [[join]] node.
 * See the [[join]] documentation to find out more.
 */
export interface JoinNode extends StatelessGraphNode<'join', JoinNodeProperties> {}

/**
 * A definition of the [[join]] node.
 * See the [[join]] documentation to find out more.
 */
export interface JoinNodeDefinition extends StatelessNodeDefinition<'join', JoinNodeProperties> {}

export interface JoinNodeProperties {
  operands: Array<NodeDefinition>;
  separator: NodeDefinition;
}

/**
 * The implementation of the [[join]] node.
 * See the [[join]] documentation to learn more.
 */
export const JoinNodeType: StatelessNodeType<'join', JoinNodeProperties> = createNodeType<
  'join',
  JoinNodeProperties
>('join', {
  shape: {
    operands: types.arrayOf(graphTypes.nodeDefinition),
    separator: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ operands, separator }: JoinNodeProperties): Array<NodeDependency> {
        return [
          {
            target: separator,
            until: untilValidSeparator,
          },
          ...operands.map((operand) => ({
            target: operand,
            acceptNil: true,
            until: untilValidJoinOperand,
          })),
        ];
      },
      run(
        node: JoinNode,
        options: never,
        [separator, ...operands]: [ValueNode<string>, ValueNode<string | Array<string>>],
      ): NodeDefinition {
        return value(
          flatMap(operands.filter((operand) => !NilNodeType.is(operand)), (operand) => {
            const { value } = operand.definition.properties;
            return typeof value === 'string' ? [value] : value;
          }).join(separator.definition.properties.value),
        );
      },
    },
  },
});

const untilValidSeparator = untilStringValueNode(JoinNodeType, 'separator');

const untilValidJoinOperand = {
  predicate(node: GraphNode) {
    if (!ValueNodeType.is(node)) return false;
    const { value } = node.definition.properties;
    return (
      typeof value === 'string' ||
      (Array.isArray(value) && value.every((item) => typeof item === 'string'))
    );
  },
  errorMessage(node: GraphNode) {
    return getInvalidTypeErrorMessage('Join node operand resolved to an incorrect node.', {
      expected: ['value(string)', 'value(Array<string>)'],
      received: node.definition,
    });
  },
};

/**
 * Creates a new instance of a [[join]] node, which is used when joining a number of strings together. The node expects each
 * operand to be a [[value]] containing a string value. The node works in a similar way to
 * `Array.join` from JS.
 *
 *
 * @example **Join strings**
 * ```js
 * import muster, { join } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(join(' ', 'Hello', 'world'));
 * // === 'Hello world';
 * ```
 *
 *
 * @example **Join array of strings**
 * ```js
 * import muster, { join, ref, value } from '@dws/muster';
 *
 * const app = muster({
 *   names: value(['Bob', 'Jane', 'Kate']),
 * });
 *
 * await app.resolve(join(' ', ref('names')));
 * // === 'Bob Jane Kate'
 * ```
 *
 * @example **Join a collection of strings**
 * ```js
 * import muster, { entries, join, joinItems, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   names: ['Bob', 'Jane', 'Kate'],
 * });
 *
 * await app.resolve(join(' ', query(ref('names'), entries())));
 * // === 'Bob Jane Kate'
 *
 * // OR
 *
 * await app.resolve(joinItems(' ', ref('names')));
 * // === 'Bob Jane Kate'
 * ```
 */
export function join(separator: NodeLike, ...operands: Array<NodeLike>): JoinNodeDefinition {
  return createNodeDefinition(JoinNodeType, {
    operands: operands.map(toValue),
    separator: toValue(separator),
  });
}

/**
 * A helper function that creates a [[join]] node with each operand mapped to
 * a `query(operand, entries())`.
 * See the [[join]] documentation page to find out more.
 *
 *
 * @example **Join a collection of strings**
 * ```js
 * import muster, { entries, join, joinItems, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   names: ['Bob', 'Jane', 'Kate'],
 * });
 *
 * await app.resolve(joinItems(' ', ref('names')));
 * // === 'Bob Jane Kate'
 * ```
 */
export function joinItems(
  separator: NodeLike,
  ...collections: Array<NodeDefinition>
): JoinNodeDefinition {
  return join(separator, ...collections.map((collection) => query(collection, entries())));
}

export function isJoinNodeDefinition(value: NodeDefinition): value is JoinNodeDefinition {
  return value.type === JoinNodeType;
}
