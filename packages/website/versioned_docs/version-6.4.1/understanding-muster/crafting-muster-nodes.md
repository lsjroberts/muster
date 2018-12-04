---
id: version-6.4.1-crafting-muster-nodes
title: Crafting Muster Nodes
original_id: crafting-muster-nodes
---

Muster comes bundled with a set of basic nodes designed to help you with most common programming tasks. However, there might come a time when the standard nodes are not enough, and you might want to create new nodes. This document serves as an introduction to the process of creating custom Muster nodes, and how to use them. The process of creating new Muster nodes might not be as easy as using them, but you can look for inspiration by browsing the source code of existing Muster nodes.

## Node Type API

In order to create the first node you will need to import a couple functions from `'@dws/muster'`:
  - `createNodeType()` - A function that creates a **Node Type**. The node type serves as the implementation of your node. It contains the definition of all operations supported by this node. It also defines the shape of the node definition, as well as the state of the node (in case the node you make is a stateful node).
  - `createNodeDefinition()` - A function that creates a new definition of a node based on a set of properties, and the **Node Type** (created using `createNodeType()`). The properties passed into this function are validated against the `shape` defined on your **Node Type**. 
 
The **Node Type** implementation is split into following sections:
  - `shape` [**required**] An object defining shape of the **node definition**.
  - `state` [optional] An object defining shape of the node state. Defining this property makes the `getInitialState()` property required.
  - `getInitialState()` [optional] A function that is used to create the initial state of the node. Defining this function makes the `state` property required.
  - `onSubscribe()` [optional] A function that is called the first time given instance of a node gets subscribed to (on any operation, and only on the first one).
  - `onUnsubscribe()` [optional] A function that is called when the last node subscription is unsubscribed  
  - `operations` [optional] An object defining a map of supported graph **operations**
  
Each graph operation consists of following properties:
  - `run()` [**required**] A function that is called when an operation is resolved by Muster for a given node instance. This function is supposed to return a result of the operation, which should be either a **node definition**, **graph node** (a node instance) or a **graph action** (a node instance with an operation to traverse).
    Arguments received by the function (in order):
    - `node` - Instance of the current **graph node**
    - `operation` - Current operation definition
    - `dependencies` - An array of resolved dependencies that were returned from the `getDependencies()` - empty if no dependencies
    - `contextDependencies` - An array of resolved context dependencies that were returned from the `getContextDependencies()` - empty if no dependencies
    - `state` - Currently set state of the node.
  - `getDependencies()` [optional] A function that returns an array of dependencies required by the `run()` function in order to perform the operation.
    Arguments received by the function (in order):
    - `definition` - Current **node definition**
    - `operation` - Current operation definition
  - `getContextDependencies()` [optional] A function that returns an array of context dependencies required by the `run()` function in order to perform the operation.
    Arguments received by the function (in order):
    - `definition` - Current **node definition**
    - `operation` - Current operation definition
  - `onSubscribe()` [optional] A function called when a given operation is subscribed for the first time. This function can manipulate the state, and data of the node instance
    Arguments received by the function (in order):
    - `node` - Instance of the current **graph node**
    - `operation` - Current operation definition
  - `onUnsubscribe()` [optional] A function called when the last operation subscription is unsubscribed.
    Arguments received by the function (in order):
    - `node` - Instance of the current **graph node**
    - `operation` - Current operation definition
  - `onInvalidate()` [optional] A function called when a given operation gets invalidated by Muster, and a node is requested to update its value.
    Arguments received by the function (in order):
    - `node` - Instance of the current **graph node**
    - `operation` - Current operation definition
  
By default Muster comes bundled with a number of standard graph operations, which you can implement in your nodes:
  - `evaluate` - A default operation used by Muster to resolve a node. An example node implementing the `evaluate` operation is the `computed()` node to compute the value based on value of its dependencies. The `computed()` node implements the `evaluate` operation by defining both `getDependencies()` and `run()` functions.
  - `getChild` - An operation used when traversing the graph with the use of a `ref()` or a `get()` nodes. An example node implementing the `getChild` operation is the `tree()` node.
  - `call` - An operation used when calling a given node by means of the `call()` or `apply()` nodes. An example node implementing the `call` operation is the `action()` and `fn()` node.
  - `set` - An operation used when setting a value of a given node by means of `set()` node. An example node implementing the `set` operation is the `variable()` node.
    **This operation requires your node type to be a stateful node.** We're going to cover stateful nodes in later stages of this tutorial.
  - and many more

