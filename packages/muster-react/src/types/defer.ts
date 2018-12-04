import {
  createMatcher,
  DeferNodeFallbackGenerator,
  getInvalidTypeError,
  isMatcher,
  Matcher,
  NodeDefinition,
  NodeLike,
  types,
} from '@dws/muster';
import { Props } from '../container-types';
import { sanitizeMatcher } from '../utils/sanitize-matcher';
import { sanitizeProps } from '../utils/sanitize-props';
import { GetterMatcher } from './getter';
import { isInjectedMatcher } from './injected';
import { TreeMatcher } from './tree';

export interface DeferMatcherOptions<T, O, M extends Matcher<T, O | any>> {
  fallback: DeferNodeFallbackGenerator | undefined;
  type: M | TreeMatcher<T>;
}

export type DeferMatcher<T, O, M extends Matcher<T, O | any>> = Matcher<
  T,
  DeferMatcherOptions<T, O, M>
>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]].
 * Normally the Muster React component waits for all requested properties to resolve to a non-[[pending]] nodes.
 * This prevents component from being rendered in an inconsistent state.
 * However, this matcher informs muster-react that a given property can sometimes resolve to a [[pending]] node,
 * and when that happens Muster should replace the [[pending]] value with either a `fallback` value, or with `null` when
 * no `fallback` is given.
 * The `fallback` can be defined as an JS value, a Muster node, or a fallback generator function. The fallback generator
 * function receives a previous value of deferred node, or undefined if there was no previous value, and is expected
 * to return a Muster node.
 *
 *
 * @example **Deferring a leaf**
 * ```js
 * import { container, fromPromise, propTypes } from '@dws/muster-react';
 *
 * let resolvePromise;
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: fromPromise(() =>
 *       new Promise((resolve) => { resolvePromise = resolve; }),
 *     ),
 *   },
 *   props: {
 *     firstName: propTypes.defer(true),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ firstName }) => <h1>{firstName || 'Loading...'}</h1>);
 *
 * // Rendered JSX:
 * // <h1>Loading...</h1>
 * ```
 * This example shows how to use the [[defer]] prop type to instruct muster-react not to wait for a given property
 * to load before rendering the component. During the first render the `firstName` property is equal to `null`. Calling
 * the `resolvePromise` with a value will cause a new render of this component with a `firstName` equal to that value.
 *
 *
 * @example **Deferring a branch**
 * ```js
 * import { container, fromPromise, propTypes } from '@dws/muster-react';
 *
 * let resolvePromise;
 *
 * const myContainer = container({
 *   graph: {
 *     user: fromPromise(() =>
 *       new Promise((resolve) => { resolvePromise = resolve; }),
 *     ),
 *   },
 *   props: {
 *     user: propTypes.defer({
 *       firstName: true,
 *       lastName: true,
 *     }),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ user }) => {
 *   if (!user) return <h1>Loading...</h1>;
 *   return <h1>Hello, {user.firstName} {user.lastName}</h1>;
 * });
 *
 * // Rendered JSX:
 * // <h1>Loading...</h1>
 * ```
 * This example show that the [[defer]] can also be used to defer branches.
 *
 *
 * @example **Providing a static fallback value**
 * ```js
 * import { container, fromPromise, propTypes } from '@dws/muster-react';
 *
 * let resolvePromise;
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: fromPromise(() =>
 *       new Promise((resolve) => { resolvePromise = resolve; }),
 *     ),
 *   },
 *   props: {
 *     firstName: propTypes.defer('Loading first name', true),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ firstName }) => <h1>{firstName}</h1>);
 *
 * // Rendered JSX:
 * // <h1>Loading first name</h1>
 * ```
 * This example shows how to use the [[defer]] to provide a primitive fallback value for a deferred property.
 *
 *
 * @example **Defer a list**
 * ```js
 * import { container, fromPromise, propTypes } from '@dws/muster-react';
 *
 * let resolvePromise;
 *
 * const myContainer = container({
 *   graph: {
 *     friends: fromPromise(() =>
 *       new Promise((resolve) => { resolvePromise = resolve; }),
 *     ),
 *   },
 *   props: {
 *     friends: propTypes.defer('Loading friends...', propTypes.list({
 *       id: true,
 *       firstName: true,
 *       lastName: true,
 *     })),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ friends }) => {
 *   if (!Array.isArray(friends)) return <h1>{friends}</h1>;
 *   return (
 *     <ul>
 *       {friends.map((friend) =>
 *         <li key={friend.id}>{friend.firstName} {friend.lastName}</li>
 *       )}
 *     </ul>
 *   )
 * });
 *
 * // Rendered JSX:
 * // <h1>Loading friends...</h1>
 * ```
 * This example shows that the [[defer]] can also be used to defer lists. The fallback value is defined as string, but
 * could also be defined as an empty array, or as any object you want.
 */
export function defer<T, O, M extends Matcher<T, O>>(
  fallback: DeferNodeFallbackGenerator | NodeDefinition | NodeLike,
  type: M,
): DeferMatcher<T, O, M>;
export function defer<T, O, M extends Matcher<T, O>>(type: M): DeferMatcher<T, O, M>;
export function defer<T>(
  fallback: DeferNodeFallbackGenerator | NodeDefinition | NodeLike,
  props: Props<T>,
): DeferMatcher<T, any, TreeMatcher<T>>;
export function defer<T>(props: Props<T>): DeferMatcher<T, any, TreeMatcher<T>>;
export function defer(
  fallback: DeferNodeFallbackGenerator | NodeDefinition | NodeLike,
  prop: true,
): DeferMatcher<any, any, GetterMatcher<any, any, any>>;
export function defer(prop: true): DeferMatcher<any, any, GetterMatcher<any, any, any>>;
export function defer<T, O, M extends Matcher<T, O>>(
  ...args: Array<M | Props<T> | DeferNodeFallbackGenerator | NodeDefinition | NodeLike | true>
): DeferMatcher<T, O | any, M | TreeMatcher<T> | GetterMatcher<any, any, any>> {
  const type = args.length === 1 ? args[0] : args[1];
  const fallback = args.length === 2 ? args[0] : undefined;
  if (
    (isMatcher(type) && (isInjectedMatcher(type) || isDeferMatcher(type))) ||
    (!isMatcher(type) &&
      (typeof type !== 'object' || type === null) &&
      (typeof type !== 'boolean' || type === false))
  ) {
    throw getInvalidTypeError('Invalid parameters supplied to the defer().', {
      expected: ['Matcher<any, any>', 'getter()', 'list()', 'tree()', '{...}', 'true'],
      received: type,
    });
  }
  const sanitizedMatcher: M | TreeMatcher<T> =
    isMatcher(type) || typeof type === 'boolean'
      ? (sanitizeMatcher(typeof type === 'boolean' ? types.any : type) as M)
      : (sanitizeProps(type) as TreeMatcher<T>);
  const options: DeferMatcherOptions<T, O, M> = {
    fallback,
    type: sanitizedMatcher,
  };
  const matcher = createMatcher<T, DeferMatcherOptions<T, O, M>>(
    'defer',
    (value: any) => sanitizedMatcher(value) || value === undefined || value === null,
    options,
  );
  matcher.metadata.type = defer;
  return matcher;
}

export function isDeferMatcher(value: any): value is DeferMatcher<any, any, Matcher<any, any>> {
  return isMatcher(value) && value.metadata.type === defer;
}
