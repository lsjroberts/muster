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
import { nil, NilNodeType } from '../graph/nil';
import { toValue, value, ValueNode } from '../graph/value';
import { RegexNode, toRegex } from './regex';

/**
 * An instance of the [[test]] node.
 * See the [[test]] documentation to find out more.
 */
export interface TestNode extends StatelessGraphNode<'test', TestNodeProperties> {}

/**
 * A definition of the [[test]] node.
 * See the [[test]] documentation to find out more.
 */
export interface TestNodeDefinition extends StatelessNodeDefinition<'test', TestNodeProperties> {}

export interface TestNodeProperties {
  regex: NodeDefinition;
  subject: NodeDefinition;
}

/**
 * The implementation of the [[test]] node.
 * See the [[test]] documentation to learn more.
 */
export const TestNodeType: StatelessNodeType<'test', TestNodeProperties> = createNodeType<
  'test',
  TestNodeProperties
>('test', {
  shape: {
    regex: graphTypes.nodeDefinition,
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ regex, subject }: TestNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(TestNodeType, 'subject'),
          },
          {
            target: regex,
            until: untilRegexNode(TestNodeType, 'regex'),
          },
        ];
      },
      run(
        node: TestNode,
        options: never,
        [subject, regex]: [ValueNode<string>, RegexNode],
      ): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        const subjectValue = subject.definition.properties.value;
        const regexValue = regex.definition.properties.pattern;
        return value(regexValue.test(subjectValue));
      },
    },
  },
});

/**
 * Creates a new instance of a [[test]] node, which is used when checking if a given regular expression matches a given
 * subject. It works in a similar way to `RegExp.test` from JavaScript.
 *
 *
 * @example **Check if a regex matches a string**
 * ```js
 * import muster, { regex, test } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(test(regex(/\d+/), '1'));
 * // === true
 *
 * await app.resolve(test(regex(/\d+/), '123'));
 * // === true
 *
 * await app.resolve(test(regex(/\d+/), 'asdf'));
 * // === false
 * ```
 */
export function test(regex: NodeLike, subject: NodeLike): TestNodeDefinition {
  return createNodeDefinition(TestNodeType, {
    regex: toRegex(regex),
    subject: toValue(subject),
  });
}

export function isTestNodeDefinition(value: NodeDefinition): value is TestNodeDefinition {
  return value.type === TestNodeType;
}
