import { NodeDefinition, NodeLike } from '../../types/graph';
import { deprecated } from '../../utils/deprecated';
import { length } from '../collection/keys/length';
import { toValue } from '../graph/value';

const showStrlenDeprecationWarning = deprecated({
  old: 'strlen',
  new: 'length',
});

/**
 * Creates a new instance of a [[strlen]] node, which is used when computing the length of a given string. When evaluated
 * this node resolves to a numeric [[value]] containing a length of the string.
 * @deprecated
 *
 * @example **Compute the length of a string**
 * ```js
 * import muster, { computed, ref, strlen } from '@dws/muster';
 *
 * const app = muster({
 *   someString: 'Hello world!',
 *   first: 'Bob',
 *   last: 'Marley',
 *   computedString: computed([ref('first'), ref('last')], (first, last) => `${first} ${last}`),
 * });
 *
 * await app.resolve(strlen('123456789')); // === 9
 * await app.resolve(strlen(ref('someString'))); // === 12
 * await app.resolve(strlen(ref('computedString'))); // === 10
 * ```
 */
export function strlen(subject: NodeLike): NodeDefinition {
  showStrlenDeprecationWarning();
  return length(toValue(subject));
}
