import {
  createMatcher,
  ErrorFallbackGenerator,
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
import { isInjectedMatcher } from './injected';
import { TreeMatcher } from './tree';

export interface CatchErrorMatcherOptions<T, O, M extends Matcher<T, O | any>> {
  fallback: ErrorFallbackGenerator;
  type: M | TreeMatcher<T>;
}

export type CatchErrorMatcher<T, O, M extends Matcher<T, O | any>> = Matcher<
  T,
  CatchErrorMatcherOptions<T, O, M>
>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]]. This matcher
 * informs muster-react that a given property can sometimes resolve to an [[error]] node, and that Muster should
 * replace that error with a `fallback` specified by the [[catchError]] prop type. The `fallback` can be defined as a
 * pure value, Muster [[NodeDefinition]] or a fallback generator function. The fallback generator function is a function
 * that gets called when an error is encountered, and is expected to return a [[NodeDefinition]] that can be used
 * as a fallback.
 *
 *
 * @example **Replacing an error with a string**
 * ```js
 * import { container, error, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     name: error('Some error'),
 *   },
 *   props: {
 *     name: propTypes.catchError('Something went wrong', true),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ name }) => <h1>{name}</h1>);
 * // Rendered JSX:
 * // <h1>Something went wrong</h1>
 * ```
 * This example shows how to handle graph errors by replacing the error with a fallback value (in this case a string).
 * If the `name` prop was changed to `name: true` the component wouldn't render at all.
 *
 *
 * @example **Replacing a branch error with a string**
 * ```js
 * import { container, error, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     user: {
 *       firstName: 'Bob',
 *       lastName: error('Some error'),
 *     },
 *   },
 *   props: {
 *     user: propTypes.catchError('Something went wrong', {
 *       firstName: true,
 *       lastName: true,
 *     }),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ user }) => {
 *   if (typeof user === 'string') return <h1>Error: {user}</h1>;
 *   return <p>{user.firstName} {user.lastName}</p>;
 * });
 * // Rendered JSX:
 * // <h1>Error: Something went wrong</h1>
 * ```
 * This example shows how to handle branch-level graph errors by replacing the branch that returned an error with a string.
 * In both examples the replacement value was a string, but it doesn't have to be.
 *
 *
 * @example **Replacing a branch error with an object**
 * ```js
 * import { container, error, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     user: {
 *       firstName: 'Bob',
 *       lastName: error('Some error'),
 *     },
 *   },
 *   props: {
 *     user: propTypes.catchError({ error: 'Custom error' }, {
 *       firstName: true,
 *       lastName: true,
 *     }),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ user }) => {
 *   if (user.error) return <h1>Error: {user.error}</h1>;
 *   return <p>{user.firstName} {user.lastName}</p>;
 * });
 * // Rendered JSX:
 * // <h1>Error: Custom error</h1>
 * ```
 * This example shows how to handle branch-level graph errors by replacing the branch with an object. The fallback object
 * doesn't have to be of the same shape as the expected branch.
 */
export function catchError<T, O, M extends Matcher<T, O>>(
  fallback: ErrorFallbackGenerator | NodeDefinition | NodeLike,
  type: true | M | Props<T>,
): CatchErrorMatcher<T, O | any, M | TreeMatcher<T>> {
  if (
    (isMatcher(type) && (isInjectedMatcher(type) || isCatchErrorMatcher(type))) ||
    (!isMatcher(type) &&
      ((typeof type === 'boolean' && !type) ||
        ((typeof type !== 'object' || type === null) && typeof type !== 'boolean')))
  ) {
    throw getInvalidTypeError('Invalid parameters supplied to the catchError().', {
      expected: ['Matcher<any, any>', 'getter()', 'list()', 'tree()', '{...}', 'true'],
      received: type,
    });
  }
  const sanitizedMatcher: M | TreeMatcher<T> =
    isMatcher(type) || typeof type === 'boolean'
      ? (sanitizeMatcher(typeof type === 'boolean' ? types.any : type) as M)
      : (sanitizeProps(type) as TreeMatcher<T>);
  const options: CatchErrorMatcherOptions<T, O, M> = {
    fallback,
    type: sanitizedMatcher,
  };
  const matcher = createMatcher<T, CatchErrorMatcherOptions<T, O | any, M | TreeMatcher<T>>>(
    'catchError',
    (value: any) => sanitizedMatcher(value) || value === undefined || value === null,
    options,
  );
  matcher.metadata.type = catchError as any;
  return matcher;
}

export function isCatchErrorMatcher(
  value: any,
): value is CatchErrorMatcher<any, any, Matcher<any, any>> {
  return isMatcher(value) && value.metadata.type === (catchError as any);
}
