---
id: version-6.0.0-async-data
title: Asynchronous Data
original_id: async-data
---
Muster comes with a great ability to seamlessly handle synchronous and asynchronous data. Now, it's time to introduce you to some core Muster nodes that should help you with this.

## Promises
The first node is `fromPromise()`, as it's name suggests, it helps with [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

This node can be used to integrate libraries, whose API returns `Promises`, and to handle custom Web API requests (e.g. [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)).

Let's start with a very simple, contrived example:
```javascript
import muster, { fromPromise, ref } from '@dws/muster';

const app = muster({
  greeting: fromPromise(() => Promise.resolve('Hello, world!')),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Hello, world!
```

As you see, the syntax of accessing the value of an async node is no different from a sync node. One thing to note here is that the `fromPromise()` node takes an argument, which is a Promise factory. There are two main reasons for this:
  - Creating a promise also begins the work that the promise is supposed to do, and we only want to do it when a node is resolved by Muster (e.g. as a dependency of another node)
  - A Promise, once consumed can't be re-created.

You could return `new Promise((resolve) => resolve('Hello, world!'))`, but that would make the example code unnecessarily long.

Now, that covers the successful promises, but sometimes things go wrong (slow network causes a timeout, no connection, server is down, etc.), and our code must be able to handle these scenarios as well. Thankfully Muster comes with a solution for that. Take a look at this example:
```javascript
import muster, { fromPromise, ref } from '@dws/muster';

const app = muster({
  greeting: fromPromise(() => Promise.reject('Could not load greeting')),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Error: Could not load greeting
```
The code above tries to get a `'greeting'`, which results in a rejected promise. Muster picks up the reason for the promise rejection, and creates an error node with that. This error then bubbles up to the output of your request.

In most cases Errors in Muster are being short-circuited, and returned to the user. To illustrate this let's take a look at another example:

```javascript
import muster, { computed, fromPromise, ref } from '@dws/muster';

const app = muster({
  name: fromPromise(() => Promise.reject('Could not load name')),
  greeting: computed([ref('name')], (name) => {
  console.log('Computing greeting for name:', name);
  return `Hello, ${name}`;
  }),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Error: Could not load name
```
Note that the only console output entry we get is the error with its message, and not `"Computing greeting for name:"`.
- The `computed()` node requested its dependency (`ref('name')`) to be resolved to a static node.
- The `error()` node is a static node, but it's a special kind of a static node, that must be explicitly allowed by a node that depends on it.
- The `computed()` node does not allow `error()`, and so they get short-circuited and returned as a result of the `computed()` node.

In some cases you might want to catch these errors in your code, and return some fallback value instead. This is where the `ifError()` node comes in handy:
```javascript
import muster, { computed, fromPromise, getType, ifError, ref } from '@dws/muster';

const app = muster({
  name: fromPromise(() => Promise.reject('Could not load name')),
  safeName: ifError((err) => {
    console.log('Caught error:', getType(err));
    return 'world';
  }, ref('name')),
  greeting: computed([ref('safeName')], (name) => {
    console.log('Computing greeting for name:', name);
    return `Hello, ${name}!`;
  }),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Caught error: error('Could not load name')
// Computing greeting for name: world
// Hello, world!
```


This example shows how to use the `ifError()` node to handle Muster errors, and how to return a fallback value. The first argument of this node can be either a fallback node, or like in the example above a fallback generator function. The fallback generator function can decide what to do based on the received error. It might even return received error, if it can't be handled by it.

In the example above you might have noticed a use of a mystery `getType()` function. This is due to the fact that `err` is an instance of muster `error()` node, and logging it directly will not be very useful, as its structure has way more information than needed (e.g. internal type information, and a less beginner-friendly data layout). That's why Muster comes with a utility function that can convert these nodes to a human-readable format.

The `fromPromise()` node has one more trick up its sleeve. The promise factory function is actually called with a single argument: an object with all path `param()` nodes available in the current execution context:
```javascript
import muster, { fromPromise, match, ref, types } from '@dws/muster';

const app = muster({
  [match(types.string, 'firstName')]: fromPromise((params) =>
    Promise.resolve(`Hello, ${params.firstName}!`),
  ),
});

const result = await app.resolve(ref('Bob'));
console.log(result);

// Console output:
// Hello, Bob!
```

### Settable `fromPromise()`

The `fromPromise()` node can also be used to handle asynchronous `set` operations. This is handled by the second argument of the `fromPromise()` node. This can be useful when implementing a node which integrates with an API that supports getting, and setting a value.

```javascript
import muster, { computed, fromPromise, ok, ref, set } from '@dws/muster';

let userName = 'world';

const app = muster({
  name: fromPromise(
    () => Promise.resolve(userName),
    (params, value) => {
      userName = value;
      return Promise.resolve(ok());
    },
  ),
  greeting: computed([ref('name')], (name) => `Hello, ${name}!`),
});

app.resolve(ref('greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Setting name...');
await app.resolve(set('name', 'Bob'));

// Console output:
// Hello, world!
// Setting name...
// Hello, Bob!
```
This simple example shows how to use a settable `fromPromise()` node. This example of course doesn't take the full advantage of it, as it doesn't do anything asynchronous, but you could easily replace both uses of `Promise.resolve()` with `fetch()`, or a call to a library of your choice.

## Streams

The second node used when handling async data is `fromStream()`. Again, as the name suggests it is used when integrating streams with Muster apps. The `fromStream()` node supports streams that conform to the [TC39 Observable](https://tc39.github.io/proposal-observable/) API.
```javascript
import { BehaviorSubject } from '@dws/muster-observable';
// or
// import { BehaviorSubject } from 'rxjs';
import muster, { fromStream, ref } from '@dws/muster';

// This can be imported either from '@dws/muster-observable' or from 'rxjs',
// as both are API-compatible.
const nameSubject = new BehaviorSubject('world');

const app = muster({
  name: fromStream(nameSubject),
});

app.resolve(ref('name')).subscribe((result) => {
  console.log('Name:', name);
});

console.log('Pushing new name to the `nameSubject` stream.');
nameSubject.next('Bob');

// Console output:
// Name: world
// Pushing new name to the `nameSubject` stream.
// Name: Bob
```
This example shows how to integrate streams with Muster, and that Muster reacts to the changes of that stream. The code uses our own implementation of `BehaviorSubject`, but you could also use streams from `rxjs`.
