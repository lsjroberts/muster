# Muster

## A universal data layer for your components and services

> Muster is a state and data management library that gives you a unified, reactive, declarative, 
performant and powerful view of as much or as little data as you need.

Muster comes bundled with a number of [[NodeDefinition]]s split into following categories:
* arithmetic - Nodes focusing on arithmetic operations, e.g. [[add]], [[subtract]], etc.
* browser - Nodes used for interacting with the browser, e.g. [[location]]
* collections - Nodes that are handling collections and all of the transformations on it, e.g.
  [[applyTransforms]], [[filter]], [[sort]], [[map]], etc.
* graph - Core Muster nodes, e.g. [[ref]], [[variable]], [[value]], [[action]], etc.
* logic - Nodes introducing logic operators, e.g. [[and]], [[eq]], [[ifElse]], etc.
* numeric - Nodes helping with handling numbers in Muster, e.g. [[parseInt]]
* remote - Nodes used for connecting Muster with remote Muster instances, e.g. [[proxy]].
* string - String manipulation nodes, e.g. [[endsWith]], [[join]], [[split]], etc.

## Installation

```bash
npm install --save @dws/muster @dws/muster-observable
```

## Usage
**Creating basic muster application**
```js
import muster from '@dws/muster';

const app = muster({
  firstName: 'John',
  lastName: 'Doe',
  age: 43,
});
```
This example creates a muster application containing three nodes:
* `firstName`: [[value]] = `'John'`
* `lastName`: [[value]] = `'Doe'`
* `age`: [[value]] = `43`
 
**Accessing data from a muster graph**
```js
const app = muster({ firstName: 'John' });
```
First let's create a simple muster instance with a graph containing a single leaf [[value]]
`firstName`. Now we have an instance of muster we can make queries against it:
```js
const firstName = await app.resolve(ref('firstName'));
```
The [[Muster]] object exposes a `resolve` method which can be used for running queries against
muster. In this example we've used a [[ref]]. This node is used to locate and return a graph
node based on its path in the graph. The path in the graph is defined by the hierarchy of branches
that exist in the muster graph. In this example we have just one branch containing a single leaf
`firstName`. You can find out more about paths and branches in the [[ref]] and [[tree]]
documentation.

`app.resolve` returns an object implementing both [[Observable]] and [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) APIs.
In this example we have retrieved the current value of the `firstName` node with the use of the [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) API.
Alternatively this can also be done with [[Observable]] by subscribing to the returned observable:
```js
const unsubscribe = app.resolve(ref('firstName')).subscribe((firstName) => {
  // Do something with the first name as it changes over time
});
```
By nature, muster tries to execute the code synchronously when it can, so the callback of the
`subscribe` will be called immediately with the latest value of `firstName`. 
In this example `firstName` resolves to `'John'` string.

**Notice:** `subscribe` has one important advantage over `await`. It responds to changes in the
subscribed query over time. Consider an example where the `firstName` is a node whose value
changes while the application is running. `Promise` will emit the value as soon as it's
available but won't cause your code to be re-run when the value of the subscribed node changes.
On the other hand, [[Observable]] will re-emit a new value causing the subscriber (the function used
to create the subscription) to be executed again with a new value.

See [[variable]], [[fromPromise]] and [[fromStream]] for more information about
settable nodes.


**Creating muster application with branches**
```js
import muster, { computed, ref } from '@dws/muster';

const app = muster({
  user: {
    firstName: 'John',
    lastName: 'Doe',
    fullName: computed([
      ref('user', 'firstName'),
      ref('user', 'lastName'),
    ], (firstName, lastName) => `${firstName} ${lastName}`),
  },
});
```
This example creates a muster application where the graph has one branch `user` ([[tree]]).
That branch has three leaves:
* `firstName`: [[value]] = `'John'`
* `lastname`: [[value]] = `'Doe'`
* `fullName`: [[computed]] = A node which computes full name of the user based on the current
  value of `firstName` and `lastName`.

Note the `fullName` [[computed]] dependencies are defined using fully qualified path of the
nodes in the graph. This could have been simplified with the use of a [[relative]] helper
function:
```js
import muster, { computed, ref, relative } from '@dws/muster';

const app = muster({
  user: {
    firstName: 'John',
    lastName: 'Doe',
    fullName: computed([
      ref(relative('firstName')),
      ref(relative('lastName')),
    ], (firstName, lastName) => `${firstName} ${lastName}`),
  },
});
```
The benefit of using [[relative]] instead of defining the full path is apparent when refactoring the
application graph. Imagine a scenario when the `user` branch is to be renamed to `currentUser`.
In this scenario, when the full path is used we'd have to change the name in three places: branch
definitions and both references.
It would be much simpler with the use of [[relative]] helper: we'd have to only rename the
branch.

You can find out more about [[relative]] helper on its documentation.


**Lazy-evaluating values**
```js
import muster, { computed, ref } from '@dws/muster';

let externalValue = 'initial';

const app = muster({
  testComputed: computed([], () => {
    externalValue = 'updated';
    return true;
  }),
});

// externalValue === 'initial'
const subscription = app.resolve(ref('testComputed'));

// externalValue === 'initial'

const unsubscribe = subscription.subscribe((testComputedValue) => {
  // externalValue === 'updated'
  // testComputedValue === true
});
// externalValue === 'updated'
```
This example demonstrates the principle of lazy evaluation in muster. In muster the value of
every node is evaluated only when a subscription is created to that node. Note how the value of
`externalValue` changes in this example. Thanks to the synchronous code execution in muster the
`externalValue` is set to the new value before the first line of the subscriber callback as well
as after the call to the `subscribe` method.

Most of the Muster [[NodeDefinition]]s are synchronous, with exception of [[fromPromise]],
[[fromStream]] (depending on the type of stream used), [[action]], [[proxy]] and
[[remote]].


**Complex queries**
```js
import muster, { key, query, root } from '@dws/muster';

const app = muster({
  user: {
    firstName: 'Bob',
    lastName: 'Johnson',
  },
});
 
const userTree = await app.resolve(query(root(), {
  user: key('user', {
    firstName: key('firstName'),
    lastName: key('lastName'),
  }),
}));
// userTree is a JS object with all of the requested branches encoded in it:
// {
//   user: {
//     firstName: 'Bob',
//     lastName: 'Johnson',
//   },
// }
```
In previous examples we've been requesting a single [[NodeDefinition]] at a time. In real world apps
this would not be the most efficient or fastest way of writing code. For this reason Muster
comes with a [[query]] which allows for building complex queries. These queries define the
shape of their output data as well as the place from the graph this data is to be retrieved from. See
the [[query]] documentation to learn more about queries.