We're going to cover the process of creating custom operations in the later stages of this tutorial. For now, all you have to know that each of the operations listed above come with a corresponding operation factory function. This function can be used to create an operation definition, and then passed into the `traverse()` node.


## How operation traversal works

In Muster the `evaluate` operation is considered to be a **default operation**. For example, when resolving the `ref('name')` node, Muster uses the `evaluate` operation to get the value of the `name` branch. In fact, internally the `get()` node (produced by the `ref()` node) resolves a `getChild`  operation, but that happens from inside of **get's** `evaluate` operation. The `evaluate` operation means to Muster that a given node isn't considered a value-like node, and must be **evaluated** before returning it to the user. However, this behaviour can also be changed, but we're going to cover in the later stages of this tutorial.

The following example shows how to instruct Muster to traverse a node using a particular operation:
```js
import muster, { setOperation, traverse, variable } from '@dws/muster';

// Create a definition of the variable node
const myVariable = variable('initial value');

// Create an empty instance of Muster graph
const app = muster({});

// Get the current value of the variable
// This implicitly traverses the `variable()` node using an `evaluate` operation
console.log(await app.resolve(myVariable));

// Traverse the set operation
console.log('Traversing the `set(updated value)` operation');
await app.resolve(traverse(myVariable, setOperation(value('updated value'))));

// Get the current value of the variable
// Again, this implicitly traverses the `variable()` node using an `evaluate` operation
console.log(await app.resolve(myVariable));

// Console output:
// initial value
// Traversing the `set(updated value)` operation
// updated value
``` 

The code above first declares the `myVariable` node, which then gets resolved (traversed using `evaluate` operation until reaching a static node). Next, we traverse the `set` operation, which works just like a `set` node. Finally, we resolve the variable again to see if the value had indeed been saved.


## First node

In this section we're going to create the most basic Muster node. The process of creating a node consists of two things:
- Declaring a **node type**, which serves as an implementation of the node
- Creating a node factory function, which can be used by the consumers of the node.

```js
import { createNodeDefinition, createNodeType } from '@dws/muster';

const SimpleNodeType = createNodeType('simple-node', {});

function simpleNode() {
  return createNodeDefinition(SimpleNodeType, {});
}
```
The node we've just created is the simplest node you can make in Muster - it has no operations and no data. On its own, such node can't be used to do anything useful. You could use this node as part of implementation of a different node. In Muster there's one such node `emptyItem()`. On its own it doesn't do anything, and is not even returned back to the user of the library, but it's used for flagging that a given remote collection has no items.

This is an example use of that node:
```js
import muster from '@dws/muster';
import simple from './simple';

const app = muster({
  myNode: simple(),
});
```


## Store data inside of the node

In order to be able to store the data in the node you must declare a shape of the properties stored in the node, as well as the type of each property. This shape is used by the hashing mechanism when computing an ID of the given node. These IDs are used for checking if two nodes are equal as we can't rely on strict equality, and deep comparison of each property is a very time consuming process. The IDs are computed inside of the `createNodeDefinition()` function based on the NodeType and the properties passed in. The node type we created in the previous example will always create a node with the same ID, as it doesn't have any properties.

```js
import { createNodeDefinition, createNodeType, types } from '@dws/muster';

const UserNodeType = createNodeType('user', {
  shape: {
    firstName: types.string,
    lastName: types.string,
  },
});

function user(firstName, lastName) {
  return createNodeDefinition(UserNodeType, {
    firstName,
    lastName,
  });
}
```
Similarly to the **First node** example, this node doesn't do much on its own. Resolving this node would just return the node unchanged. The node we've just created stores two pieces of data: `firstName` and `lastName`. Both of these are marked as a required string by the shape of the node type. This means that calling `user()` would return an error, as both arguments are missing. 


## Implement *evaluate* operation

