import {
  GraphNode,
  isNodeDefinition,
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
import * as types from '../../utils/types';
import { once } from './once';
import { value } from './value';

/**
 * An instance of the [[series]] node.
 * See the [[series]] documentation to find out more.
 */
export interface SeriesNode extends StatelessGraphNode<'series', SeriesNodeProperties> {}

/**
 * A definition of the [[series]] node.
 * See the [[series]] documentation to find out more.
 */
export interface SeriesNodeDefinition
  extends StatelessNodeDefinition<'series', SeriesNodeProperties> {}

export interface SeriesNodeProperties {
  operations: Array<NodeDefinition>;
}

/**
 * The implementation of the [[series]] node.
 * See the [[series]] documentation to learn more.
 */
export const SeriesNodeType: StatelessNodeType<'series', SeriesNodeProperties> = createNodeType<
  'series',
  SeriesNodeProperties
>('series', {
  shape: {
    operations: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ operations }: SeriesNodeProperties): Array<NodeDependency> {
        return operations.length > 0 ? [{ target: operations[0], once: true }] : [];
      },
      run(node: SeriesNode, options: never, [result]: [GraphNode]): NodeDefinition {
        const operations = node.definition.properties.operations;
        if (operations.length === 0) return value(undefined);
        if (operations.length === 1) return once(result.definition);
        return series(operations.slice(1));
      },
    },
  },
});

/**
 * Creates a new instance of a [[series]] node, which is used when you need to resolve a series of nodes. You can think
 * of this node as of a list of statements to be executed, and the last statement being a `return`
 * statement. The statements are executed one after another.
 *
 *
 * @example **Resolve a series**
 * ```js
 * import muster, { series, set, value, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('initial name'),
 *   description: variable('initial description'),
 * });
 *
 * const result = await app.resolve(series([
 *   set('name', 'updated name'),
 *   set('description', 'updated description'),
 *   value(true),
 * ]));
 * // result === true
 * ```
 * This example shows how to use the [[series]] to combine multiple operations. One thing to
 * remember is that the operations are executed in order so one failing operation will prevent
 * those following from running.
 *
 *
 * @example **Failing operation in the series**
 * ```js
 * import muster, { computed, error, ref, series } from '@dws/muster';
 *
 * const app = muster({
 *   first: computed([], () => {
 *     console.log('Computing first');
 *     return 1;
 *   }),
 *   second: computed([], () => {
 *     console.log('Computing second');
 *     throw new Error('Boom!');
 *   }),
 *   third: computed([], () => {
 *     console.log('Computing third');
 *     return 3;
 *   }),
 * });
 *
 * const result = await app.resolve(series([
 *   ref('first'),
 *   ref('second'),
 *   ref('third'),
 * ]));
 * // result === 'Boom!'
 *
 * // Console output:
 * // Computing first
 * // Computing second
 * ```
 * This example shows what happens with the [[series]] when one of the nodes in the series
 * returns an error. From the console output you can deduce that the `third` node is never
 * resolved.
 */
export function series(operations: Array<NodeDefinition | NodeLike>): SeriesNodeDefinition {
  return createNodeDefinition(SeriesNodeType, {
    operations: operations.map((operation) =>
      isNodeDefinition(operation) ? operation : value(operation),
    ),
  });
}

export function isSeriesNodeDefinition(value: NodeDefinition): value is SeriesNodeDefinition {
  return value.type === SeriesNodeType;
}
