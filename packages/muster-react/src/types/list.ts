import { createMatcher, getInvalidTypeError, isMatcher, Matcher, types } from '@dws/muster';
import { Props } from '../container-types';
import { isProps } from '../utils/is-props';
import { sanitizeProps } from '../utils/sanitize-props';
import { TreeMatcher } from './tree';

export interface ListOptions<N, I> {
  itemMatcher: I;
  name: N;
}

export type ListMatcher<F, N, I> = Matcher<Array<F>, ListOptions<N, I>>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]] to indicate to
 * Muster, that a given node is a collection, and that it should be loaded as an array. The [[list]] prop type can be
 * created with no arguments, which means that the collection defined in the Muster graph is expected to be a collection
 * of primitive values (value(1), value('some string'), value({ some: 'object' }), etc.).
 * The [[list]] prop type can also be created with a matcher used to validate the type of these primitive values.
 *
 * Aside from loading the collection as an array of primitives, the [[list]] prop type enables loading collections
 * containing [[tree]] nodes, by specifying which children should be loaded from them, which is similar to how [[tree]]
 * matcher is used for specifying which children should be loaded from a given branch.
 * In that case the [[list]] prop type internally creates a [[tree]] matcher to describe that behaviour.
 *
 *
 * @example **Load a list of primitives**
 * ```js
 * import { container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     names: ['Bob', 'Jane', 'Kate'],
 *   },
 *   props: {
 *     names: propTypes.list(),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ names }) => (
 *   <ul>
 *     {names.map((name) => <li>{name}</li>)}
 *   </ul>
 * ));
 *
 * // Rendered JSX:
 * // <ul>
 * //   <li>Bob</li>
 * //   <li>Jane</li>
 * //   <li>Kate</li>
 * // </ul>
 * ```
 * This example shows how to load a list of primitive values from Muster with the use of the [[list]] prop type.
 *
 *
 *  @example **Load a list of primitives of a specified type**
 * ```js
 * import { container, propTypes, types } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     names: ['Bob', 'Jane', 'Kate'],
 *   },
 *   props: {
 *     names: propTypes.list(types.string),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ names }) => (
 *   <ul>
 *     {names.map((name) => <li>{name}</li>)}
 *   </ul>
 * ));
 *
 * // Rendered JSX:
 * // <ul>
 * //   <li>Bob</li>
 * //   <li>Jane</li>
 * //   <li>Kate</li>
 * // </ul>
 * ```
 * This example shows how to load a list of primitive values from Muster with the use of the [[list]] prop type.
 * Additionally the code makes sure that the items loaded from musters are `string`s.
 *
 *
 * @example **Load a list of primitives under an alias**
 * ```js
 * import { container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     myListName: ['Bob', 'Jane', 'Kate'],
 *   },
 *   props: {
 *     names: propTypes.list('myListName'),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ names }) => (
 *   <ul>
 *     {names.map((name) => <li>{name}</li>)}
 *   </ul>
 * ));
 *
 * // Rendered JSX:
 * // <ul>
 * //   <li>Bob</li>
 * //   <li>Jane</li>
 * //   <li>Kate</li>
 * // </ul>
 * ```
 * This example shows how to instruct the [[list]] prop type to load a collection with a name different than the name
 * of the property.
 *
 *
 * @example **Load a list with trees in it**
 * ```js
 * import { container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     people: [
 *       { firstName: 'Bob', lastName: 'Smith' },
 *       { firstName: 'Jane', lastName: 'Jonson' },
 *       { firstName: 'Kate', lastName: 'Parker' },
 *     ],
 *   },
 *   props: {
 *     people: propTypes.list({
 *       firstName: true,
 *     }),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ people }) => (
 *   <ul>
 *     {people.map(({ firstName }) => <li>{firstName}</li>)}
 *   </ul>
 * ));
 *
 * // Rendered JSX:
 * // <ul>
 * //   <li>Bob</li>
 * //   <li>Jane</li>
 * //   <li>Kate</li>
 * // </ul>
 * ```
 * This example show how to load only specific branches from the `people` collection. The array loaded from Muster
 * will contain objects with `firstName`, but without the `lastName`.
 */
export function list(): ListMatcher<any, undefined, undefined>;
export function list(name: string): ListMatcher<any, string, undefined>;
export function list<TT, TP, T extends Matcher<TT, TP>>(itemType: T): ListMatcher<TT, undefined, T>;
export function list<F>(itemShape: Props<F>): ListMatcher<F, undefined, TreeMatcher<F>>;
export function list<TT, TP, T extends Matcher<TT, TP>>(
  name: string,
  itemType: T,
): ListMatcher<TT, string, T>;
export function list<F>(name: string, itemShape: Props<F>): ListMatcher<F, string, TreeMatcher<F>>;
export function list<F, TT, TP, T extends Matcher<TT, TP>>(
  ...args: Array<string | Props<F> | T>
): ListMatcher<F | TT | any, string | undefined, TreeMatcher<F> | T | undefined> {
  const options: ListOptions<string | undefined, TreeMatcher<F> | T | undefined> = {
    itemMatcher: undefined,
    name: undefined,
  };
  // function list<F>(name: string, itemShape: Props<F>): Matcher<Array<F>, ListOptions<string, TreeMatcher<F>>>
  if (args.length === 2 && isProps(args[1])) {
    const [name, itemFields] = args as [string, Props<F>];
    options.itemMatcher = sanitizeProps(itemFields);
    options.name = name;
  }
  // function list<TT, TP, T extends Matcher<TT, TP>>(name: string, itemType: T): Matcher<Array<TT>, ListOptions<string, T>>
  else if (args.length === 2 && isMatcher(args[1])) {
    const [name, itemType] = args as [string, T];
    options.itemMatcher = itemType;
    options.name = name;
  }
  // function list(name: string): Matcher<Array<any>, ListOptions<string, undefined>>
  else if (args.length === 1 && typeof args[0] === 'string') {
    const [name] = args as [string];
    options.name = name;
  }
  // function list<F>(itemShape: Props<F>): Matcher<Array<F>, ListOptions<undefined, TreeMatcher<F>>>
  else if (args.length === 1 && isProps(args[0])) {
    const [itemFields] = args as [Props<F>];
    options.itemMatcher = sanitizeProps(itemFields);
  }
  // function list<TT, TP, T extends Matcher<TT, TP>>(itemType: T): Matcher<Array<TT>, ListOptions<undefined, T>>
  else if (args.length === 1 && isMatcher(args[0])) {
    const [itemType] = args as [T];
    options.itemMatcher = itemType;
  } else if (args.length !== 0) {
    throw getInvalidTypeError('Invalid parameters supplied to the list().', {
      expected: [
        '()',
        '(string)',
        '(Matcher<any>)',
        '(Props<any>)',
        '(string, Matcher<any>)',
        '(string, Props<any>)',
      ],
      received: args,
    });
  }
  const itemsValidator = types.arrayOf(options.itemMatcher || types.any);
  const matcher = createMatcher<
    F | TT | any,
    ListOptions<string | undefined, TreeMatcher<F> | T | undefined>
  >('list', (value: any) => itemsValidator(value), options);
  matcher.metadata.type = list;
  return matcher;
}

export function isListMatcher(value: any): value is ListMatcher<any, any, any> {
  return isMatcher(value) && value.metadata.type === list;
}