As mentioned before, the `evaluate` operation is considered to be a default operation in Muster when resolving a node. In this example we're going to extend the *user* node from the previous example by implementing the evaluate operation. This operation will produce a fullName from the first and last names stored in the node.
```js
import { createNodeDefinition, createNodeType, types, value } from '@dws/muster';

const UserNodeType = createNodeType('user', {
  shape: {
    firstName: types.string,
    lastName: types.string,
  },
  operations: {
    evaluate: {
      run(node) {
        // Get the firstName and lastName from the current node properties
        const { firstName, lastName } = node.definition.properties;
        // Produce the full name, and wrap it in a value node 
        return value(`${firstName} ${lastName}`);
      },
    },
  },
});

function user(firstName, lastName) {
  return createNodeDefinition(UserNodeType, {
    firstName,
    lastName,
  });
}
```
You can then use this node like this:
```js
import muster from '@dws/muster';
import user from './user'; // This is our custom node

const app = muster({});

await app.resolve(user('Bob', 'Smith')); // === 'Bob Smith'
```

## Resolve operation dependencies

The `user` node we just created works well with hard-coded first and last names. This however doesn't utilise the full power of Muster. You might have noticed that most of Muster nodes allow for both static values and for nodes. This is where the dependency mechanism comes in. In this example we're going to refactor the `user` node to support both string values as well as nodes that eventually resolve to a string value.
```js
import { createNodeDefinition, createNodeType, graphTypes, toValue, value, valueOf } from '@dws/muster';

const UserNodeType = createNodeType('user', {
  // Update the shape of the node to store nodeDefinitions
  shape: {
    firstName: graphTypes.nodeDefinition,
    lastName: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      // Declare the node dependencies
      getDependencies(properties) {
        const { firstName, lastName } = properties;
        return [
          { target: firstName },
          { target: lastName },
        ];
      },
      // Extract resolved dependencies - these are graph nodes
      // Don't expect any errors here, as by default Muster short-circuits them
      run(node, operation, [firstNameNode, lastNameNode]) {
        // Extract the value of the `firstNameNode`
        // This is the same as doing: const firstName = firstNameNode.definition.properties.value;
        const firstName = valueOf(firstNameNode.definition);
        const lastName = valueOf(lastNameNode.definition);
        // Produce the full name, and wrap it in a value node 
        return value(`${firstName} ${lastName}`);
      },
    },
  },
});

function user(firstName, lastName) {
  return createNodeDefinition(UserNodeType, {
    // Safely convert the `firstName` and `lastName` to a value() node, or leave as is in case it already is a node
    firstName: toValue(firstName),
    lastName: toValue(lastName),
  });
}
```
First, we changed the shape of the node to hold only node definitions, instead of string as it was previously. Next, we updated added a `getDependencies()` function to the `evaluate` operation. This function returns an array of dependencies to be resolved by Muster. Each dependency can additionally specify resolution criteria (for example - resolve a particular dependency until it is a node that supports a `set` operation), but this has been skipped for now to make this example a bit simpler. After that we've changed the `run` method to grab the resolved dependencies. In the body of the `run` method we extract the value of first name and last name, and produce the full name. The final step was to change the factory function to safely convert the `firstName` and `lastName` arguments to `value()` nodes. The `toValue` doesn't convert existing nodes, and returns them unchanged.

> The `run` method is going to be called only when the dependencies resolved to a non-error node that matches our criteria. Encountering a node that doesn't match our dependency criteria will return an error.

Now you can use the node in the following forms:
```js
user('Bob', 'Smith');
user(value('Bob'), value('Smith'));
user(ref('firstName'), ref('lastName'));
```


## Specify dependency resolution criteria

