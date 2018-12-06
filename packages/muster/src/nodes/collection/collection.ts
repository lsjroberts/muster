import { GraphNode, NodeDefinition, NodeLike } from '../../types/graph';
import { deprecated } from '../../utils/deprecated';
import { applyTransforms } from './apply-transforms';

const showCollectionDeprecationWarning = deprecated({
  old: 'collection',
  new: 'applyTransforms',
});

/**
 * Creates a new instance of a [[collection]] node, which is a type of [[NodeDefinition]] which can handle collections of items.
 * These items can be either [values](_nodes_graph_value_.html#value) or [[tree]]s. It's recommended that items in a collection be
 * of the same type (and in case of [[tree]] - shape).
 *
 * Collections support a number of transforms. These transforms can be applied in any order to a
 * target collection.
 * - **count** ([[count]]) - Gets the count of items found in the collection
 * - **filter** ([[filter]]) - Filters the collection based on a given predicate
 * - **map** ([[map]]) - Performs a map transform on the every item of the collection
 * - **slice** ([[slice]]) - Slices the collection based on a defined range
 * - **sort** ([[sort]]) - Sorts the items based on a given predicate
 * - **groupBy** ([[groupBy]]) - Groups the items based on a given predicate
 * - **firstItem** ([[firstItem]]) - Takes a first item of the collection
 * - **lastItem** ([[lastItem]]) - Takes the last item of the collection
 * - **nthItem** ([[nthItem]]) - Takes nth (0-based) item of the collection
 * - **take** ([[take]]) - Takes a given number of items from the collection
 *
 * At creation, every [[collection]] requires a source for its items. Currently
 * Muster supports following collection data sources:
 * - **array** ([[array]]) - An in-memory array.
 * - **arrayList** ([[arrayList]]) - An in-memory mutable array
 * - **nodeList** ([[nodeList]])) - An in-memory array of GraphNodes.
 * - **another collection node** - This can be useful when one collection contains partially
 *   filtered items and another collection uses the output of it and applies another set of
 *   transforms to it
 * - **a remote collection** - See the [[proxy]] and [[remote]] documentation to learn
 *   more.
 *
 * @deprecated
 *
 *
 * @example **Basic collections**
 * ```js
 * import muster, { entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3], // Implicit conversion to a collection
 *   // Which is the same as:
 *   // numbers: collection([1, 2, 3]),
 *   // Or even more explicitly as :
 *   // numbers: collection(arrayDataSource([1, 2, 3]))
 * });
 *
 * const numbers = await app.resolve(query(ref('numbers'), entries()));
 * // numbers === [1, 2, 3]
 * ```
 * This example shows how to create a basic collection containing [values](_nodes_graph_value_.html#value), and how to access
 * the items from it. The process of getting items out of collection requires the use of a
 * [[query]] with an [[entries]]. See the [[query]] documentation to learn more about
 * building queries.
 *
 * The query to the [[collection]] resolves to an [[array]], which behaves just like a
 * [value](_nodes_graph_value_.html#value) but stores an array of [[NodeDefinition]]s.
 *
 * It is possible to get items from a [[collection]] by just resolving a [ref](_utils_ref_.html#ref), but such
 * `ref` resolves into a [[nodeList]] which contains the item nodes as well as their scopes.
 * This representation form is used internally when making references between collections but is not
 * really useful for apps consuming these items.
 *
 *
 * @example **Filtering collections**
 * ```js
 * import muster, { collection, filter, gt, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: collection(
 *     [1, 2, 3, 4, 5],
 *     [
 *       // Filter items with a value greater than 3
 *       filter((item) => gt(item, 3))
 *     ],
 *   ),
 * });
 *
 * const numbers = await app.resolve(query(ref('numbers'), entries()));
 * // numbers === [4, 5]
 * ```
 * This example shows the basic use of the [[filter]] transform. Here the transform is applied
 * directly to the numbers collection, but it is also possible to apply the transform in the query.
 * See the "**Building the query with transforms**" example to learn more.
 *
 *
 * @example **Building the query with transforms**
 * ```js
 * import muster, { filter, gt, entries, query, ref, withTransforms } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const numbers = await app.resolve(query(ref('numbers'), withTransforms([
 *   filter((item) => gt(item, 3)),
 * ], entries())));
 * // numbers === [4, 5]
 * ```
 * This example shows how to include additional collection transforms within a query.
 * It gives the same output as the code from the "**Filtering collections**" example.
 *
 *
 * @example **Linking collections**
 * ```js
 * import muster, { collection, filter, gt, entries, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   originalNumbers: [1, 2, 3],
 *   filteredNumbers: collection(
 *     ref('originalNumbers'),
 *     [filter((item) => gt(item, 1))],
 *   ),
 *   allNumbers: collection(ref('originalNumbers')),
 * });
 * const filteredNumbers = await app.resolve(
 *   query(ref('filteredNumbers'), entries()),
 * );
 * // filteredNumbers === [2, 3]
 *
 * const allNumbers = await app.resolve(
 *   query(ref('allNumbers'), entries()),
 * );
 * // allNumbers === [1, 2, 3]
 * ```
 * As mentioned in the introduction above, [[collection]]s can use
 * another [[collection]] as a data source. This example shows how to use one collection
 * as the data source for two separate collections. One of them applies some transforms while
 * the other one gets the items directly.
 *
 *
 * @example **Complex items**
 * ```js
 * import muster, { entries, key, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   books: [
 *     { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
 *     { title: 'Live and Let Die', author: 'Ian Fleming', year: 1954 },
 *     { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
 *   ],
 * });
 *
 * const bookTitles = await app.resolve(
 *   query(ref('books'), entries({
 *     title: key('title'),
 *   })),
 * );
 * // bookTitles === [
 * //   { title: 'Casino Royale' },
 * //   { title: 'Live and Let Die' },
 * //   { title: 'The Big Four' },
 * // ];
 * ```
 * This example shows how to retrieve given fields from every item of the collection. Here,
 * each collection item is a [[tree]]. This means that in order to get the
 * value of an item, we have to make a query to specific fields of that branch. The query we made
 * in this example requests the `title` of each book, but ignores the `author` and `year`.
 */
export function collection(
  source: NodeDefinition | Array<NodeLike>,
  transforms?: Array<NodeDefinition | GraphNode>,
): NodeDefinition {
  showCollectionDeprecationWarning();
  return applyTransforms(source, transforms || []);
}
