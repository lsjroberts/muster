---
id: essential-nodes
title: Essential Nodes
---

## Core Muster nodes

### [Ref](/muster/api/modules/muster.html#ref)
A helper function used for locating nodes in the muster graph.

After a value, this is the most useful node in the whole of muster. It can be used in the dependencies of a computed, to link parts of the graph, as an output of a computed, etc.

```javascript
import muster, { ref } from '@dws/muster';

const app = muster({
  name: 'Joe',
});

console.log('Making a reference to `name`');
const result = await app.resolve(ref('name'));
console.log(result);

// console output:
// Making a reference to `name`
// Joe

```

### [Variable](/muster/api/modules/muster.html#variable)
Creates a new instance of a variable node, which is a node that can store values. Its read and write process is synchronous. Each variable node has an initial value that defines both the node's starting value and its fallback when reset. See the reset and "Resetting variables" example to learn more about resetting variables.

The example below utilises another node (set) which will be introduced below.

```javascript
import muster, { ref, set, variable } from '@dws/muster';

const app = muster({
  name: variable('Bob'),
});

console.log('Retrieving a name');
app.resolve(ref('name')).subscribe((name) => {
  console.log(`Name: ${name}`);
});

console.log('Setting a name to John');
await app.resolve(set('name', 'John'));

// Console output:
// Retrieving a name
// Name: Bob
// Setting a name to John
// Name: John
```

### [Set](/muster/api/modules/muster.html#set)
Set is a node which allows for setting values of certain nodes, e.g. variable, fromPromise and placeholder.

The output of a set is the same as a value property.

When resolving a set against an asynchronous node like fromPromise, the value from the resolver will wait for fromPromise to update to new value, then emit value from set.
#### Setting a variable
```javascript
import muster, { set, variable } from '@dws/muster';

const app = muster({
  name: variable('Bob'),
});

console.log('Setting variable');
app.resolve(set('name', 'Jane')).subscribe((result) => {
  // result === 'Jane'
  console.log('Set resolved');
});
console.log('End');

// Console output:
// Setting variable
// Set resolved
// End
```
This example demonstrates how a set can be used to update the value of a variable. The set also returns the value set to the target node.
#### Setting asynchronous nodes
```javascript
import muster, { fromPromise, set } from '@dws/muster';

let savedName = 'Bob';

const app = muster({
  name: fromPromise({
    get: () => Promise.resolve(savedName),
    set: (props, newValue) => new Promise((resolve) => {
      // newValue is a ValueNode
      savedName = newValue;
      resolve();
    }),
  }),
});

console.log('Setting variable');
app.resolve(set('name', 'Jane')).subscribe((result) => {
  // result === 'Jane'
  console.log('Set resolved');
});
console.log('End');

// Console output:
// Setting variable
// End
// Set resolved
```
This example demonstrates that a set waits for the target value to be updated before returning a result.

### [Value](/muster/api/modules/muster.html#value)
The value node is used for storing raw data and for sending data to other nodes.
```javascript
import { value } from '@dws/muster';

value('Hello world');      // Create a value node storing a string
value(123);                // Create a value node storing a number
value({ hello: 'world' }); // Create a value node storing an object
```
## Callable Functions
### [fn](/muster/api/modules/muster.html#fn)

fn is a type of a NodeDefinition used for representing executable functions implemented with muster NodeDefinitions. These functions are safely serializable and can be executed on a remote muster instances.

The fn can be executed with the help of call and apply.
Create a simple fn
```javascript
import { fn, value } from '@dws/muster';

fn(() => value(true));
```
This example shows how to create a very basic fn that simply returns a true value ever time it gets called.

Calling an fn
```javascript
import muster, { add, call, fn } from '@dws/muster';

const app = muster({
  addFive: fn((num) => add(num, 5)),
});

await app.resolve(call('addFive', [3]));
// === 8
```
This example shows how to call an fn. See the call documentation to learn more about calling callable nodes.

### [Action](/muster/api/modules/muster.html#action-2)
Action is a type of NodeDefinition that allows for defining reusable fragments of code which can interact with the graph. The action on its own is treated as a data-node - just like a value or an array but it can be used as a target for a call or apply nodes.

The action can return three types of values:

- void/undefined: for very simple actions that don't interact with the graph
- A NodeDefinition: an output of the action. This node can be resolved later.
- An iterator of GraphNodes: the most common use for the action. The action body can be defined as a generator function. This way the action can perform complex operations. See the "Using generators in an action node" example to learn more.