An eagle-eyed reader might have noticed that there's a nasty bug hidden in the code above. To illustrate it take a look at a following example usages of `user` node:
```js
user(1, 'Smith')
user(array([]), 'Smith');
```
Both cases would result in running the `run` function with unsupported values of the dependencies. If we think about it, the only supported type of the dependency is a `value()` node that contains a string value. Anything else should be discarded, and should let developer know that a particular use is not supported.
To do this we might declare an `until` predicate for both of our dependencies. Muster comes with a number of helper function for checking expected types of values, but you could write your own as well. For now we're going to resort to using an existing `untilStringValueNode` predicate:
```js
import { createNodeDefinition, createNodeType, graphTypes, toValue, untilStringValueNode, value, valueOf } from '@dws/muster';

const UserNodeType = createNodeType('user', {
  shape: {
    firstName: graphTypes.nodeDefinition,
    lastName: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies(properties) {
        const { firstName, lastName } = properties;
        return [
          // Declare an `until` predicate to be a string value node. The arguments of this function are there to improve
          // error message, as in case of an error it is going to show which node returned an error and for which dependency
          { target: firstName, until: untilStringValueNode(UserNodeType, 'firstName') },
          { target: lastName, until: untilStringValueNode(UserNodeType, 'lastName') },
        ];
      },
      run(node, operation, [firstNameNode, lastNameNode]) {
        const firstName = valueOf(firstNameNode.definition);
        const lastName = valueOf(lastNameNode.definition);
        return value(`${firstName} ${lastName}`);
      },
    },
  },
});

function user(firstName, lastName) {
  return createNodeDefinition(UserNodeType, {
    firstName: toValue(firstName),
    lastName: toValue(lastName),
  });
}
```
The same `until` predicate could also be written as (without the use of `untilStringValueNode`):
```js
import { ValueNodeType } from '@dws/muster';
// ...
getDependencies(properties) {
  const { firstName, lastName } = properties;
  return [
    // Declare an `until` predicate to be a string value node. The arguments of this function are there to improve
    // error message, as in case of an error it is going to show which node returned an error and for which dependency
    {
      target: firstName,
      until: {
        predicate: (node) => ValueNodeType.is(node) && typeof node.definition.properties.value === 'string',
        errorMessage: () => 'Invalid firstName. Expected value(string).'
      }
    },
    {
      target: lastName,
      until: {
        predicate: (node) => ValueNodeType.is(node) && typeof node.definition.properties.value === 'string',
        errorMessage: () => 'Invalid lastName. Expected value(string).'
      },
    },
  ];
},
// ...
```

## How does the dependency resolution works

In this section we're going to take a deeper look at how Muster resolves dependencies, and how to use to our advantage when writing dependency `until` predicates.


### Without an *until* predicate

Given a following Muster graph:
```js
muster({
  productName: value('Test product'),
  productNameRef: ref('productName'),
});
```
And a following node dependency:
```js
getDependencies() {
  return [
    { target: ref('productNameRef') },
  ];
}
```
The simplified dependency resolution chain looks like this:
- Does the `ref('productNameRef')` node support `evaluate` operation? ***yes***
- Evaluate the `ref('productNameRef')` node (received `ref('productName')`)
- Does the `ref('productName')` node support `evaluate` operation? ***yes***
- Evaluate the `ref('productName')` node (received `value('Test product')`)
- Does the `value('Test product')` node support `evaluate` operation? ***no***
- **END**

This resolution chain is simplified because it doesn't include intermediate nodes produced by the `ref()` or by Muster.


### With an *until* predicate

Given the same Muster graph as in the previous example
And a following node dependency:
```js
getDependencies() {
  return [
    { target: ref('productNameRef'), until: { predicate: (node) => ValueNodeType.is(node) } },
  ];
}
```
The simplified dependency resolution chain looks like this:
- Does the `ref('productNameRef')` match the `until.predicate`? ***no***
- Does the `ref('productNameRef')` node support `evaluate` operation? ***yes***
- Evaluate the `ref('productNameRef')` node (received `ref('productName')`)
- Does the `ref('productName')` match the `until.predicate`? ***no***
- Does the `ref('productName')` node support `evaluate` operation? ***yes***
- Evaluate the `ref('productName')` node (received `value('Test product')`)
- Does the `value('Test product')` match the `until.predicate`? ***yes***
- **END**

> With the `until` predicate specified, when the `Does the <<node>> node supports 'evaluate' operation?` check returns `no`, the dependency is marked as unmet and returns an error based on the `until.errorMessage` or a default error message.
>
> This means that returning `false` from the predicate doesn't immediately return an unmet dependency error. Nodes discarded by the predicate are evaluated (if possible) to see if their result are accepted by the predicate. Only when the node is rejected by the predicate **AND** does not support `evaluate` operation the dependency is marked as unmet.


## Reading operation arguments

