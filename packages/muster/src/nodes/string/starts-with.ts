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
 * An instance of the [[startsWith]] node.
 * See the [[startsWith]] documentation to find out more.
 */
export interface StartsWithNode
  extends StatelessGraphNode<'starts-with', StartsWithNodeProperties> {}

/**
 * A definition of the [[startsWith]] node.
 * See the [[startsWith]] documentation to find out more.
 */
export interface StartsWithNodeDefinition
  extends StatelessNodeDefinition<'starts-with', StartsWithNodeProperties> {}

export interface StartsWithNodeProperties {
  pattern: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[startsWith]] node.
 * See the [[startsWith]] documentation to learn more.
 */
export const StartsWithNodeType: StatelessNodeType<
  'starts-with',
  StartsWithNodeProperties
> = createNodeType<'starts-with', StartsWithNodeProperties>('starts-with', {
  shape: {
    pattern: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ pattern, subject }: StartsWithNodeProperties): Array<NodeDependency> {
        return [
          {
            target: pattern,
            until: untilStringValueNode(StartsWithNodeType, 'pattern'),
          },
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(StartsWithNodeType, 'subject'),
          },
        ];
      },
      run(
        node: StartsWithNode,
        options: never,
        [pattern, subject]: [ValueNode<string>, ValueNode<string>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return value(false);
        const patternValue = pattern.definition.properties.value;
        const subjectValue = subject.definition.properties.value;
        return value((subjectValue || '').startsWith(patternValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[startsWith]] node, which is used when checking if a given string starts with a given pattern.
 * The node expects the subject and the pattern to be a [[value]] containing a string value.
 *
 *
 * @example **Check if a string starts with a pattern**
 * ```js
 * import muster, { startsWith } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(startsWith('Hello world', 'He'));
 * // === true
 *
 * await app.resolve(startsWith('Hello world', 'abc'));
 * // === false
 * ```
 */
export function startsWith(pattern: NodeLike, subject: NodeLike): StartsWithNodeDefinition {
  return createNodeDefinition(StartsWithNodeType, {
    pattern: toValue(pattern),
    subject: toValue(subject),
  });
}

export function isStartsWithNodeDefinition(
  value: NodeDefinition,
): value is StartsWithNodeDefinition {
  return value.type === StartsWithNodeType;
}
