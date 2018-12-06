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
 * An instance of the [[substring]] node.
 * See the [[substring]] documentation to find out more.
 */
export interface SubstringNode extends StatelessGraphNode<'substring', SubstringNodeProperties> {}

/**
 * A definition of the [[substring]] node.
 * See the [[substring]] documentation to find out more.
 */
export interface SubstringNodeDefinition
  extends StatelessNodeDefinition<'substring', SubstringNodeProperties> {}

export interface SubstringNodeProperties {
  endIndex: NodeDefinition | undefined;
  startIndex: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[substring]] node.
 * See the [[substring]] documentation to learn more.
 */
export const SubstringNodeType: StatelessNodeType<
  'substring',
  SubstringNodeProperties
> = createNodeType<'substring', SubstringNodeProperties>('substring', {
  shape: {
    endIndex: types.optional(graphTypes.nodeDefinition),
    startIndex: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({
        endIndex,
        startIndex,
        subject,
      }: SubstringNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(SubstringNodeType, 'subject'),
          },
          {
            target: startIndex,
            until: untilPositiveIntegerValueNode(SubstringNodeType, 'startIndex'),
          },
          ...(endIndex
            ? [
                {
                  target: endIndex,
                  until: untilPositiveIntegerValueNode(SubstringNodeType, 'endIndex'),
                },
              ]
            : []),
        ];
      },
      run(
        node: SubstringNode,
        options: never,
        [subject, startIndex, endIndex]: [ValueNode<string>, ValueNode<number>, ValueNode<number>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        const startIndexValue = startIndex.definition.properties.value;
        const endIndexValue = endIndex ? endIndex.definition.properties.value : undefined;
        if (startIndexValue > subjectValue.length) return value('');
        return value(subjectValue.substring(startIndexValue, endIndexValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[substring]] node, which is used when extracting a part of a given string. The node expects the
 * subject to be a [[value]] containing a string value. It also requires a startIndex,
 * which must be a [[value]] containing a numeric value. End index is optional and should also
 * be a [[value]] containing a numeric value. It works in a similar way to the
 * `String.substring` from JS.
 *
 *
 * @example **Extract a substring**
 * ```js
 * import muster, { substring } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(substring(
 *   'Hello world',
 *   1,
 * ));
 * // === 'ello world'
 *
 * await app.resolve(substring(
 *   'Hello world',
 *   0,
 *   5,
 * ));
 * // === 'Hello'
 * ```
 */
export function substring(
  subject: NodeLike,
  startIndex: NodeLike,
  endIndex?: NodeLike,
): SubstringNodeDefinition {
  return createNodeDefinition(SubstringNodeType, {
    endIndex: endIndex ? toValue(endIndex) : undefined,
    startIndex: toValue(startIndex),
    subject: toValue(subject),
  });
}

export function isSubstringNodeDefinition(value: NodeDefinition): value is SubstringNodeDefinition {
  return value.type === SubstringNodeType;
}
