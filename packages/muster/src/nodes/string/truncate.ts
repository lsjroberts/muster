// tslint:disable-next-line:import-name-case-insensitive
import lodashTruncate from 'lodash/truncate';
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
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[truncate]] node.
 * See the [[truncate]] documentation to find out more.
 */
export interface TruncateNode extends StatelessGraphNode<'truncate', TruncateNodeProperties> {}

/**
 * A definition of the [[truncate]] node.
 * See the [[truncate]] documentation to find out more.
 */
export interface TruncateNodeDefinition
  extends StatelessNodeDefinition<'truncate', TruncateNodeProperties> {}

export interface TruncateNodeProperties {
  length: NodeDefinition;
  omission: NodeDefinition | undefined;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[truncate]] node.
 * See the [[truncate]] documentation to learn more.
 */
export const TruncateNodeType: StatelessNodeType<
  'truncate',
  TruncateNodeProperties
> = createNodeType<'truncate', TruncateNodeProperties>('truncate', {
  shape: {
    length: graphTypes.nodeDefinition,
    omission: types.optional(graphTypes.nodeDefinition),
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({
        length,
        omission,
        subject,
      }: TruncateNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(TruncateNodeType, 'subject'),
          },
          {
            target: length,
            until: untilPositiveIntegerValueNode(TruncateNodeType, 'length'),
          },
          ...(omission
            ? [
                {
                  target: omission,
                  until: untilStringValueNode(TruncateNodeType, 'omission'),
                },
              ]
            : []),
        ];
      },
      run(
        node: TruncateNode,
        options: never,
        [subject, length, omission]: [ValueNode<string>, ValueNode<number>, ValueNode<string>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        const lengthValue = length.definition.properties.value;
        const omissionValue = omission ? omission.definition.properties.value : '…';
        return value(
          lodashTruncate(subjectValue, {
            length: lengthValue,
            omission: omissionValue,
          }),
        );
      },
    },
  },
});

/**
 * Creates a new instance of a [[truncate]] node, which is used for truncating a string to a given length. The node expects
 * the subject to be a [[value]] containing a string value. It works in the same way as
 * `truncate` from `lodash`. By default, the omission is configured to `...` but it can be changed.
 *
 *
 * @example **Truncate a string**
 * ```js
 * import muster, { truncate } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(truncate('Hello world', 5));
 * // === 'He...'
 *
 * await app.resolve(truncate('Hello world', 8));
 * // === 'Hello...'
 *
 * await app.resolve(truncate('Hello world', 6, '+'));
 * // === 'Hello+'
 *
 * await app.resolve(truncate('Hello world', 8, '+'));
 * // === 'Hello w+'
 * ```
 */
export function truncate(
  subject: NodeLike,
  length: NodeLike,
  omission?: NodeLike,
): TruncateNodeDefinition {
  return createNodeDefinition(TruncateNodeType, {
    length: toValue(length),
    omission: omission ? toValue(omission) : undefined,
    subject: toValue(subject),
  });
}

export function isTruncateNodeDefinition(value: NodeDefinition): value is TruncateNodeDefinition {
  return value.type === TruncateNodeType;
}
