import { createMatcher, getInvalidTypeError, isMatcher, Matcher, types } from '@dws/muster';

export interface GetterOptions<N, T> {
  name: N;
  type: T;
}

export type GetterMatcher<N, TT, T> = Matcher<TT, GetterOptions<N, T>>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]]. This matcher
 * informs muster-react that a given property is a leaf in the graph, and that the component expects the value of that
 * leaf. Consider a following definition of a [[simpleContainer]]:
 * ```js
 * simpleComponent({
 *   firstName: true,
 * });
 * ```
 * The `firstName` is defined as `true`, which is a shorthand for `propTypes.getter(types.any)`. Muster React provides also one
 * more shorthand for [[getter]], which allows to specify the expected type of a property:
 * ```js
 * simpleComponent({
 *   firstName: types.string,
 * });
 * ```
 * In this example the `firstName` is defined as `types.string`, which is a shorthand for `propTypes.getter(types.string)`.
 * Additionally, normally Muster React component waits for all requested properties to resolve to a non-[[pending]] nodes,
 * which prevents the component from being rendered in an inconsistent state. This behaviour can be changed in two ways:
 *   - By wrapping a specific property in a [[defer]] prop type
 *   - By creating a [[container]] with a `renderLoading` property set to `true`, or to a custom `render` function
 *
 *
 * @example **Simple getter**
 * ```js
 * import { container } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: 'Bob',
 *     lastName: 'Smith',
 *   },
 *   props: {
 *     firstName: true,
 *     lastName: true,
 *   },
 * });
 *
 * const MyComponent = myContainer(({ firstName, lastName }) => (
 *   <h1>{firstName} {lastName}</h1>
 * ));
 *
 * // Rendered JSX:
 * // <h1>Bob Smith</h1>
 * ```
 * This example shows how to use the simplest way of defining a [[getter]] props. This [[getter]] shorthand doesn't
 * validate the type of the value returned from the graph. The only validation it does is that it expects the `firstName`
 * and `lastName` properties to not be [[pending]] before rendering the component.
 *
 *
 * @example **Validate the type of a prop**
 * ```js
 * import { container, types } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     fullName: 'Bob Smith',
 *     age: 25,
 *   },
 *   props: {
 *     fullName: types.string,
 *     age: types.number,
 *   },
 * });
 *
 * const MyComponent = myContainer(({ fullName, age }) => (
 *   <h1>{fullName}, {age} yo</h1>
 * ));
 *
 * // Rendered JSX:
 * // <h1>Bob Smith, 25 yo</h1>
 * ```
 * This example shows how to add type validation to the props loaded from the graph. When the loaded property loaded
 * from the graph is not of expected type, an error is raised, which prevents the component from being rendered.
 * That error can be handled in a `renderError` function of the [[container]].
 *
 *
 * @example **Aliasing getters**
 * ```js
 * import { container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: 'Bob',
 *     surname: 'Smith',
 *   },
 *   props: {
 *     firstName: true,
 *     lastName: propTypes.getter('surname'),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ firstName, lastName }) => <h1>{firstName} {lastName}</h1>);
 *
 * // Rendered JSX:
 * // <h1>Bob Smith</h1>
 * ```
 * Just like in other Muster React prop types you can define aliases for properties loaded from the graph.
 * In this example the component expects a `lastName` property, which in the graph is named `surname`. The container
 * can define the `lastName` property as a getter for a `surname` leaf.
 *
 *
 * @example **Aliasing getters with type validation**
 * ```js
 * import { container, propTypes, types } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: 'Bob',
 *     surname: 'Smith',
 *   },
 *   props: {
 *     firstName: true,
 *     lastName: propTypes.getter('surname', types.string),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ firstName, lastName }) => <h1>{firstName} {lastName}</h1>);
 *
 * // Rendered JSX:
 * // <h1>Bob Smith</h1>
 * ```
 * Building on the previous example, the [[getter]] prop type can also specify the expected type of the property
 * loaded from the graph.
 */
export function getter(): GetterMatcher<undefined, any, Matcher<any, never>>;
export function getter(name: string): GetterMatcher<string, any, Matcher<any, never>>;
export function getter<PT, PP, P extends Matcher<PT, PP>>(type: P): GetterMatcher<undefined, PT, P>;
export function getter<PT, PP, P extends Matcher<PT, PP>>(
  name: string,
  type: P,
): GetterMatcher<string, PT, P>;
export function getter<PT, PP, P extends Matcher<PT, PP>>(
  ...args: Array<string | P>
): GetterMatcher<string | undefined, PT | any, P | Matcher<any, never>> {
  const options: GetterOptions<string | undefined, P | Matcher<any, never>> = {
    name: undefined,
    type: types.any,
  };
  // function function getter<PT, PP, P extends Matcher<PT, PP>>(name: string, type: P): Matcher<PT, GetterOptions<string, P>>
  if (args.length === 2 && isMatcher(args[1])) {
    const [name, type] = args as [string, P];
    options.name = name;
    options.type = type;
  }
  // function getter(name: string): Matcher<any, GetterOptions<string, Matcher<any, never>>>
  else if (args.length === 1 && typeof args[0] === 'string') {
    const [name] = args as [string];
    options.name = name;
  }
  // function getter<PT, PP, P extends Matcher<PT, PP>>(type: P): Matcher<PT, GetterOptions<undefined, P>>
  else if (args.length === 1 && isMatcher(args[0])) {
    const [type] = args as [P];
    options.type = type;
  } else if (args.length !== 0) {
    throw getInvalidTypeError('Invalid parameters supplied to the getter().', {
      expected: ['string', 'Matcher'],
      received: args,
    });
  }
  const matcher = createMatcher<
    PT | any,
    GetterOptions<string | undefined, P | Matcher<any, never>>
  >('getter', (value: any) => options.type(value), options);
  matcher.metadata.type = getter;
  return matcher;
}

export function isGetterMatcher(value: any): value is GetterMatcher<any, any, any> {
  return isMatcher(value) && value.metadata.type === getter;
}
