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
import { array } from '../collection/array';
import { value } from './value';

/**
 * An instance of the [[combineLatest]] node.
 * See the [[combineLatest]] documentation to find out more.
 */
export interface CombineLatestNode
  extends StatelessGraphNode<'combineLatest', CombineLatestNodeProperties> {}

/**
 * A definition of the [[combineLatest]] node.
 * See the [[combineLatest]] documentation to find out more.
 */
export interface CombineLatestNodeDefinition
  extends StatelessNodeDefinition<'combineLatest', CombineLatestNodeProperties> {}

export interface CombineLatestNodeProperties {
  operations: Array<NodeDefinition>;
}

/**
 * The implementation of the [[combineLatest]].
 * See the [[combineLatest]] documentation page to lear more.
 */
export const CombineLatestNodeType: StatelessNodeType<
  'combineLatest',
  CombineLatestNodeProperties
> = createNodeType<'combineLatest', CombineLatestNodeProperties>('combineLatest', {
  shape: {
    operations: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ operations }: CombineLatestNodeProperties): Array<NodeDependency> {
        return operations.map((operation) => ({ target: operation }));
      },
      run(node: CombineLatestNode, options: never, dependencies: Array<GraphNode>): NodeDefinition {
        return array(dependencies.map((node) => node.definition));
      },
    },
  },
});

/**
 * Creates a new instance of a [[combineLatest]] node, which is a type of a [[NodeDefinition]] used to join
 * the current values of multiple input nodes into a combined output.
 * The result of resolving the input nodes is assembled into an [[array]], maintaining the order of nodes provided to the
 * [[combineLatest]].
 *
 * When subscribing to a [[combineLatest]] node, a live subscription is created for each of the input nodes.
 * This means that, unlike the the [[parallel]] node, the [[combineLatest]] will emit a new output value whenever
 * one of its input nodes is updated.
 *
 * @example **Combining the current values of multiple input variables**
 * ```js
 * import muster, { combineLatest, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   firstName: variable('Bob'),
 *   lastName: variable('Jones'),
 *   age: variable(39),
 * });
 *
 * app.resolve(combineLatest([
 *   ref('firstName'),
 *   ref('lastName'),
 *   ref('age'),
 * ])).subscribe((value) => console.log(value));
 *
 * console.log('Setting age to 40');
 * await app.resolve(set('age', 40)) // === 40
 *
 * // Console output:
 * // ['Bob', 'Jones', 39]
 * // Setting age to 40
 * // ['Bob', 'Jones', 40]
 * ```
 * This example shows how to use the [[combineLatest]] to resolve three [[NodeDefinition]]s,
 * whose values cause the overall result to re-emit.
 */
export function combineLatest(
  operations: Array<NodeDefinition | NodeLike>,
): CombineLatestNodeDefinition {
  return createNodeDefinition(CombineLatestNodeType, {
    operations: operations.map((operation) =>
      isNodeDefinition(operation) ? operation : value(operation),
    ),
  });
}

export function isCombineLatestNodeDefinition(
  value: NodeDefinition,
): value is CombineLatestNodeDefinition {
  return value.type === CombineLatestNodeType;
}
