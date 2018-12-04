import { NodeDefinition, NodeLike } from '../../types/graph';
import { RootAndPath } from '../../utils/ref';
import { fn } from '../graph/fn';
import { update, UpdateNodeDefinition } from '../graph/update';
import { subtract } from './subtract';

/**
 * Create a node that decrements a numeric variable
 *
 * @example **Increment a variable value**
 * ```ts
 * import muster, { decrement, ref, variable } from '@dws/muster';
 *
 * const app = muster({
 *   counter: variable(3),
 * });
 *
 * app.resolve(ref('counter')).subscribe((counter) => {
 *   console.log(counter);
 * });
 *
 * await app.resolve(decrement('counter'));
 * await app.resolve(decrement('counter'));
 *
 * // Console output:
 * // 3
 * // 2
 * // 1
 * @returns {UpdateNodeDefinition}
 */
export function decrement(rootAndPath: RootAndPath): UpdateNodeDefinition;
export function decrement(path: NodeLike | Array<NodeLike>): UpdateNodeDefinition;
export function decrement(target: NodeDefinition): UpdateNodeDefinition;
export function decrement(
  root: NodeDefinition,
  path: NodeLike | Array<NodeLike>,
): UpdateNodeDefinition;
export function decrement(
  ...args: Array<RootAndPath | NodeLike | Array<NodeLike> | NodeDefinition>
): UpdateNodeDefinition {
  const updater = fn((value) => subtract(value, 1));
  return (update as (
    ...args: Array<RootAndPath | NodeLike | Array<NodeLike | NodeDefinition>>
  ) => UpdateNodeDefinition)(...args, updater);
}
