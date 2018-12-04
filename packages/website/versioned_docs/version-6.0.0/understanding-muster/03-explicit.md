---
id: version-6.0.0-explicit-definition
title: Explicit Definitions
original_id: explicit-definition
---
To gain a better understanding of how Muster works "under the bonnet", it's important to know the implicit conversion that is performed to graphs and their nodes, and what the explicit definition of these graphs and nodes actually looks like.

What this means is that there are shorthands for defining graphs and nodes that when written implicitly are converted to an explicit definition.

## Explicit Graph Definitions

For example, consider the following graph:
```javascript
import muster, { ref, variable } from '@dws/muster';

const app = muster({
  greeting: 'Hello, world!',
  num: variable(42),
});
```
The contents of this graph may not be what they seem. There are a couple of instances of implicit shorthand in this graph.

By design, Muster graphs must always store nodes, and a value `Hello, world!` isn't a node. When creating the `muster()` graph the `muster()` factory function performs some implicit conversion of the values passed into it. One of the implicit conversions supported by Muster is converting JavaScript `strings`, `numbers`, `boolean` values, etc. into `value()` nodes.

Note that in the example above we're defining a branch `greeting: 'Hello, world!'`. The `muster()` factory function converts that into a `greeting: value('Hello, world!')`.

So, in fact:
- `muster({...})` is actually `muster(tree({...}))`
- `'Hello world!'` is actually `value('Hello, world!')`
- `variable(42)` is actually `variable(value(42))`

The resulting explicitly defined graph would look like this:
```javascript
import muster, { ref, tree, value, variable } from '@dws/muster';

const app = muster(
  tree({
    greeting: value('Hello, world!'),
    num: variable(value(42)),
  })
);
```
## Explicit Collection Definitions

When considering collections, elements in an `array()` are also converted to nodes. Consider this graph:
```javascript
import muster from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3],
});
```
The code above relies on an implicit conversion from a JavaScript array to an `array()` node. An explicitly defined array would look like this:
```javascript
import muster, { array, value } from '@dws/muster';

const app = muster({
  numbers: array([value(1), value(2), value(3)]),
});
```
The `array()` node hides one more secret when it comes to implicit conversion:
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
Similarly to the `tree()` node definition, any items that are objects are converted to `tree()` nodes. This means that an explicitly declared array would look like this:
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

## Explicit Query Definitions
There are many times where a `ref()` node is not specific enough to return what you want from a graph, often times `query()` is necessary to selectively "cherry pick" results. The `query()` node also comes with a handful of implicit conversions.

Let's start small and consider this query:
```javascript
import muster, { query, root } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  age: 25,
});

const result = await app.resolve(query(root(), {
  firstName: true,
  lastName: true,
}));
console.log(result);

// Console output:
// { firstName: 'Bob', lastName: 'Smith' }
```
We know from the previous sections that the graph is converted into this explicit definition:
```javascript
tree({
  firstName: value('Bob'),
  lastName: value('Smith'),
  age: value(25),
})
```
However, the `query()` node needs to be able to identify `key` fields to extract, therefore the explicit definition of the query would be:
```javascript
query(root(), fields({
  firstName: key('firstName'),
  lastName: key('lastName'),
}))
```

**It's recommended to stick to the short-hand versions of nodes as they're both faster and easier to read and write.** But it is still important to understand what conversions are being performed to fully understand the world of Muster.
