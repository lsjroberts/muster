import { createMatcher, isMatcher, Matcher } from '@dws/muster';

export interface InjectedOptions {
  path: undefined | Array<string>;
}

export type InjectedMatcher = Matcher<any, InjectedOptions>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]]. This prop type
 * is used to indicate to Muster React that the property is going to be loaded by the parent container, and that it will
 * be injected to this container by its parent. This prop can't be used inside the [[simpleContainer]] as its definition
 * doesn't allow defining `required` properties, which are necessary for the [[injected]] prop to work.
 *
 *
 * @example **Inject property from the parent**
 * ```js
 * import { container, propTypes } from '@dws/muster-react';
 *
 * const childContainer = container({
 *   require: {
 *     firstName: true,
 *   },
 *   props: {
 *     firstName: propTypes.injected(),
 *   },
 * });
 *
 * const ChildComponent = childContainer(({ firstName }) => <h1>Hello, {firstName}!</h1>);
 *
 * const parentContainer = container({
 *   data: {
 *     firstName: 'Bob',
 *   },
 *   props: {
 *     ...ChildComponent.getRequirements(),
 *   },
 * });
 *
 * const ParentComponent = parentContainer((props) => (
 *   <section>
 *     <ChildComponent {...ChildComponent.inject(props)} />
 *     <p>Welcome to the App.</p>
 *   </section>
 * ));
 *
 * // Rendered JSX:
 * // <section>
 * //   <h1>Hello, Bob</h1>
 * //   <p>Welcome to the App.</p>
 * // </section>
 * ```
 * This example shows how to use the [[injected]] prop type to load a prop that was marked as required, loaded from the
 * parent component graph (by the means of `ChildComponent.getRequirements(),`), and then injected into
 * the ChildComponent by the parent (`{...ChildComponent.inject(props)}`). This might seem like a complicated flow,
 * which it is, but it has some benefits.
 * A component that has all of its props marked as injected doesn't make a query to Muster graph itself. That job
 * falls on the parent container. In this example only the ParentComponent makes a query to the muster graph to get
 * its own properties, as well as the properties required by the `ChildComponent`.
 */
export function injected(...path: Array<string>): InjectedMatcher {
  const options: InjectedOptions = {
    path: path.length > 0 ? path : undefined,
  };
  const matcher: InjectedMatcher = createMatcher<any, InjectedOptions>(
    'injected',
    () => true,
    options,
  );
  matcher.metadata.type = injected as any;
  return matcher;
}

export function isInjectedMatcher(value: any): value is InjectedMatcher {
  return isMatcher(value) && value.metadata.type === injected;
}
