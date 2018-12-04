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
import { untilStringValueNode } from '../../utils/is-string-value-node';
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[replace]] node.
 * See the [[replace]] documentation to find out more.
 */
export interface ReplaceNode extends StatelessGraphNode<'replace', ReplaceNodeProperties> {}

/**
 * A definition of the [[replace]] node.
 * See the [[replace]] documentation to find out more.
 */
export interface ReplaceNodeDefinition
  extends StatelessNodeDefinition<'replace', ReplaceNodeProperties> {}

export interface ReplaceNodeProperties {
  pattern: NodeDefinition;
  replacePattern: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[replace]] node.
 * See the [[replace]] documentation to learn more.
 */
export const ReplaceNodeType: StatelessNodeType<'replace', ReplaceNodeProperties> = createNodeType<
  'replace',
  ReplaceNodeProperties
>('replace', {
  shape: {
    pattern: graphTypes.nodeDefinition,
    replacePattern: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({
        pattern,
        replacePattern,
        subject,
      }: ReplaceNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(ReplaceNodeType, 'subject'),
          },
          {
            target: pattern,
            until: untilStringValueNode(ReplaceNodeType, 'pattern'),
          },
          {
            target: replacePattern,
            until: untilStringValueNode(ReplaceNodeType, 'replacePattern'),
          },
        ];
      },
      run(
        node: ReplaceNode,
        options: never,
        [subject, pattern, replacePattern]: Array<ValueNode<string>>,
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        const patternValue = pattern.definition.properties.value;
        const replacePatternValue = replacePattern.definition.properties.value;
        return value((subjectValue || '').replace(patternValue, replacePatternValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[replace]] node, which is used for replacing a specific pattern in a given string with another
 * string. The node expects the subject, pattern and replacement pattern to be a [[value]]
 * containing a string value. It resolves to a [[value]] with a string value.
 *
 *
 * @example **Replace a string**
 * ```js
 * import muster, { replace } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(replace(
 *   'world',
 *   'Bob',
 *   'Hello, world',
 * ));
 * // === 'Hello, Bob'
 * ```
 */
export function replace(
  pattern: NodeLike,
  replacePattern: NodeLike,
  subject: NodeLike,
): ReplaceNodeDefinition {
  return createNodeDefinition(ReplaceNodeType, {
    pattern: toValue(pattern),
    replacePattern: toValue(replacePattern),
    subject: toValue(subject),
  });
}

export function isReplaceNodeDefinition(value: NodeDefinition): value is ReplaceNodeDefinition {
  return value.type === ReplaceNodeType;
}
