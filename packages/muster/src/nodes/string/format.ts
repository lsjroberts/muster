const es6TemplateStrings = require('es6-template-strings');
import fromPairs from 'lodash/fromPairs';
import mapValues from 'lodash/mapValues';
import toPairs from 'lodash/toPairs';
import zipWith from 'lodash/zipWith';
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
import * as types from '../../utils/types';
import { toValue, value, ValueNode } from '../graph/value';

export interface NodeLikeFormatData {
  [key: string]: NodeLike;
}

export type FormatData = Array<[string, NodeDefinition]>;

/**
 * An instance of the [[format]] node.
 * See the [[format]] documentation to find out more.
 */
export interface FormatNode extends StatelessGraphNode<'format', FormatNodeProperties> {}

/**
 * A definition of the [[format]] node.
 * See the [[format]] documentation to find out more.
 */
export interface FormatNodeDefinition
  extends StatelessNodeDefinition<'format', FormatNodeProperties> {}

export interface FormatNodeProperties {
  data: FormatData;
  format: string;
}

/**
 * The implementation of the [[format]] node.
 * See the [[format]] documentation to learn more.
 */
export const FormatNodeType: StatelessNodeType<'format', FormatNodeProperties> = createNodeType<
  'format',
  FormatNodeProperties
>('format', {
  shape: {
    format: types.string,
    data: types.arrayOf(
      types.arrayOf(
        types.oneOfType<string | NodeDefinition>([types.string, graphTypes.nodeDefinition]),
      ),
    ),
  },
  operations: {
    evaluate: {
      getDependencies({ data }: FormatNodeProperties): Array<NodeDependency> {
        return data.map(([key, dependency]) => ({
          target: dependency,
          until: untilStringValueNode(FormatNodeType, `data.${key}`),
        }));
      },
      run(
        node: FormatNode,
        options: never,
        dependencies: Array<ValueNode<string>>,
      ): NodeDefinition {
        const data = buildFormatInput(node.definition.properties.data, dependencies);
        return value(es6TemplateStrings(node.definition.properties.format, data));
      },
    },
  },
});

/**
 * Creates a new instance of a [[format]] node, which is used converting a values of objects to string and inserts them into
 * another string. It uses the same syntax as the [Format Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
 * from JavaScript.
 *
 *
 * @example **Simple format string**
 * ```js
 * import muster, { ref, format } from '@dws/muster';
 *
 * const app = muster({
 *   name: 'Bob',
 * });
 *
 * const greeting = await app.resolve(format('Hello, ${name}', {
 *   name: ref('name'),
 * }));
 * // === 'Hello, Bob'
 * ```
 * This example shows how to use the [[format]] to create a string from a given format
 * and a value of a graph node.
 */
export function format(format: string, data: NodeLikeFormatData): FormatNodeDefinition {
  return createNodeDefinition(FormatNodeType, {
    format,
    data: toPairs(mapValues(data, toValue)),
  });
}

export function isFormatNodeDefinition(value: NodeDefinition): value is FormatNodeDefinition {
  return value.type === FormatNodeType;
}

function buildFormatInput(data: FormatData, resolvedValues: Array<ValueNode<string>>): any {
  return fromPairs(
    zipWith(
      data,
      resolvedValues as any,
      (([key]: [string], value: ValueNode<string>) => [
        key,
        value.definition.properties.value,
      ]) as any,
    ),
  );
}
