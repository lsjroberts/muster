---
id: version-6.0.0-functions
title: Functions
original_id: functions
---
When building an application it is sometimes necessary to embed fragments of code that can be called with a set of arguments. In Muster this can be done in a number of ways:
  - Through a `computed()` node embedded inside a branch matcher
  - With a `fromPromise()` node
  - With an `action()` and `fn()` nodes, which are introduced below

There are some differences between `action()` and `fn()` nodes:
  - `action()` is a node whose implementation is written in JavaScript, but which can't be serialised, and sent to a remote instance of Muster
  - `fn()` is a node whose implementation is written using only Muster nodes, and which can be serialised (if all nodes used in the body support serialising), and sent to a remote instance of Muster


In order to run a function defined by the `action()` and `fn()` nodes you must use `call()` node. Simply resolving `action()` and `fn()` nodes won't do anything, as they do not support `evaluate` operation.

The `call()` node takes an argument of the function to run, and the result of the function is returned.

```javascript
import muster, { action, call } from '@dws/muster';

const app = muster({
  getGreeting: action(() => {
    console.log('getGreeting called');
    return 'Hello, world!';
  }),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// getGreeting called
// Hello, world!
```
The code above shows how to define callable graph functions with the use of the `action()` node. Notice that the `call()` node takes a string.

Just like most of Muster nodes it comes with its own [implicit conversion](/muster/docs/understanding-muster/03-explicit-definition) - it converts the first argument to a `ref()` node. The explicitly defined `call()` would look like this: `call(ref('getGreeting'))`.

Now, let's try to do the same using `fn()` node:
```javascript
import muster, { call, fn, value } from '@dws/muster';

const app = muster({
  getGreeting: fn(() => value('Hello, world!')),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// Hello, world!
```
This example produces more or less the same output as the `action()`, with a notable lack of the `console.log()` inside of the `fn()` body. This is due to the fact, that the body of that node **must consist only of Muster nodes**.

Going back to the `action()` node, the node comes with a support for [generator functions (function*)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), which make the process of creating more complex actions much easier. Consider a following example of an `action()` without the use of **generator function**:
```javascript
import muster, { action, call, computed, ref } from '@dws/muster';

const app = muster({
  name: 'Bob',
  getGreeting: action(() =>
    computed([ref('name')], (name) => `Hello, ${name}!`),
  ),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// Hello, Bob!
```
And a similar `action()` written with **generator function**:


|Side note: yield is used to cause the expression to be returned to the Muster graph for resolving. |
| --- |


```javascript
import muster, { action, call, ref } from '@dws/muster';

const app = muster({
  name: 'Bob',
  getGreeting: action(function* () {
    const name = yield ref('name');
    return `Hello, ${name}!`;
  }),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// Hello, Bob!
```
Even though both of the actions produce the same desired result, the difference in syntax allows you more freedom in the way you define functions.

In the `action()` implemented with the generator function you can see the `yield ref('name')` expression.
- This causes the `ref('name')` node to be returned to the Muster graph for resolving.
- Once it is resolved the generator function assigns its value to the `name` variable
- You can use the `name` variable just like a normal JavasScript value.

There is no limit to how many times you `yield` a node in an `action()`.
## Yielding multiple results

Implementing `action()` as a generator function has one more benefit. You can yield multiple nodes at the same time which should help to keep your code short and understandable.

```javascript
import muster, { action, call, ref } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  getFullName: action(function* () {
    const [firstName, lastName] = yield [
      ref('firstName'),
      ref('lastName'),
    ];
    return `${firstName} ${lastName}`;
  }),
});

const result = await app.resolve(call('getFullName'));
console.log(result);

// Console output:
// Bob Smith
```
This example shows how to yield multiple nodes from an action, and how to extract the results from the response. The `yield []` resolves to an array of values, where the order of results matches the order of yielded nodes.

## Calling an action with arguments

The `action()` and the `fn()` nodes can also be called with a number of arguments:
```javascript
import muster, { action, call } from '@dws/muster';

const app = muster({
  addNumbers: action((left, right) => left + right),
});

const result = await app.resolve(call('addNumbers', [1, 2]));
console.log(result);

// Console output:
// 3
```
This example shows how to call a function with some arguments. As with most of Muster nodes, the implicit conversion will convert them to `value(1)` and `value(2)`. You can also call functions with other nodes:
```javascript
import muster, { action, call, ref } from '@dws/muster';

const app = muster({
  addNumbers: action((left, right) => left + right),
  five: 5,
  two: 2,
});

const result = await app.resolve(
  call('addNumbers', [ref('five'), ref('two')]),
);
console.log(result);

// Console output:
// 7
```

## `call()` doesn't respond to changes in the graph

Most of Muster nodes follow the mantra of reactively responding to changes in their dependencies. The `call()` node is different. It is tasked with a goal of reproducing a one-off function call, which also means that the function won't be called again when its dependencies have changed. Take a look at this example:
```javascript
import muster, { action, call, ref, set, variable } from '@dws/muster';

const app = muster({
  name: variable('Bob'),
  changeName: action(function* (newName) {
    const name = yield ref('name');
    if (newName === name) return;
    yield set('name', newName);
  }),
});

await app.resolve(call('changeName', ['Jane']));
```
This code would cause an infinite loop if `call()` node was subscribed to the changes in the nodes used by it. Thankfully the `call()` node prevents it, and you're able to run that code without worrying about your app looping until the end of times.
