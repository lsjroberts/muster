import { createMatcher, getInvalidTypeError, isMatcher, Matcher, types } from '@dws/muster';

export interface SetterOptions<N, T> {
  name: N;
  type: T;
}

export type SetterMatcher<N, T> = Matcher<Function, SetterOptions<N, T>>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]]. This matcher
 * informs muster-react that a given property should be loaded from the graph as a setter function. The returned function
 * is an asynchronous function that returns a promise when called. Calling it will cause a matching `settable` node in the
 * graph to be set with the help of a `set()` node.
 *
 * In order for the function returned from the graph to work correctly the node in your graph must support `set` operation.
 * Examples of nodes that support the `set` operation: [[variable]], [[fromPromise]], [[placeholder]].
 * If the node targeted by the [[setter]] does not support the `set` operation then calling the returned function
 * will result in the promise being rejected with an error.
 *
 *
 * @example **Set the variable**
 * ```js
 * import { container, propTypes, variable } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: variable('Bob'),
 *   },
 *   props: {
 *     firstName: propTypes.setter(),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ firstName }) => (
 *   <button onClick={() => firstName('Jane')}>Set firstName = 'Jane'</button>
 * ));
 * ```
 * This example shows how to use the [[setter]] prop type to be able to set a value of a [[variable]] defined in the local
 * container graph. The code above ignores the fact that the `firstName` is an asynchronous function that returns a promise,
 * and just calls it every time the button is clicked. Also, the code above named the setter as `firstName`, but ideally
 * the property should be called `setFirstName` to avoid clashing with an actual `firstName` property, which would could
 * be loaded by the component. See the next example to find out how to alias [[setter]] props.
 *
 *
 * @example **Alias the [[setter]] prop**
 * ```js
 * import { container, propTypes, variable } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: variable('Bob'),
 *   },
 *   props: {
 *     setFirstName: propTypes.setter('firstName'),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ setFirstName }) => (
 *   <button onClick={() => setFirstName('Jane')}>Set firstName = 'Jane'</button>
 * ));
 * ```
 * This example shows how to specify the alias for the [[setter]] prop. Using such alias frees the `firstName` name for
 * a normal [[getter]].
 *
 *
 * @example **Validate the type of value**
 * ```js
 * import { container, propTypes, types, variable } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     firstName: variable('Bob'),
 *   },
 *   props: {
 *     setFirstName: propTypes.setter('firstName', types.string),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ setFirstName }) => {
 *   async function onButtonClick() {
 *     console.log('Calling `setFirstName` with a string argument');
 *     try {
 *       await setFirstName('Jane');
 *       console.log('Success');
 *     } catch (ex) {
 *       console.log('Didn\'t work');
 *     }
 *
 *     console.log('Calling `setFirstName` with a number argument');
 *     try {
 *       await setFirstName(123);
 *       console.log('Success');
 *     } catch (ex) {
 *       console.log('Didn\'t work');
 *     }
 *   }
 *   return <button onClick={onButtonClick}>Click me</button>;
 * });
 *
 * // Console output after clicking the button:
 * // Calling `setFirstName` with a string argument
 * // Success
 * // Calling `setFirstName` with a number argument
 * // Didn't work
 * ```
 * This example shows how to specify the expected type of a value that can be passed to the setter. Calling the setter
 * with a value of a correct type resolves with a value set to it, and calling the setter with a value of an incorrect
 * type results in a promise being rejected with an error.
 */
export function setter(): SetterMatcher<undefined, undefined>;
export function setter(name: string): SetterMatcher<string, undefined>;
export function setter<PT, PP, P extends Matcher<PT, PP>>(type: P): SetterMatcher<undefined, P>;
export function setter<PT, PP, P extends Matcher<PT, PP>>(
  name: string,
  type: P,
): SetterMatcher<string, P>;
export function setter<PT, PP, P extends Matcher<PT, PP>>(
  ...args: Array<string | P>
): SetterMatcher<string | undefined, P | undefined> {
  const options: SetterOptions<string | undefined, P | undefined> = {
    name: undefined,
    type: undefined,
  };
  // function function setter<PT, PP, P extends Matcher<PT, PP>>(name: string, type: P): Matcher<Function, SetterOptions<string, P>>
  if (args.length === 2 && isMatcher(args[1])) {
    const [name, type] = args as [string, P];
    options.name = name;
    options.type = type;
  }
  // function setter(name: string): Matcher<Function, SetterOptions<string, undefined>>
  else if (args.length === 1 && typeof args[0] === 'string') {
    const [name] = args as [string];
    options.name = name;
  }
  // function setter<PT, PP, P extends Matcher<PT, PP>>(type: P): Matcher<Function, SetterOptions<undefined, P>>
  else if (args.length === 1 && isMatcher(args[0])) {
    const [type] = args as [P];
    options.type = type;
  } else if (args.length !== 0) {
    throw getInvalidTypeError('Invalid parameters supplied to the setter().', {
      expected: ['string', 'Matcher'],
      received: args,
    });
  }
  const matcher = createMatcher<Function, SetterOptions<string | undefined, P | undefined>>(
    'setter',
    (value: any) => types.func(value),
    options,
  );
  matcher.metadata.type = setter;
  return matcher;
}

export function isSetterMatcher(value: any): value is SetterMatcher<any, any> {
  return isMatcher(value) && value.metadata.type === setter;
}

export type SetterValueMatcher<N, T> = Matcher<any, SetterMatcher<N, T>>;

export function setterValue<TT, TP, T extends Matcher<TT, TP> | undefined, N>(
  setterMatcher: SetterMatcher<N, T>,
): SetterValueMatcher<N, T> {
  const valueValidator = setterMatcher.metadata.options.type;
  // TODO: No idea why TypeScript is not able to deduce the type of the `validateArguments`.
  // TODO: Check this in a future version of TypeScript (later than 3.1.1)
  const validateArguments = valueValidator ? valueValidator! : (value: any) => true;
  const matcher = createMatcher<any, SetterMatcher<N, T>>(
    'setterValue',
    (value: any) => validateArguments(value),
    setterMatcher,
  );
  matcher.metadata.type = setterValue;
  return matcher;
}

export function isSetterValueMatcher(value: any): value is SetterValueMatcher<any, any> {
  return isMatcher(value) && value.metadata.type === setterValue;
}
