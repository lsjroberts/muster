---
id: version-6.0.0-lifecycle-of-a-node
title: Lifecycle of a Node
original_id: lifecycle-of-a-node
---

One thing we haven't touched on before is a lifecycle of a node. When you create a graph Muster doesn't resolve any node until you subscribe to them in one way or another. The subscription can be created in two ways:
  - Direct subscription, by doing `app.resolve(<<my node>>)`. This makes a subscription to a `<<my node>>` node.
  - Indirect subscription, by subscribing to a node that depends on a non-static node, or resolves to a non-static node.

 <!-- Is there a way to make this less contrived? -->

Example of indirect subscription through a dependency:
```javascript
import muster, { computed, ref } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  fullName: computed(
    [ref('firstName'), ref('lastName')]
    (firstName, lastName) => {
      console.log('Subscribed to `fullName`')
      return `${firstName} ${lastName}`;
    },
  ),
});

console.log('Subscribing to a computed that produces greeting...');
let result = await app.resolve(
  computed(
    [ref('fullName')],
    (fullName) => {
      console.log('Subscribed to `greeting`');
      return `Hello, ${fullName}!`
    },
  ),
);
console.log(result);

console.log('Subscribing to `ref("fullName")`');
result = await app.resolve(ref('fullName'));
console.log(result);

// Console output:
// Subscribing to a computed node that produces greeting...
// Subscribed to `fullName`
// Subscribed to `greeting`
// Hello, Bob Smith!
// Subscribing to `ref("fullName")`
// Subscribed to `fullName`
// Bob Smith
```
This example shows that the nodes are evaluated only when a subscription is made to them, and in which order such subscription is created. The `await` keyword next to the `app.resolve()` makes a quick subscription to the stream returned from `app.resolve()`, and unsubscribes once the first non-pending result is returned. Note that the second time we did `app.resolve(ref('fullName'))` produced a console log output `Subscribed to 'fullName'`.

Let's try changing the first use of `await` to a normal subscription, and see what happens then:
```javascript
import muster, { computed, ref } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  fullName: computed(
    [ref('firstName'), ref('lastName')]
    (firstName, lastName) => {
      console.log('Subscribed to `fullName`')
      return `${firstName} ${lastName}`;
    },
  ),
});

console.log('Subscribing to a computed node that produces greeting...');
const subscription = app.resolve(
  computed(
    [ref('fullName')],
    (fullName) => {
      console.log('Subscribed to `greeting`');
      return `Hello, ${fullName}!`
    },
  ),
).subscribe((result) => {
  console.log(result);
});

console.log('-----------');
console.log('Subscribing to `ref("fullName")`');
const result1 = await app.resolve(ref('fullName'));
console.log(result);
console.log('-----------');

console.log('Unsubscribing from `computed([ref("fullName")], ...)`')
subscription.unsubscribe();

console.log('Subscribing to `ref("fullName")` (again)');
const result1 = await app.resolve(ref('fullName'));
console.log(result);

// Console output:
// Subscribing to a computed node that produces greeting...
// Subscribed to `fullName`
// Subscribed to `greeting`
// Hello, Bob Smith!
// -----------
// Subscribing to `ref("fullName")`
// Bob Smith
// -----------
// Unsubscribing from `computed([ref("fullName")], ...)`
// Subscribing to `ref("fullName")` (again)
// Subscribed to `fullName`
// Bob Smith
```
This example is a bit longer than usual, but it's illustrating a very important point about how Muster resolves nodes, and the lifecycle of the nodes.

When the first subscription is made, Muster resolves the computed node that depends on a `fullName` computed node. This creates a subscription to that node, and also **caches the result from that node** for as long as the subscription is open. It serves as a performance improvement because Muster doesn't have to re-compute the value of that node when it's requested the second time.
The second time we subscribe to the `fullName` node we only get the result of the computation, without calling the `combine` function of the node - note that the `Subscribed to 'fullName'` is missing from the console output.
Then we close the original subscription, which frees the resources, and removes the cached value of the `fullName` node from Muster.
After that we make another subscription to the `fullName` node which results in `Subscribed to 'fullName'` being printed to the console output.

## Lifecycle of a `variable()` node, and how to reset its value

The `variable()` node has a slightly different lifecycle than any other dynamic node. Initially it behaves just like a regular dynamic node - subscribing to it causes its value to be cached by Muster, and the value is removed from the cache once the node is un-subscribed.

Things change once a `variable()` node value is set. The act of setting a `variable()` node makes it persistent, in a sense that unsubscribing from that node doesn't clear its value. You can remember that from previous examples of setting the variable, that the newly set value was available to us even though there was no active subscriptions to that variable node.
This raises one question - how to reset the variable to its original state?

Here's where the `reset()` node comes in handy. It is used to manually clear the value of a variable, and to restore it back to the original state:
```javascript
import muster, { ref, reset, set, variable } from '@dws/muster';

const app = muster({
  someVariable: variable('initial value'),
});

console.log(await app.resolve(ref('someVariable')));

console.log('Setting the value of someVariable');
await app.resolve(set('someVariable', 'updated value'));

console.log(await app.resolve(ref('someVariable')));

console.log('Resetting the someVariable');
await app.resolve(reset('someVariable'));

console.log(await app.resolve(ref('someVariable')));

// Console output:
// initial value
// Setting the value of someVariable
// updated value
// Resetting the someVariable
// initial value
```
