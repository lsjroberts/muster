import { isNodeDefinition, NodeDefinition, NodeLike } from '../../types/graph';
import { fn } from '../graph/fn';
import { eq } from '../logic/eq';
import { gt } from '../logic/gt';
import { applyTransforms } from './apply-transforms';
import { head } from './head';
import { count } from './transforms/count';
import { filter } from './transforms/filter';

/**
 * A helper function that creates a [[NodeDefinition]] capable of checking if a given node
 * exists in a target collection.
 *
 *
 * @example **Check if contains a number**
 * ```js
 * import muster, { some, fn, gt, lt, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3],
 * });
 *
 * await app.resolve(some(ref('numbers'), 1)); // === true
 * await app.resolve(some(ref('numbers'), 4)); // === false
 * await app.resolve(some(ref('numbers'), fn((item) => gt(item, 0)))); // === true
 * await app.resolve(some(ref('numbers'), fn((item) => lt(item, 1)))); // === false
 * ```
 */
export function some(target: NodeDefinition, predicate: NodeLike): NodeDefinition {
  const predicateFn = isNodeDefinition(predicate) ? predicate : fn((item) => eq(item, predicate));
  const filteredCollection = applyTransforms(target, [filter(predicateFn), count()]);
  return gt(head(filteredCollection), 0);
}
