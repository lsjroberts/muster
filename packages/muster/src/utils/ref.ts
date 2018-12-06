import { get } from '../nodes/graph/get';
import { root } from '../nodes/graph/root';
import { NodeDefinition, NodeLike } from '../types/graph';
import { deprecated } from './deprecated';

const showRefArrayDeprecationWarning = deprecated({ old: 'ref([...])', new: 'ref(...)' });

export interface RootAndPath {
  root: NodeDefinition;
  path: Array<NodeDefinition>;
}

export function isRootAndPath(value: any): value is RootAndPath {
  return Boolean(value && typeof value === 'object' && value.root && 'path' in value);
}

export function ref(rootAndPath: RootAndPath): NodeDefinition;
export function ref(path: Array<NodeLike>): NodeDefinition;
export function ref(...path: Array<NodeLike>): NodeDefinition;

/**
 * A helper function used for locating nodes in the muster graph.
 *
 * After a [[value]], this is the most useful node in the whole of muster. It can be used
 * in the dependencies of a [[computed]], to link parts of the graph, as an output of a
 * [[computed]], etc.
 *
 * A path used in the ref does not have to be a string. It can be any graph node that resolves to a
 * non-dynamic node, e.g. another ref that points to a [[value]], a ref to a [[computed]]
 * that returns a [[value]], a [[value]] storing a numeric value, a [[value]] storing an object, etc.
 *
 * In most cases, a [[ref]] is defined as a path from the root of the graph. This behaviour can be
 * changed by setting the [[root]] property to a different [[NodeDefinition]]. See the "**Overriding a root
 * node**" example for more on this.
 *
 * Internally every [[ref]] is converted to a series of nested [[get]]s.
 * See the [[get]] documentation for more information.
 * @returns NodeDefinition
 *
 * @example **Basic ref nodes**
 * ```js
 * import muster, { ref } from '@dws/muster';
 *
 * const app = muster({
 *   currentUserId: 123,
 *   linkToCurrentUserId: ref('currentUserId'),
 * });
 *
 * const currentUserId = await app.resolve(ref('currentUserId'));
 * // === 123
 *
 * const linkedCurrentUserId = await app.resolve(ref('linkToCurrentUserId'));
 * // === 123
 * // currentUserId === linkedCurrentUserId
 * ```
 * In this example we have created a simple muster graph with one value node `currentUserId` and
 * another node `linkToCurrentUserId` which is a ref to a `currentUserId` node.
 *
 *
 * @example **Understanding similarities of ref and get nodes**
 * ```js
 * import muster, { get, ref, root, value } from '@dws/muster';
 *
 * const app = muster({
 *   language: 'en-GB',
 *   user: {
 *     firstName: 'Bob',
 *   },
 * });
 *
 * const languageByRef = await app.resolve(ref('language'));
 * // is equivalent to
 * const languageByGet = await app.resolve(get(root(), value('language')));
 *
 * const firstNameByRef = await app.resolve(ref('user', 'firstName'));
 * // is equivalent to
 * const firstNameByGet = await app.resolve(
 *   get(
 *     get(root(), value('user')),
 *     value('firstName'),
 *   ),
 * );
 * ```
 * As mentioned in the introduction, [[ref]] is nothing more than a wrapper for a [[get]].
 * This example demonstrates how [[ref]] translates into a series of [[get]]s.
 *
 * [[ref]] makes it easier to write longer queries without the need to write awkwardly nested
 * [[get]]s
 *
 *
 * @example **Overriding a root node**
 * ```js
 * import muster, { ref, root, tree, value } from '@dws/muster';
 *
 * const app = muster({
 *   name: 'Bob',
 * });
 *
 * const name = await app.resolve(ref('name'));
 * // name === value('Bob')
 * // or expressed as root and path:
 * const nameFromRoot = await app.resolve(ref({
 *   root: root(),
 *   path: 'name',
 * }));
 * // name === 'Bob'
 *
 * const nameFromBranch = await app.resolve(ref({
 *   root: tree({ name: value('John') }),
 *   path: 'name',
 * }));
 * // nameFromBranch === 'John'
 * ```
 * This example shows how to change a root (the starting point of the query). As you can see, the root of
 * the query can be any [[NodeDefinition]]. By default the root of the query is set to [[root]].
 * You can find out more in [[root]]'s documentation.
 *
 * The `path` property in the definition of the [[ref]] can be one of: a [[NodeLike]] object (string,
 * number, etc.), an array of [[NodeLike]] objects, or an array of [[NodeDefinition]]s
 *
 * Even though this example isn't particularly useful it can be considered a good introduction to
 * the next example: "**Relative references**".
 *
 *
 * @example **Relative references**
 * ```js
 * import muster, { computed, ref, relative } from '@dws/muster';
 *
 * const app = muster({
 *   user: {
 *     firstName: 'Bob',
 *     lastName: 'Builder',
 *     fullName: computed(
 *       [ref(relative('firstName')), ref(relative('lastName'))],
 *       (firstName, lastName) => `${firstName} ${lastName}`,
 *     ),
 *   },
 * });
 *
 * const fullName = await app.resolve(ref('user', 'fullName'));
 * // fullName === 'Bob Builder'
 * ```
 * In this example we used the [[relative]] helper function to make a reference that finds `firstName`
 * and `lastName` from the same tree as `fullName`. See the [[relative]] helper documentation for
 * more information.
 *
 *
 * @example **References to items in collections**
 * ```js
 * import muster, { first, length, last, nth, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4, 5],
 * });
 *
 * const firstNumber = await app.resolve(ref('numbers', first()));
 * // firstNumber === 1
 *
 * const lastNumber = await app.resolve(ref('numbers', last()));
 * // lastNumber === 5
 *
 * const numbersLength = await app.resolve(ref('numbers', length()));
 * // numbersLength === 5
 *
 * const nthNumber = await app.resolve(ref('numbers', nth(2)));
 * // nthNumber === 3, because nth is 0-index-based, the same as numbers[3] in JS
 * ```
 * [[get]], and by extension [[ref]], support a handful of meta-nodes which allow
 * getting certain items out of a collection. You can see their use in this example.
 * You can find out more about collections in the collection documentation.
 *
 * All of the featured meta-nodes can be used as part of the path. Where a
 * collection contains [[tree]]s instead of [[value]]s (like in this example) we could
 * define a ref to a part of the item's tree:
 * ```js
 * const app = muster({
 *   users: [
 *     { name: 'Bob' },
 *     { name: 'Veronica' },
 *   ],
 * });
 *
 * const firstUserName = await app.resolve(ref('users', first(), 'name'));
 * // firstUserName === 'Bob'
 * ```
 *
 *
 * @example **Nested references**
 * ```js
 * import muster, {
 *   computed,
 *   match,
 *   param,
 *   ref,
 *   set,
 *   tree,
 *   types,
 *   variable,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   currentUser: variable('bob'),
 *   users: {
 *     // This tree matcher allows for returning different user data based on the user name
 *     [match(types.string, 'userName')]: computed([param('userName')], (userName) =>
 *       tree({
 *         firstName: value(`${userName} first name`),
 *         lastName: value(`${userName} last name`),
 *       }),
 *     ),
 *   },
 * });
 *
 * // Get first name of user `bob`
 * const bobFirstName = await app.resolve(ref('users', ref('currentUser'), 'firstName'));
 * // bobFirstName === 'bob first name';
 *
 * let currentUserFirstName;
 * // Subscribe to the name of `currentUser`
 * app.resolve(ref('users', ref('currentUser'), 'firstName')).subscribe((firstName) => {
 *   currentUserFirstName = firstName;
 * });
 * // currentUserFirstName === 'bob first name'
 *
 * await app.resolve(set('currentUser', 'jane'))
 * // currentUserFirstName === 'jane first name'
 * // bobFirstName === 'bob first name'
 * ```
 */
export function ref(...path: Array<NodeLike | Array<NodeLike> | RootAndPath>): NodeDefinition {
  if (!path || path.length === 0) return root();
  if (path.length === 1) {
    const input = path[0];
    // hack for Edison doing some weird stuff in their tests...
    if (typeof input === 'undefined') return root();
    // function ref(rootAndPath: RootAndPath): NodeDefinition
    if (isRootAndPath(input)) {
      if (!input.path || input.path.length === 0) return input.root;
      return get(input.root, input.path);
    }
    // function ref(path: Array<NodeLike>): NodeDefinition;
    if (Array.isArray(input)) {
      showRefArrayDeprecationWarning();
      if (input.length === 0) return root();
    }
    return get(root(), input);
  }
  // function ref(...path: Array<NodeLike>): NodeDefinition;
  return get(root(), path);
}