As mentioned in the Node Type API section, every operation receives an operation definition which can contain some operation-specific arguments. In all of the previous examples we used only the `evaluate` operation, which doesn't have any operation-specific arguments. To illustrate this feature we have to use a different operation, for example the `call` operation.
```js
import { createNodeDefinition, createNodeType, isGraphNode, value, valueOf } from '@dws/muster';

const AddNumbersNodeType = createNodeType('add-numbers', {
  shape: {},
  operations: {
    call: { 
      run(node, operation) {
        const sum = operation.properties.args
          // Extract values of arguments - make sure to un-wrap graph nodes as well
          .map((arg) => isGraphNode(arg) ? valueOf(arg.definition) : valueOf(arg))
          // Sum the arguments
          .reduce((acc, arg) => acc + arg, 0);
        return value(sum);
      },
    },
  },
});

function addNumbers() {
  return createNodeDefinition(AddNumbersNodeType, {});
}
```
You can then call the node like this:
```js
const app = muster({
  addNumbers: addNumbers(),
});

await app.resolve(call(ref('addNumbers'), [1, 2, 3, 4]));
// === 10
```
One thing to note about the `call` arguments is that the array might contain both node definitions as well as graph nodes. For this reason before using it you have to do a check if it is a graph node (or a node definition).


## Stateful nodes

So far we've covered how to write **static** and **stateless** node types. There's a third type of a node type - **stateful**. This type of a node can contain a state that can be shared between different operations. For example, imagine a node that can access the result of a `set` operation from within an `evaluate` operation. This is essentially what a `variable()` node does.

In order to implement a stateful node we need to declare a few things aside from the usual `shape` and `run`:
- `state` - A shape of the state object. Works similarly to the `shape` property, but describes how to hash the state object.
- `getInitialState()` - Gets initial state of the node

These are all of the required properties of the node type. Having them enables the use of `onSubscribe` and `onUnsubscribe` methods for both node type and operation.

Each stateful node has an ability to store local state in two places:
- `setState()` - Sets the state of the node. This causes all of the subscribed operations' `run()` methods to be re-run. The newly set state can be accessed as the last argument of the `run()` function.
- `setData()` - Sets the data of the node. This DOES NOT cause the `run()` to be re-run. The data is only available to the `onSubscribe()` and `onUnsubscribe()` functions. The `run()` function does not have access to the data.


## Implement a variable node

In this section we're going to put the knowledge from the previous section to good use, and implement our own version of the `variable()` node.
```js
import { createNodeDefinition, createNodeType, graphTypes, ok, toValue } from '@dws/muster';

const MyVariableNodeType = createNodeType('my-variable', {
  shape: {
    defaultValue: graphTypes.nodeDefinition,
  },
  state: {
    currentValue: graphTypes.nodeDefinition,
  },
  getInitialState(properties) {
    return {
      currentValue: properties.defaultValue,
    };
  },
  operations: {
    evaluate: {
      run(node, operation, dependencies, contextDependencies, state) {
        return state.currentValue;
      },
    },
    set: {
      run() {
        return ok();
      },
      onSubscribe(node, operation) {
        // Calling this.setState() will cause the `evaluate.run` to be re-run, and a new value to be returned
        this.setState({
          currentValue: operation.properties.value,
        });
      },
    },
  },
});

function myVariable(defaultValue) {
  return createNodeDefinition(MyVariableNodeType, { defaultValue: toValue(defaultValue) });
}
```
First, we define the shape of the node, which has the default value. Next, the state which holds the current value of the node, and which should also be a node definition. Following that, we declare an `evaluate` operation which returns the `currentValue` from the state, which is available as the last argument of the `run()` function. Then we declare the `set` operation. Running this operation should return an `ok()` node, so that Muster knows that the set worked fine. The juicy part of this comes in the `onSubscribe` function of the `set` operation. This function has access to a few stateful functions of the node:
  - `this.setState()`
  - `this.getState()`
  - `this.setData()`
  - `this.getData()`

In the implementation of our `myVariable` node we only need the `this.setState()`.

The final part of `myVariable` implementation is to declare the factory function. Similarly to the previous examples, we safely cast the `defaultValue` to a `value()` node.

Now you can go ahead and use this simple implementation of the variable node:
```js
const app = muster({
  name: myVariable('Bob'),
});

app.resolve(ref('name')).subscribe((name) => console.log(`Hello, ${name}!`));

await app.resolve(set('name', 'Jane'));

// Console output:
// Hello, Bob!
// Hello, Jane!
```


## Lifecycle of a node

Before we get any further it's important for you to know the lifecycle of a node. When running Muster application, each node can hold two sets of data at a time:
  - `state` - A state of the node, as covered in the previous example
  - `data` - Some node data

> The `data` and the `state` is stored for as long as the node has **any** active subscriptions.

This means that any data stored in the node will be lost after the final subscription is closed. There are ways of changing this behaviour (retain/release mechanism), but we're going to talk about them in the next section.

