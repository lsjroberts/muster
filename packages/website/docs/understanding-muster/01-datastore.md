---
id: data-store
title: How Muster Stores Data
---

Let's talk about how to store data in Muster.

As mentioned earlier, Muster is a library that stores the data and logic in a graph. When building your app the graph looks a bit like a tree with a root and a set of branches. The names of these branches are used to identify the nodes in the graph.

You might ask yourself "So why do they claim this is a graph, when in fact it is a tree?". A fair question! The Muster "graph" is declared as a "tree" to make it easier to write it in JavaScript, and to help with understanding where nodes are located in your graph, and what path they have. The "graph" part comes in when you start making connections between these nodes.

Let's start with a basic example of Muster graph:
```javascript
import muster from '@dws/muster';

const app = muster({
  greeting: 'Hello, world!',
});
```
The code above creates a muster application, `app`. The call to `muster()` takes a definition of your Muster graph, which can be defined explicitly, or implicitly through conversion from pure JS objects. In the case above we used a JS object with a `greeting` property, and a `'Hello, world!'` value.

This creates a Muster graph, which converts the object into a tree with a single branch called `greeting` and a value `'Hello, world!'`.

Right, so we have a simple application. Now let's get to the business of getting the value of that branch from Muster:
```javascript
import muster, { ref } from '@dws/muster';

const app = muster({
  greeting: 'Hello world',
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Hello world
```
This example introduces the first, and probably the most useful muster node `ref()`. Simply, the `ref()` node is used to create links in the graph, and to create links to the output.

In this example we made a link from a node available at path `'greeting'` to the output of Muster. The path in the `ref()` node usually begins from the root of the graph tree. We'll talk about some nodes that might change that in the future, but for now we can safely assume that the path in `ref()` starts from the root of the graph.

The method `.resolve()` used here returns an object that implements both an [TC39 Observable](https://tc39.github.io/proposal-observable/) and [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) API. This means that the result can be handled as a stream, or as a promise. For simplicity we used the Promise nature of that result.
