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
import { NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';

/**
 * An instance of the [[endsWith]] node.
 * See the [[endsWith]] documentation to find out more.
 */
export interface EndsWithNode extends StatelessGraphNode<'ends-with', EndsWithNodeProperties> {}

/**
 * A definition of the [[endsWith]] node.
 * See the [[endsWith]] documentation to find out more.
 */
export interface EndsWithNodeDefinition
  extends StatelessNodeDefinition<'ends-with', EndsWithNodeProperties> {}

export interface EndsWithNodeProperties {
  pattern: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[endsWith]] node.
 * See the [[endsWith]] documentation to learn more.
 */
export const EndsWithNodeType: StatelessNodeType<
  'ends-with',
  EndsWithNodeProperties
> = createNodeType<'ends-with', EndsWithNodeProperties>('ends-with', {
  shape: {
    pattern: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ pattern, subject }: EndsWithNodeProperties): Array<NodeDependency> {
        return [
          {
            target: pattern,
            until: untilStringValueNode(EndsWithNodeType, 'pattern'),
          },
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(EndsWithNodeType, 'subject'),
          },
        ];
      },
      run(
        node: EndsWithNode,
        options: never,
        [pattern, subject]: [ValueNode<string>, ValueNode<string>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return value(false);
        const patternValue = pattern.definition.properties.value;
        const subjectValue = subject.definition.properties.value;
        return value((subjectValue || '').endsWith(patternValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[endsWith]] node, which is used when checking if a [[value]] containing a string ends with
 * a given pattern. The node expects the subject to be a [[value]] that contains a string value.
 *
 *
 * @example **Check if string ends with a pattern**
 * ```js
 * import muster, { endsWith } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(endsWith('Hello world', 'rld'));
 * // === true
 *
 * await app.resolve(endsWith('Hello world', 'abc'));
 * // === false
 * ```
 */
export function endsWith(pattern: NodeLike, subject: NodeLike): EndsWithNodeDefinition {
  return createNodeDefinition(EndsWithNodeType, {
    pattern: toValue(pattern),
    subject: toValue(subject),
  });
}

export function isEndsWithNodeDefinition(value: NodeDefinition): value is EndsWithNodeDefinition {
  return value.type === EndsWithNodeType;
}
