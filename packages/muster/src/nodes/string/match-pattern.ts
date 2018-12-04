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
import { untilRegexNode } from '../../utils/is-regex-node';
import { untilStringValueNode } from '../../utils/is-string-value-node';
import { array } from '../collection/array';
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';
import { RegexNode, toRegex } from './regex';

/**
 * An instance of the [[matchPattern]] node.
 * See the [[matchPattern]] documentation to find out more.
 */
export interface MatchPatternNode
  extends StatelessGraphNode<'match-pattern', MatchPatternNodeProperties> {}

/**
 * A definition of the [[matchPattern]] node.
 * See the [[matchPattern]] documentation to find out more.
 */
export interface MatchPatternNodeDefinition
  extends StatelessNodeDefinition<'match-pattern', MatchPatternNodeProperties> {}

export interface MatchPatternNodeProperties {
  regex: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[matchPattern]] node.
 * See the [[matchPattern]] documentation to learn more.
 */
export const MatchPatternNodeType: StatelessNodeType<
  'match-pattern',
  MatchPatternNodeProperties
> = createNodeType<'match-pattern', MatchPatternNodeProperties>('match-pattern', {
  shape: {
    regex: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ regex, subject }: MatchPatternNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(MatchPatternNodeType, 'subject'),
          },
          {
            target: regex,
            until: untilRegexNode(MatchPatternNodeType, 'regex'),
          },
        ];
      },
      run(
        node: MatchPatternNode,
        options: never,
        [subject, regex]: [ValueNode<string>, RegexNode],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        const pattern = regex.definition.properties.pattern;
        const result = subjectValue.match(pattern);
        return result ? array(result.map(value)) : nil();
      },
    },
  },
});

/**
 * Creates a new instance of a [[matchPattern]] node, which is used finding all regex matches from a given string. The node expects
 * the subject to be a [[value]] that contains a string value and a regex which is a
 * [[regex]]. It works in a similar way to the `String.match` node. The node resolves to an [[array]].
 *
 *
 * @example **Getting matches**
 * ```js
 * import muster, { matchPattern, regex } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(matchPattern(regex(/\d+/g), '123 321'));
 * // === [
 * //   '123',
 * //   '321',
 * // ]
 * ```
 */
export function matchPattern(regex: NodeLike, subject: NodeLike): MatchPatternNodeDefinition {
  return createNodeDefinition(MatchPatternNodeType, {
    regex: toRegex(regex),
    subject: toValue(subject),
  });
}

export function isMatchPatternNodeDefinition(
  value: NodeDefinition,
): value is MatchPatternNodeDefinition {
  return value.type === MatchPatternNodeType;
}
