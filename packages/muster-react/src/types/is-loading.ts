import { createMatcher, isMatcher, Matcher, types } from '@dws/muster';

export type IsLoadingMatcher = Matcher<any, string>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]].
 * This matcher is used in conjunction with the [[defer]] matcher to check if a given deferred property is [[pending]].
 *
 *
 * @example **Check if a deferred property is loading**
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
 *     isLoadingFirstName: propTypes.isLoading('firstName'),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ firstName, isLoadingFirstName }) => {
 *   if (isLoadingFirstName) return <h1>Loading...</h1>;
 *   return <h1>{firstName}</h1>;
 * });
 *
 * // Rendered JSX:
 * // <h1>Loading...</h1>
 * ```
 * This example shows how to use [[isLoading]] prop type to check if a sibling prop with a specified name. In the code
 * above we're declaring a `firstName` prop as a deferred, and then declaring another property `isLoadingFirstName`, which
 * checks if a prop `firstName` is loading. This prop will be `true` when the node requested by the `firstName` prop resolves
 * to [[pending]].
 *
 * One thing to remember is that the name taken by the [[isLoading]] prop must refer to the name of the sibling prop.
 *
 *
 * @example **Another example of checking if deferred property is loading**
 * ```js
 * import { container, fromPromise, propTypes } from '@dws/muster-react';
 *
 * let resolvePromise;
 *
 * const myContainer = container({
 *   graph: {
 *     surname: fromPromise(() =>
 *       new Promise((resolve) => { resolvePromise = resolve; }),
 *     ),
 *   },
 *   props: {
 *     lastName: propTypes.defer(propTypes.getter('surname')),
 *     isLoadingLastName: propTypes.isLoading('lastName'),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ lastName, isLoadingLastName }) => {
 *   if (isLoadingLastName) return <h1>Loading...</h1>;
 *   return <h1>{lastName}</h1>;
 * });
 *
 * // Rendered JSX:
 * // <h1>Loading...</h1>
 * ```
 * This example serves as an explanation of the last sentence from the previous example. In the scenario, when the
 * branch in the graph is called `surname`, and a prop that loads it is `lastName`, the correct way of checking if
 * that prop is loading is to declare a prop `isLoadingLastName: propTypes.isLoading('lastName')`. Note that the
 * [[isLoading]] takes `lastName` as an argument, instead of the name from the graph (`surname`).
 */
export function isLoading(relativePropName: string): IsLoadingMatcher {
  const matcher = createMatcher<any, string>(
    'is-loading',
    (value: any) => types.bool(value),
    relativePropName,
  );
  matcher.metadata.type = isLoading;
  return matcher;
}

export function isIsLoadingMatcher(value: any): value is IsLoadingMatcher {
  return isMatcher(value) && value.metadata.type === isLoading;
}
