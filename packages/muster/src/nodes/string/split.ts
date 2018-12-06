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
import { untilPositiveIntegerValueNode } from '../../utils/is-positive-integer-value-node';
import { untilStringValueNode } from '../../utils/is-string-value-node';
import * as types from '../../utils/types';
import { array } from '../collection/array';
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[split]] node.
 * See the [[split]] documentation to find out more.
 */
export interface SplitNode extends StatelessGraphNode<'split', SplitNodeProperties> {}

/**
 * A definition of the [[split]] node.
 * See the [[split]] documentation to find out more.
 */
export interface SplitNodeDefinition
  extends StatelessNodeDefinition<'split', SplitNodeProperties> {}

export interface SplitNodeProperties {
  limit: NodeDefinition | undefined;
  separator: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[split]] node.
 * See the [[split]] documentation to learn more.
 */
export const SplitNodeType: StatelessNodeType<'split', SplitNodeProperties> = createNodeType<
  'split',
  SplitNodeProperties
>('split', {
  shape: {
    limit: types.optional(graphTypes.nodeDefinition),
    separator: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ limit, separator, subject }: SplitNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(SplitNodeType, 'subject'),
          },
          {
            target: separator,
            until: untilStringValueNode(SplitNodeType, 'separator'),
          },
          ...(limit
            ? [{ target: limit, until: untilPositiveIntegerValueNode(SplitNodeType, 'limit') }]
            : []),
        ];
      },
      run(
        node: SplitNode,
        options: never,
        [subject, separator, ...rest]: [ValueNode<string>, ValueNode<string>, ValueNode<number>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        const separatorValue = separator.definition.properties.value;
        const limitValue =
          rest.length === 1 ? (rest[0].definition.properties.value as number) : undefined;
        return array(subjectValue.split(separatorValue, limitValue).map(value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[split]] node, which is used for splitting a string by a given separator. The node expects the
 * subject and separator to be a [[value]] containing a string value. The [[split]] can
 * optionally define a limit - a [[value]] containing a numeric value. It works in a similar
 * way to the `String.split`.
 *
 *
 * @example **Split a string**
 * ```js
 * import muster, { split } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(split(
 *   'The quick brown fox jumps over the lazy dog',
 *   ' ',
 * ));
 * // === [
 * //   'The',
 * //   'quick',
 * //   'brown',
 * //   'fox',
 * //   'jumps',
 * //   'over',
 * //   'the',
 * //   'lazy',
 * //   'dog',
 * // ];
 * ```
 */
export function split(
  subject: NodeLike,
  separator: NodeLike,
  limit?: NodeLike,
): SplitNodeDefinition {
  return createNodeDefinition(SplitNodeType, {
    subject: toValue(subject),
    separator: toValue(separator),
    limit: limit ? toValue(limit) : undefined,
  });
}

export function isSplitNodeDefinition(value: NodeDefinition): value is SplitNodeDefinition {
  return value.type === SplitNodeType;
}
