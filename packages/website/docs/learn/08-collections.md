---
id: collections
title: Collections
---

A big part of Muster is handling collections of items. In Muster, any node can be an item in a collection, but the most common types of node used are `value()` and `tree()`.

## Types of collection
Muster comes bundled with a two types of collections:
  - `array()` - A fixed-length collection; similar to an array in Java. Once defined, this collection can't change its size, but its items still can be set (with the use of a `variable()` and `set()` nodes)
  - `arrayList()` - A dynamic-length collection; similar to an ArrayList in Java. This collection supports a number of length-changing operations:
    * `push()` - Adds a new item to the back of the collection
    * `pop()` - Removes an item from the back of the collection
    * `unshift()` - Adds a new item at the front of the collection
    * `shift()` - Removes an item from the front of the collection
    * `addItemAt()` - Adds an item at a given index of the collection
    * `clear()` - Removes all items from the collection
    * `removeItem()` - Removes a given item from the collection
    * `removeItemAt()` - Removes an item at a given index
    * `removeItems()` - Removes item that match a given predicate

Aside from collections having different types, every collection can also be transformed using a number of transforms you might be familiar from different programming languages:
  - `map()`
  - `filter()`
  - `count()`
  - `sort()`
  - `take()`
  - `slice()`
  - `groupBy()`
  - `skip()`

and a few more

Only some of these transforms will be covered in this tutorial just to give you a feel for how to use them. For more information on different collection transforms please refer to Muster API docs.

## Arrays
Now, for the fun part; time to make a simple `array()` node:
```javascript
import muster from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3],
});
```
The code above relies on an implicit conversion from a JS array to an `array()` node. An explicitly defined array would look like this:
```javascript
import muster, { array, value } from '@dws/muster';

const app = muster({
  numbers: array([value(1), value(2), value(3)]),
});
```
The `array()` node hides one more secret when it comes to implicit conversion of objects:
```javascript
import muster from '@dws/muster';

const app = muster({
  fruits: [
    { name: 'Banana' },
    { name: 'Apple' },
    { name: 'Plum' },
  ],
});
```
Any items that are objects are converted to `tree()` nodes. This means that an explicitly declared object array would look like this:
```javascript
import muster, { array, tree, value } from '@dws/muster';

const app = muster({
  fruits: array([
    tree({ name: value('Banana') }),
    tree({ name: value('Apple') }),
    tree({ name: value('Plum') }),
  ]),
});
```
An introduction into loading collections in Muster is described below in the section containing the `query()` node.


## Querying items from a collection

To get data from a collection, a `query()` must be defined against it. This is because each item can be a `tree()` node, and in Muster "Get me the whole tree" doesn't make any sense. When getting data from a `tree()` you have to be explicit in terms of what to get from it.

Let's make a simple query to get items from a collection containing primitive items (`value()` nodes):
```javascript
import muster, { entries, query, root } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3],
});

const result = await app.resolve(query(root(), {
  numbers: entries(),
}));
console.log(result);

// Console output:
// [1, 2, 3]
```
This example introduces a new Muster node - `entries()`. The only use for this node is as part of the `query()` node definition, and it is used to indicate to the `query()` node that a given node should be loaded as a collection of items.

The `entries()` node has one optional argument that defines the shape of each item, but not specifying it tells the `query()` that it is supposed to expect these items to be primitive items (`value()`).

The following code fragment shows how to make a `query()` against a collection containing `tree()` nodes:
```javascript
import muster, { entries, query, root } from '@dws/muster';

const app = muster({
  people: [
    { firstName: 'Bob', lastName: 'Smith' },
    { firstName: 'Kate', lastName: 'Doe' },
    { firstName: 'Jane', lastName: 'Jonson' },
  ],
});

const result = await app.resolve(query(root(), {
 people: entries({
   firstName: true,
 }),
}));
console.log(result);

// Console output:
// {
//   people: [
//     { firstName: 'Bob' },
//     { firstName: 'Kate' },
//     { firstName: 'Jane' },
//   ]
// }
```
Note that the returned items contain only `firstName` property, as this is the only property that was requested from the item.
