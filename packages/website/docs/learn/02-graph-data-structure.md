---
id: graph-structure
title: Graph Data Structure
---

## Storing data in Muster
Muster stores the data and the logic in a graph where the names of the branches identify the path to the nodes. The graph resembles a tree with a root and a set of branches. The names of these branches are used to identify the nodes in the graph.

Let's start with a basic example of Muster graph:
```javascript
import muster from '@dws/muster';

const app = muster({
  greeting: 'Hello world',
});
```

- The code above creates a muster application `app`.
- The call to the muster() takes a definition of your Muster graph.
- In the case above we used a JavaScript object with a `greeting` property, and a `'Hello world'` value.
- This creates a Muster graph, with a single branch called `greeting` and a value `'Hello world'`

## Nested graph elements
Branches in the graph can also have children of their own:
```javascript
import muster from '@dws/muster';

const person = muster({
  name: {
    firstName: 'Bob',
    lastName: 'Smith',
  }
  age: 35,
});
```
In the case above we defined a Muster graph `person` with two branches:
- A `name` branch with two child branches
  * `firstName`
  * `lastName`
- An `age` branch

To access the values in these branches, we need to make use of **nodes**, which allow us to access, modify and perform actions on and with our data.
