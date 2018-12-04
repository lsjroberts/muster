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
 * An instance of the [[parallel]] node.
 * See the [[parallel]] documentation to find out more.
 */
export interface ParallelNode extends StatelessGraphNode<'parallel', ParallelNodeProperties> {}

/**
 * A definition of the [[parallel]] node.
 * See the [[parallel]] documentation to find out more.
 */
export interface ParallelNodeDefinition
  extends StatelessNodeDefinition<'parallel', ParallelNodeProperties> {}

export interface ParallelNodeProperties {
  operations: Array<NodeDefinition>;
}

/**
 * The implementation of the [[parallel]] node.
 * See the [[parallel]] documentation to learn more.
 */
export const ParallelNodeType: StatelessNodeType<
  'parallel',
  ParallelNodeProperties
> = createNodeType<'parallel', ParallelNodeProperties>('parallel', {
  shape: {
    operations: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    evaluate: {
      cacheable: false,
      getDependencies({ operations }: ParallelNodeProperties): Array<NodeDependency> {
        return operations.map((operation) => ({ target: operation, once: true }));
      },
      run(node: ParallelNode, options: never, dependencies: Array<GraphNode>): NodeDefinition {
        return array(dependencies.map((node) => node.definition));
      },
    },
  },
});

/**
 * Creates a new instance of a [[parallel]] node, which is used to perform a set of operations as a single combined
 * operation. The set of results is assembled into an [[array]], maintaining the order
 * of nodes provided to the [[parallel]].
 *
 * Each input node is resolved to its result and then unsubscribed immediately. This means that,
 * unlike the the [[combineLatest]], the [[parallel]] resolves to a
 * single combined result and will not update if the value of one of the input nodes is updated.
 *
 * @example **Performing multiple updates at the same time**
 * ```js
 * import muster, { parallel, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   firstName: variable('Bob'),
 *   lastName: variable('Jones'),
 *   age: variable(39),
 * });
 *
 * await app.resolve(parallel([
 *   set('firstName', 'Jane'),
 *   set('lastName', 'Doe'),
 *   set('age', 24),
 * ]));
 * // === ['Jane', 'Doe', 24]
 * ```
 * This example shows how to use the [[parallel]] to set three [[variable]]s at the same
 * time.
 */
export function parallel(operations: Array<NodeDefinition | NodeLike>): ParallelNodeDefinition {
  return createNodeDefinition(ParallelNodeType, {
    operations: operations.map((operation) =>
      isNodeDefinition(operation) ? operation : value(operation),
    ),
  });
}

export function isParallelNodeDefinition(value: NodeDefinition): value is ParallelNodeDefinition {
  return value.type === ParallelNodeType;
}
