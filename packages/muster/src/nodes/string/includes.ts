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
 * An instance of the [[includes]] node.
 * See the [[includes]] documentation to find out more.
 */
export interface IncludesNode extends StatelessGraphNode<'includes', IncludesNodeProperties> {}

/**
 * A definition of the [[includes]] node.
 * See the [[includes]] documentation to find out more.
 */
export interface IncludesNodeDefinition
  extends StatelessNodeDefinition<'includes', IncludesNodeProperties> {}

export interface IncludesNodeProperties {
  pattern: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[includes]] node.
 * See the [[includes]] documentation to learn more.
 */
export const IncludesNodeType: StatelessNodeType<
  'includes',
  IncludesNodeProperties
> = createNodeType<'includes', IncludesNodeProperties>('includes', {
  shape: {
    pattern: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ pattern, subject }: IncludesNodeProperties): Array<NodeDependency> {
        return [
          {
            target: pattern,
            until: untilStringValueNode(IncludesNodeType, 'pattern'),
          },
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(IncludesNodeType, 'subject'),
          },
        ];
      },
      run(
        node: IncludesNode,
        options: never,
        [pattern, subject]: [ValueNode<string>, ValueNode<string>],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return value(false);
        const patternValue = pattern.definition.properties.value;
        const subjectValue = subject.definition.properties.value;
        return value((subjectValue || '').includes(patternValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[includes]] node, which is used when checking if a string contains a given pattern. The node
 * expects the subject to be a [[value]] that contains a string value.
 *
 *
 * @example **Check if a string includes a pattern**
 * ```js
 * import muster, { includes } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(includes('wor', 'Hello world'));
 * // === true
 *
 * await app.resolve(includes('els', 'Hello world'));
 * // === false
 * ```
 */
export function includes(pattern: NodeLike, subject: NodeLike): IncludesNodeDefinition {
  return createNodeDefinition(IncludesNodeType, {
    pattern: toValue(pattern),
    subject: toValue(subject),
  });
}

export function isIncludesNodeDefinition(value: NodeDefinition): value is IncludesNodeDefinition {
  return value.type === IncludesNodeType;
}