The below example also makes use of the call node which is described below.

```javascript
import muster, { action, call } from '@dws/muster';

const app = muster({
  logWhenCalled: action(() => {
    console.log('Action has been called');
  }),
});

console.log('Calling action');
const output = await app.resolve(call('logWhenCalled'));
// output === undefined

// Console output:
// Calling action
// Action has been called
```

#### Returning a value from an action
```javascript
import muster, { action, call } from '@dws/muster';

const app = muster({
  getFullName: action((firstName, lastName) => `${firstName} ${lastName}`),
});

console.log('Calling action');
const fullName = await app.resolve(call('getFullName', ['Rosalind', 'Franklin']));
// fullName === 'Rosalind Franklin'

console.log(fullName);

// Console output:
// Calling action
// Rosalind Franklin
```
This example shows how to return values from an action. As with the computed, the value returned from the action function is converted to a value if is not already a NodeDefinition.
### [Call](/muster/api/modules/muster.html#call)

Call is a node which is used when calling a NodeDefinition that implements a call method, e.g. action, fn or placeholder.

This example shows how to use a call node to call a fn node:

```javascript
Call an fn node

import muster, { call, fn, value } from '@dws/muster';

const app = muster({
  getGreeting: fn(() => value('Hello world')),
});

console.log('Calling the fn');
const result = await app.resolve(call('getGreeting'));
// result === 'Hello world'

console.log(result);

// Console output:
// Calling the fn
// Hello world

```

