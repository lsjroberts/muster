import { createMatcher, getInvalidTypeError, isMatcher, Matcher, types } from '@dws/muster';

export interface CallerOptions<N, A> {
  args: A;
  name: N;
}

export type CallerMatcher<N, A> = Matcher<Function, CallerOptions<N, A>>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]]. This matcher
 * informs muster-react that a given property should be loaded from the graph as a function. The returned function
 * is an asynchronous function that returns a promise when called. Calling it will cause a matching `callable` node in the
 * graph to be called with the help of a `call()` node.
 *
 * In order for the function returned from the graph to work correctly the node in your graph must support `call`
 * operation. Examples of nodes that support `call` operation: [[action]], [[fn]], [[placeholder]].
 * If the node targeted by the [[caller]] does not support the `call` operation then calling the returned function will
 * result in the promise being rejected with an error.
 *
 *
 * @example **Call an action from the graph**
 * ```jsx
 * import { action, container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     myAction: action(() => {
 *       console.log('myAction was called');
 *     }),
 *   },
 *   props: {
 *     myAction: propTypes.caller(),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ myAction }) => (
 *   <button onClick={myAction}>Click me</button>
 * ));
 *
 * // Console output (after clicking the button):
 * // myAction was called
 * ```
 * This example shows how to use the [[caller]] prop type to be able to call an action defined in the local container
 * graph. The code above ignores the fact that the `myAction` is an asynchronous function that returns a promise, and
 * just calls it every time the button is clicked. In most cases this is how a muster action should be called from your
 * components.
 *
 *
 * @example **Call an action from the graph, and read the return value**
 * ```js
 * import { action, container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     myAction: action(() => {
 *       console.log('myAction was called');
 *       return 'some value from myAction';
 *     }),
 *   },
 *   props: {
 *     myAction: propTypes.caller(),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ myAction }) => {
 *   async function onButtonClick() {
 *     const result = await myAction();
 *     console.log('Result: ', result);
 *   }
 *   return (
 *     <button onClick={onButtonClick}>Click me</button>
 *   );
 * });
 *
 * // Console output (after clicking the button):
 * // myAction was called
 * // Result: some value from myAction
 * ```
 * This example shows how to utilise the asynchronous nature of the functions returned from the graph.
 *
 *
 * @example **Call an action with arguments**
 * ```js
 * import { action, container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     myAction: action((name) => {
 *       console.log('myAction was called with name: ', name);
 *       return `Hello, ${name}`;
 *     }),
 *   },
 *   props: {
 *     myAction: propTypes.caller(),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ myAction }) => {
 *   async function onButtonClick() {
 *     const result = await myAction('Bob');
 *     console.log('Result: ', result);
 *   }
 *   return (
 *     <button onClick={onButtonClick}>Click me</button>
 *   );
 * });
 *
 * // Console output (after clicking the button):
 * // myAction was called with name: Bob
 * // Result: Hello, Bob
 * ```
 * This example shows how to pass an argument to an action. There is no limit to the number of arguments that can be
 * passed to the action, just like in a normal JavaScript function.
 *
 *
 * @example **Create a caller with a different name than the graph action**
 * ```js
 * import { action, container, propTypes } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     someActionNameYouDontLike: action(() => {
 *       console.log('someActionNameYouDontLike was called');
 *     }),
 *   },
 *   props: {
 *     myAction: propTypes.caller('someActionNameYouDontLike'),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ myAction }) => (
 *   <button onClick={myAction}>Click me</button>
 * ));
 *
 * // Console output (after clicking the button):
 * // someActionNameYouDontLike was called
 * ```
 * The [[caller]] prop type also enables aliasing actions. In this example the action in the graph was named
 * `someActionNameYouDontLike`, which for some reason we don't find to our taste when defining props. With the
 * help of [[caller]] you can define the name of the prop to be completely different than the name of the action
 * defined in the graph.
 *
 *
 * @example **Validate types of arguments**
 * ```js
 * import { action, container, propTypes, types } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     myAction: action((name) => {
 *       console.log('myAction was called with name: ', name);
 *       return `Hello, ${name}`;
 *     }),
 *   },
 *   props: {
 *     myAction: propTypes.caller([types.string]),
 *   },
 * });
 *
 * const MyComponent = myContainer(({ myAction }) => {
 *   async function onButtonClick() {
 *     console.log('Calling `myAction` with a string argument');
 *     try {
 *       const result = await myAction('Bob');
 *       console.log('Result: ', result);
 *     } catch (ex) {
 *       console.log('Didn\'t work');
 *     }
 *
 *     console.log('Calling `myAction` with a number argument');
 *     try {
 *       const result = await myAction(123);
 *       console.log('Result: ', result);
 *     } catch (ex) {
 *       console.log('Didn\'t work');
 *     }
 *   }
 *   return (
 *     <button onClick={onButtonClick}>Click me</button>
 *   );
 * });
 *
 * // Console output (after clicking the button):
 * // Calling `myAction` with a string argument
 * // myAction was called with name: Bob
 * // Result: Hello, Bob
 * // Calling `myAction` with a number argument
 * // Didn't work
 * ```
 * This example shows how to add validation to the type of arguments accepted by the callable function returned from the
 * graph. In the first `try` block of the `onButtonClick` we're calling the `myAction` with a string 'Bob', which returns
 * a correct value. In the next block we try our luck by passing a numeric value `123`, but muster-react catches us
 * before that argument ends up in the body of the `myAction`.
 */
