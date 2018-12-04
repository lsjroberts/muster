import { NodeDefinition, NodeLike } from '../../types/graph';
import { RootAndPath } from '../../utils/ref';
import { fn } from '../graph/fn';
import { update, UpdateNodeDefinition } from '../graph/update';
import { add } from './add';

/**
 * Create a node that increments a numeric variable
 *
 * @example **Increment a variable value**
 * ```ts
 * import muster, { increment, ref, variable } from '@dws/muster';
 *
 * const app = muster({
 *   counter: variable(0),
 * });
 *
 * app.resolve(ref('counter')).subscribe((counter) => {
 *   console.log(counter);
 * });
 *
 * await app.resolve(increment('counter'));
 * await app.resolve(increment('counter'));
 *
 * // Console output:
 * // 0
 * // 1
 * // 2
 * @returns {UpdateNodeDefinition}
 */
export function increment(rootAndPath: RootAndPath): UpdateNodeDefinition;
export function increment(path: NodeLike | Array<NodeLike>): UpdateNodeDefinition;
export function increment(target: NodeDefinition): UpdateNodeDefinition;
export function increment(
  root: NodeDefinition,
  path: NodeLike | Array<NodeLike>,
): UpdateNodeDefinition;
export function increment(
  ...args: Array<RootAndPath | NodeLike | Array<NodeLike> | NodeDefinition>
): UpdateNodeDefinition {
  const updater = fn((value) => add(value, 1));
  return (update as (
    ...args: Array<RootAndPath | NodeLike | Array<NodeLike | NodeDefinition>>
  ) => UpdateNodeDefinition)(...args, updater);
}