Initially when a Muster application is started no **graph nodes** are created. Muster only keeps the information about **node definitions** (result of calling a node factory). These **node definitions** are then used to create **graph nodes** when needed.

The following flow chart shows what happens when a new subscription is created for a node:
![Subscribe flow chart](assets/subscribe-flow-chart.png)

Similarly, the following flow chart shows what happens when an operation gets unsubscribed from:
![Unsubscribe flow chart](assets/unsubscribe-flow-chart.png)


## Retain/release mechanism

Sometimes you might want some more fine-grained control as to when a given graph node gets destroyed, instead of relying just on subscription mechanism. This is where the retain/release mechanism comes in. By retaining node you create an additional self-subscription. This means that when the final node subscription gets closed the node has still one subscription left, which saves the node state and data from being destroyed. To close that self-subscription you must use the release function.

To illustrate the working of this mechanism let's revisit the `myVariable` node, as there was one more problem with it. Consider a following use case:
```js
const app = muster({
  name: myVariable('initial'),
});

console.log('Setting name = `Bob`');
await app.resolve(set('name', 'Bob'));

console.log('name=', await app.resolve(ref('name')));

// Console output:
// Setting name = `Bob`
// name=initial
```
This behaviour isn't exactly what we expected when implementing a custom variable node. There's a good reason why it works that way.

Initially the `name` node has `0` subscriptions. Resolving the `set('name', 'Bob')` creates one subscription, which initialises the state, and then sets the `currentValue` in the `evaluate.onSubscribe()`. Once the `set()` is completed the subscription is closed because of the `await` keyword. This means that the node state is also destroyed, and when the `ref('name')` is resolved the node is resolved with a fresh state.

Let's try to fix this by using `retain`/`release`:
```js
import { createNodeDefinition, createNodeType, graphTypes, ok, toValue } from '@dws/muster';

const MyVariableNodeType = createNodeType('my-variable', {
  shape: {
    defaultValue: graphTypes.nodeDefinition,
  },
  state: {
    currentValue: graphTypes.nodeDefinition,
  },
  getInitialState(properties) {
    return {
      currentValue: properties.defaultValue,
    };
  },
  operations: {
    evaluate: {
      run(node, operation, dependencies, contextDependencies, state) {
        return state.currentValue;
      },
    },
    set: {
      run() {
        return ok();
      },
      onSubscribe(node, operation) {
        // Make sure the to run this only when the set is called for the first time
        if (!this.getData().isRetained) {
          // Retain the node
          this.retain();
          // Store the `isRetained` flag in the node data
          this.setData({ isRetained: true });
        }
        this.setState({
          currentValue: operation.properties.value,
        });
      },
    },
  },
});

function myVariable(defaultValue) {
  return createNodeDefinition(MyVariableNodeType, { defaultValue: toValue(defaultValue) });
}
```
Note that the only thing we had to do was to call `this.retain()` when the `set` operation was subscribed for the first time.
One final thing to do is to release the node at some point, otherwise setting it would cause a memory leak. In Muster there's a `reset` operation, which is used for resetting a node to a default value. Let's implement it for our custom variable node:
```js
import { createNodeDefinition, createNodeType, graphTypes, ok, toValue } from '@dws/muster';

const MyVariableNodeType = createNodeType('my-variable', {
  shape: {
    defaultValue: graphTypes.nodeDefinition,
  },
  state: {
    currentValue: graphTypes.nodeDefinition,
  },
  getInitialState(properties) {
    return {
      currentValue: properties.defaultValue,
    };
  },
  operations: {
    evaluate: {
      run(node, operation, dependencies, contextDependencies, state) {
        return state.currentValue;
      },
    },
    // Add the `reset` operation
    reset: {
      run() {
        return ok();
      },
      onSubscribe() {
        // Don't release the node if it hasn't been retained
        if (!this.getData().isRetained) return;
        // Reset the `isRetained` flag
        this.setData({ isRetained: false });
        // Release the node
        this.release();
      },
    },
    set: {
      run() {
        return ok();
      },
      onSubscribe(node, operation) {
        if (!this.getData().isRetained) {
          this.retain();
          this.setData({ isRetained: true });
        }
        this.setState({
          currentValue: operation.properties.value,
        });
      },
    },
  },
});

function myVariable(defaultValue) {
  return createNodeDefinition(MyVariableNodeType, { defaultValue: toValue(defaultValue) });
}
```