## Logic
### [AND](http://localhost:3000/muster/api/modules/muster.html#and) (&&)
`and(arg 1, ..., arg n)` is a logical node that takes one-or-more arguments and resolves to `true` if and only if all arguments are truthy, `false` otherwise.
```javascript
import muster, { computed, or } from '@dws/muster';

const app = muster({});
await app.resolve(and(true)) // === true
await app.resolve(and(false)) // === false
await app.resolve(and('hello world')) // === true
await app.resolve(and(true, false)) // === false
await app.resolve(and(true, true, false)) // === false
await app.resolve(and(false, false, 'hello world')) // === false
await app.resolve(and(computed([], () => true), false)) // === false
await app.resolve(and(computed([], () => true), true)) // === false
```
### [OR](http://localhost:3000/muster/api/modules/muster.html#or) (||)
`or(arg 1, ..., arg n)` is a logical node that takes one-or-more arguments and resolves to `true` if any of its arguments are truthy, `false` otherwise.
```javascript
import muster, { computed, or } from '@dws/muster';

const app = muster({});
await app.resolve(or(true)) // === true
await app.resolve(or(false)) // === false
await app.resolve(or('hello world')) // === true
await app.resolve(or(true, false)) // === true
await app.resolve(or(true, false, false)) // === true
await app.resolve(or(false, false, 'hello world')) // === true
await app.resolve(or(computed([], () => true), false)) // === true
await app.resolve(or(computed([], () => false), false)) // === false
```
### [NOT](http://localhost:3000/muster/api/modules/muster.html#not) (!)
`not(arg)` is a logical node that takes one argument and resolves to the inverse `boolean` value of its input. Inputs are evaluated for truthiness.
```javascript
import muster, { computed, not, value } from '@dws/muster';

const app = muster({});
await app.resolve(not(false)) // === true
await app.resolve(not(true)) // === false
await app.resolve(not('hello world')) // === false
await app.resolve(not(123)) // === false
await app.resolve(not(value({ }))) // === false
await app.resolve(not(not(true))) // === true
await app.resolve(not(computed([], () => false))) // === true
await app.resolve(not(computed([], () => true))) // === false
```
### [Eq](http://localhost:3000/muster/api/modules/muster.html#eq) (===)
`eq(arg1, arg2)` is a logical node that takes two arguments and resolves to `true` if they are equal, `false` otherwise. `eq()` is the Muster equivalent to the strict equality operator (`===`) in JavaScript.
```javascript
import muster, { computed, eq } from '@dws/muster';

const app = muster({});
await app.resolve(eq(1, 1)) // === true
await app.resolve(eq(123, 321)) // === false
await app.resolve(eq('1', 1)) // === false
await app.resolve(eq('Hello world', 'Hello world')) // === true
await app.resolve(eq(computed([], () => 123), 123)) // === true
await app.resolve(eq('test 1', 'test 2')) //=== false
```
### Inequality
Muster has many nodes for evaluating inequalities, depending on the type of comparison that needs to be compared:
- `gt(arg 1, arg 2)` - [Greater than](http://localhost:3000/muster/api/modules/muster.html#gt) - Resolves to `true` if and only if arg 1 > arg 2.
- `gte(arg 1, arg 2)` - [Greater than or equal to](http://localhost:3000/muster/api/modules/muster.html#gte) - Resolves to `true` if and only if arg 1 >= arg 2.
- `lt(arg 1, arg 2)` - [Less than](http://localhost:3000/muster/api/modules/muster.html#lt) - Resolves to `true` if and only if arg 1 < arg 2.
- `lte(arg 1, arg 2)` - [Less than or equal to](http://localhost:3000/muster/api/modules/muster.html#lte) - Resolves to `true` if and only if arg 1 <= arg 2.
```javascript
import muster, { gt, gte, lt, lte } from '@dws/muster';

const app = muster({});

await app.resolve(gt(1,2)) // === false
await app.resolve(gt(1,1)) // === false
await app.resolve(gt(2,1)) // === true

await app.resolve(gte(1,2)) // === false
await app.resolve(gte(1,1)) // === true
await app.resolve(gte(2,1)) // === true

await app.resolve(lt(1,2)) // === true
await app.resolve(lt(1,1)) // === false
await app.resolve(lt(2,1)) // === false

await app.resolve(lte(1,2)) // === true
await app.resolve(lte(1,1)) // === true
await app.resolve(lte(2,1)) // === false
```

## Arithmetic

### Add
Creates a new instance of an add which is a type of NodeDefinition used to compute the sum of multiple number-based values. The add takes any number of operands. It will throw an error if the number of operands is below 2 as it doesn't make sense to do the sum operation with a single operand.

The below example shows how to compute the sum of 5 and 3 using the add node:

```javascript
import muster, { add, ref } from '@dws/muster';

const app = muster({
  five: 5,
  three: 3,
});

const result = await app.resolve(
  add(ref('five'), ref('three')),
);
// result === 8
```

### Subtract
Creates a new instance of a subtract node, which is a type of NodeDefinition used to compute the difference between multiple number-based values. The subtract node takes any number of operands. It will throw an error if the number of operands is below 2 as it doesn't make sense to do the subtraction operation with a single operand.

Subtract works in much the same way as 'Add' as shown in the example below:

```javascript
import muster, { ref, subtract } from '@dws/muster';

const app = muster({
  five: 5,
  three: 3,
});

const result = await app.resolve(
  subtract(ref('five'), ref('three')),
);
// result === 2

```

## Collections

Currently Muster supports several collection data sources, and the two most common will be introduced below, namely array, and arrayList.

### Array
Array is a type of collection, much like an in-memory array you are no doubt familiar with. It is a fixed length data store, which can be access using the query node discussed previously.

Hopefully, the below example clears things up:
#### Basic array example
```javascript
import muster, { entries, query, ref } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3], // Implicit conversion to an array()
});

const numbers = await app.resolve(query(ref('numbers'), entries()));
// numbers === [1, 2, 3]
```
This example shows how to create a basic collection containing values, and how to access the items from it. The process of getting items out of collection requires the use of a query with an entries.

#### Complex array example

```javascript
import muster, { entries, key, query, ref } from '@dws/muster';

const app = muster({
  books: [
    { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
    { title: 'Live and Let Die', author: 'Ian Fleming', year: 1954 },
    { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
  ],
});

const bookTitles = await app.resolve(
  query(ref('books'), entries({
    title: key('title'),
  })),
);
// bookTitles === [
//   { title: 'Casino Royale' },
//   { title: 'Live and Let Die' },
//   { title: 'The Big Four' },
// ];
```
This example shows how to retrieve given fields from every item of the collection. Here, each collection item is a tree. This means that in order to get the value of an item, we have to make a query to specific fields of that branch. The query we made in this example requests the title of each book, but ignores the author and year.
### ArrayList
Creates a new instance of a arrayList node, which is a type of a NodeDefinition used when creating a mutable in-memory array. This array allows for a following operations:

- [push(item)](/muster/api/modules/muster.html#push-1)
- [pop()](/muster/api/modules/muster.html#pop)
- [shift()](/muster/api/modules/muster.html#shift)
- [unshift(item)](/muster/api/modules/muster.html#unshift-1)
- [addItemAt(item, index)](/muster/api/modules/muster.html#additemat)
- [removeItemAt(index)](/muster/api/modules/muster.html#removeitemat)
- [length()](/muster/api/modules/muster.html#length-1)
- [clear()](/muster/api/modules/muster.html#clear)

When modified in any way this array retains the state for as long as the parent scope exists, or until a reset operation is executed on the array. This behaviour resembles the behaviour of a variable node.

#### Create a simple array
```javascript
import muster, { arrayList, entries, push, pop, query, ref } from '@dws/muster';

const app = muster({
  numbers: arrayList([1, 3, 2]),
});

app.resolve(query(ref('numbers'), entries())).subscribe((numbers) => {
  console.log(numbers);
});

await app.resolve(push(ref('numbers'), 4));
await app.resolve(pop(ref('numbers'))); // === 4
await app.resolve(pop(ref('numbers'))); // === 2
await app.resolve(pop(ref('numbers'))); // === 3
await app.resolve(pop(ref('numbers'))); // === 1
await app.resolve(pop(ref('numbers'))); // === null
await app.resolve(pop(ref('numbers'))); // === null

// Console output:
// [1, 3, 2]
// [1, 3, 2, 4]
// [1, 3, 2]
// [1, 3]
// [1]
// []
```
This example shows how to create a simple mutable array and use a few operations on it.

### Collection Transforms
As well as collections being a data store, it is also possible to perform transformations on the collection. Below are some of the more common transforms.
### Filter
Creates a new instance of a filter node, which is a type of collection node transform used to filter the items returned from a collection using a given predicate. The predicates are constructed from muster logic nodes.

```javascript
import muster, { applyTransforms, filter, gt, entries, query, ref } from '@dws/muster';

const app = muster({
  numbers: applyTransforms(
    [1, 2, 3, 4, 5],
    [filter((item) => gt(item, 2))],
  ),
});

const filteredNumbers = await app.resolve(query(ref('numbers'), entries()));
// filteredNumbers === [3, 4, 5]
```
This example shows how to apply a filter to a collection. The predicate from this example uses a gt node for filtering items that are greater than 2. See the gt documentation for more information.

#### Applying filters in a query

```javascript
import muster, { filter, lt, entries, query, ref, withTransforms } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3, 4, 5],
});

const filteredNumbers = await app.resolve(query(ref('numbers'), withTransforms([
  filter((item) => lt(item, 4)),
], entries())));
// filteredNumbers === [1, 2, 3]
```

This example shows how to apply a filter to a collection from within a query node. The filter predicate uses a lt node to filter the items with a value of less than 4.

#### Complex filters
```javascript
import muster, { and, applyTransforms, entries, filter, gt, key, lt, query, ref } from '@dws/muster';

const app = muster({
  books: applyTransforms(
    [
      { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
      { title: 'Live and Let Die', author: 'Ian Fleming', year: 1954 },
      { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
      { title: 'The Martian', author: 'Andy Weir', year: 2011 },
    ],
    [
      filter((book) => and(
        gt(ref({ root: book, path: 'year' }), 1930),
        lt(ref({ root: book, path: 'year' }), 2000),
      )),
    ],
  ),
});

const booksBetween1930and2000 = await app.resolve(query(ref('books'), entries({
  title: key('title')
})));
// booksBetween1930and2000 === [
//   { title: 'Casino Royale' },
//   { title: 'Live and Let Die' },
// ]
```
This example shows how to create complex queries with an and node. These nodes can be nested indefinitely.
### Sort
Creates a new instance of a sort node, which is a type of collection transform used to sort the output of a collection. The sort order takes an array of sortOrders which define the ordering of the sort. The items of the order array are assuming a descending order of priority, with the first item having the highest priority and the last one having the lowest.

Sort order can be defined with the help of two helper functions:

- [ascending](/muster/api/modules/muster.html#ascending)
- [descending](/muster/api/modules/muster.html#descending)

#### Sorting numbers

```javascript
import muster, {
  ascending,
  descending,
  entries,
  query,
  ref,
  sort,
  withTransforms,
} from '@dws/muster';

const app = muster({
  numbers: [5, 3, 2, 4, 1],
});

const ascendingNumbers = await app.resolve(query(ref('numbers'), withTransforms([
  sort(ascending((item) => item)),
], entries())));
// ascendingNumbers === [1, 2, 3, 4, 5]

const descendingNumbers = await app.resolve(query(ref('numbers'), withTransforms([
  sort(descending((item) => item)),
], entries())));
// descendingNumbers === [5, 4, 3, 2, 1]
```
This example shows how to apply the most basic sort transform. Although the sort officially takes an array of sort orders, you can still define a sort with a single sortOrder.
#### Sorting Branches
```javascript
import muster, {
  ascending,
  descending,
  get,
  entries,
  key,
  query,
  ref,
  sort,
  withTransforms,
} from '@dws/muster';

const app = muster({
  cars: [
    { make: 'Mercedes', model: 'C 63 AMG', year: 2017 },
    { make: 'Mercedes', model: 'A', year: 2009 },
    { make: 'Audi', model: 'R8', year: 2013 },
    { make: 'Audi', model: 'A4', year: 2018 },
    { make: 'Toyota', model: 'Corolla', year: 2016 },
  ],
});

const sortedCars = await app.resolve(query(ref('cars'), withTransforms([
  sort([
    ascending((car) => get(car, 'make')),
    descending((car) => get(car, 'year')),
  ]),
], entries({
  make: key('make'),
  model: key('model'),
  year: key('year'),
}))));
// sortedCars = [
//   { make: 'Audi', model: 'A4', year: 2018 },
//   { make: 'Audi', model: 'R8', year: 2013 },
//   { make: 'Mercedes', model: 'C 63 AMG', year: 2017 },
//   { make: 'Mercedes', model: 'A', year: 2009 },
//   { make: 'Toyota', model: 'Corolla', year: 2016 },
// ]
```
This example shows how to implement a transform that sorts by the given leaves of a branch. It shows the implementation of the example that was featured in the description of the sort.
### Map
Creates a new instance of a map node, which is a type of collection transform used when mapping items from one representation from to another. This type of transform can be thought of as akin to JavaScript's Array.map function.

#### Simple mapper
```javascript
import muster, { applyTransforms, entries, map, multiply, query, ref } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3, 4],
  numbersTimes2: applyTransforms(ref('numbers'), [
    map((item) => multiply(item, 2)),
  ]),
});

const numbersTimes2 = await app.resolve(query(ref('numbersTimes2'), entries()));
// numbersTimes2 === [2, 4, 6, 8]
```
This example shows how to use a map to multiply every item of the collection by 2. The multiplication is done with help of an arithmetic graph node, multiply.

example
#### Mapping branches
```javascript
import muster, { applyTransforms, get, entries, key, map, query, ref } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3, 4],
  numbersAsBranches: applyTransforms(ref('numbers'), [
    map((item) => ({ number: item })),
  ]),
});

const numbers = await app.resolve(query(ref('numbersAsBranches'), entries({
  number: key('number'),
})));
// numbers === [
//   { number: 1 },
//   { number: 2 },
//   { number: 3 },
//   { number: 4 },
// ]
```
This example shows how to use a map transform to change the shape of items. It converts each item from a simple value to a tree with a branch named number containing the item's original value.
## Browser

### Location

Creates a new instance of a location node, which is a type of a NodeDefinition used when accessing browser location. This node allows for reading/writing to the address bar, and can be used to implement custom routing mechanism. The path can be encoded using following formats:

- slash: #/home
- noslash: #home
- hashbang: #!/home

#### Get current location
```javascript
import muster, { location, ref } from '@dws/muster';

const app = muster({
  navigation: location(),
});

// Given a URL: #/
await app.resolve(ref('navigation'));
// === { path: '/', params: {} }

// Given a URL: #/home?showWelcome=true
await app.resolve(ref('navigation'));
// === { path: '/home', params: { showWelcome: 'true' } }
```
This example shows how to get current path with parameters as a combined object.

#### Set current location
```javascript
import muster, { location, ref, set } from '@dws/muster';

const app = muster({
  navigation: location(),
});

// Given a URL: #/home
await app.resolve(set(ref('navigation'), { path: '/user', params: { id: 10 } }));
// URL after set: #/user?id=10
```
This example shows how to set the current location to a new value.

#### Get current path
```javascript
import muster, { location, ref } from '@dws/muster';

const app = muster({
  navigation: location(),
});

// Given a URL: #/home?test=value
await app.resolve(ref('navigation', 'path'));
// === '/home'
```
This example shows how to get only the path part of the URL. Internally the 'path' is handled by the locationPath node.

#### Set current path
```javascript
import muster, { location, ref, set } from '@dws/muster';

const app = muster({
  navigation: location(),
});

// Given a URL: #/home?id=12
await app.resolve(set(ref('navigation', 'path'), '/user'));
// URL after set: #/user?id=12
```
This example shows how to set only the path without overwriting path params. Internally the 'params' is handled by the locationPath node.