export function caller(): CallerMatcher<undefined, undefined>;
export function caller(name: string): CallerMatcher<string, undefined>;
export function caller<PT, PP, P extends Matcher<PT, PP>, A extends Array<P>>(
  args: A,
): CallerMatcher<undefined, A>;
export function caller<PT, PP, P extends Matcher<PT, PP>, A extends Array<P>>(
  name: string,
  args: A,
): CallerMatcher<string, A>;
export function caller<PT, PP, P extends Matcher<PT, PP>, A extends Array<P>>(
  ...args: Array<string | A>
): CallerMatcher<string | undefined, A | undefined> {
  const options: CallerOptions<string | undefined, A | undefined> = {
    args: undefined,
    name: undefined,
  };
  // function caller<PT, PP, P extends Matcher<PT, PP>>(name: string, args: Array<P>): Matcher<never, CallerOptions<string, Array<P>>>
  if (args.length === 2 && Array.isArray(args[1]) && (args[1] as Array<any>).every(isMatcher)) {
    const [name, argTypes] = args as [string, A];
    options.name = name;
    options.args = argTypes;
  }
  // function caller(name: string): Matcher<never, CallerOptions<string, undefined>>
  else if (args.length === 1 && typeof args[0] === 'string') {
    const [name] = args as [string];
    options.name = name;
  }
  // function caller<PT, PP, P extends Matcher<PT, PP>>(args: Array<P>): Matcher<never, CallerOptions<undefined, Array<P>>>
  else if (
    args.length === 1 &&
    Array.isArray(args[0]) &&
    (args[0] as Array<any>).every(isMatcher)
  ) {
    const [argTypes] = args as [A];
    options.args = argTypes;
  } else if (args.length !== 0) {
    throw getInvalidTypeError('Invalid parameters supplied to the caller().', {
      expected: ['string', 'Array<Matcher>'],
      received: args,
    });
  }
  const matcher = createMatcher<Function, CallerOptions<string | undefined, A | undefined>>(
    'caller',
    (value: any) => types.func(value),
    options,
  );
  matcher.metadata.type = caller;
  return matcher;
}

export function isCallerMatcher(value: any): value is CallerMatcher<any, any> {
  return isMatcher(value) && value.metadata.type === caller;
}

export type CallerArgumentMatcher<N, A> = Matcher<Array<any>, CallerMatcher<N, A>>;

export function callerArguments<
  PT,
  PP,
  P extends Matcher<PT, PP>,
  A extends Array<P> | undefined,
  N
>(callerMatcher: CallerMatcher<N, A>): CallerArgumentMatcher<N, A> {
  if (!isCallerMatcher(callerMatcher)) {
    throw getInvalidTypeError('Invalid caller matcher supplied to the callerArguments().', {
      expected: ['caller()'],
      received: callerMatcher,
    });
  }
  const args = callerMatcher.metadata.options.args;
  const validateArguments = args
    ? (callArgs: Array<any>) => {
        if (!callArgs || callArgs.length !== args.length) return false;
        return args.some((argValidator, argIndex) => argValidator(callArgs[argIndex]));
      }
    : () => true;
  const matcher = createMatcher<Array<any>, CallerMatcher<N, A>>(
    'callerArguments',
    validateArguments,
    callerMatcher,
  );
  matcher.metadata.type = callerArguments;
  return matcher;
}

export function isCallerArgumentMatcher(value: any): value is CallerArgumentMatcher<any, any> {
  return isMatcher(value) && value.metadata.type === callerArguments;
}
