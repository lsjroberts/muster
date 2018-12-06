---
id: nodes
title: Nodes
---

Graph nodes (**nodes** for short) are a core concept in Muster, they allow you to define & modify data as well as implement logic and more complex data structures (such as collections). By design, the Muster graph must always store nodes, and only store nodes. Even in the previous examples nodes were used implicitly, [but they can be defined explicitly][1].

The first (and probably most useful) node is `ref()`. This node creates links within the graph and to the output; it serves as a way to locate and return a graph node based on its path in the graph. The example below adds an implementation of `ref()`:

```javascript
import muster, { ref } from '@dws/muster';

const person = muster({
  name: {
    firstName: 'Bob',
    lastName: 'Smith',
  }
  age: 35,
});

const result = await person.resolve(ref('age'));
console.log(result);

const nestedResult = await person.resolve(ref('name', 'firstName'));
console.log(nestedResult);

// Console output:
// 35
// Bob
```
As can be seen from the example, `ref()` also works for nested graph elements.

## Combining nodes
Nodes can be combined by using them as arguments within other nodes. This nesting allows a series of operations to be performed with some data.

To demonstrate how nodes can be combined, it's time to introduce a new node, `eq()`.
- `eq()` is a logical node which evaluates the equality of two values.
- `eq()` takes two arguments, both of which must be `value()` nodes or nodes which resolve to `value()`.
- `eq()` works in the same way as the `===` operation in JavaScript.
For example:
```javascript
import muster, { computed, ref } from '@dws/muster';

const person = muster({
  name: {
    firstName: 'Bob',
    lastName: 'Smith',
  },
  age: 35,
  isCalledBob: eq(ref('name','firstName'),'Bob'),
  lastNameIsFirstName: eq(ref('name','firstName'), ref('name','lastName'))
});

const isBob = await person.resolve(ref('isCalledBob'));
console.log(isBob);
// Console output:
// true

const lastIsFirst = await person.resolve(ref('lastNameIsFirstName'));
console.log(lastIsFirst);
// Console output:
// false
```
In this example, we show how nodes can be combined as their outputs are used as parameters for other nodes. Although it is a very basic example, this practice can be extended to combine multiple nodes so long as their outputs are suitable inputs for the outer node.


[1]: /muster/docs/understanding-muster/03-explicit-definition
