import upperFirst from 'lodash/upperFirst';
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
 * An instance of the [[sentenceCase]] node.
 * See the [[sentenceCase]] documentation to find out more.
 */
export interface SentenceCaseNode
  extends StatelessGraphNode<'sentence-case', SentenceCaseNodeProperties> {}

/**
 * A definition of the [[sentenceCase]] node.
 * See the [[sentenceCase]] documentation to find out more.
 */
export interface SentenceCaseNodeDefinition
  extends StatelessNodeDefinition<'sentence-case', SentenceCaseNodeProperties> {}

export interface SentenceCaseNodeProperties {
  subject: NodeDefinition;
}

/**
 * The implementation of the [[sentenceCase]] node.
 * See the [[sentenceCase]] documentation to learn more.
 */
export const SentenceCaseNodeType: StatelessNodeType<
  'sentence-case',
  SentenceCaseNodeProperties
> = createNodeType<'sentence-case', SentenceCaseNodeProperties>('sentence-case', {
  shape: {
    subject: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ subject }: SentenceCaseNodeProperties): Array<NodeDependency> {
        return [
          {
            target: subject,
            acceptNil: true,
            until: untilStringValueNode(SentenceCaseNodeType, 'subject'),
          },
        ];
      },
      run(node: SentenceCaseNode, options: never, [subject]: [ValueNode<string>]): NodeDefinition {
        if (NilNodeType.is(subject)) return nil();
        return value(upperFirst(subject.definition.properties.value));
      },
    },
  },
});

/**
 * Creates a new instance of a [[sentenceCase]] node, which is used when converting a string to a sentence case string.
 * The node expects the subject to be a [[value]] that contains a string value. It works in a
 * similar way to the `upperFirst` function from `lodash`.
 *
 *
 * @example **Convert string to upper case**
 * ```js
 * import muster, { sentenceCase } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(sentenceCase('hello world'));
 * // === 'Hello world'
 *
 * await app.resolve(sentenceCase('Hello World'));
 * // === 'Hello World'
 *
 * await app.resolve(sentenceCase('hello WORLD'));
 * // === 'Hello WORLD'
 * ```
 */
export function sentenceCase(subject: NodeLike): SentenceCaseNodeDefinition {
  return createNodeDefinition(SentenceCaseNodeType, {
    subject: toValue(subject),
  });
}

export function isSentenceCaseNodeDefinition(
  value: NodeDefinition,
): value is SentenceCaseNodeDefinition {
  return value.type === SentenceCaseNodeType;
}
