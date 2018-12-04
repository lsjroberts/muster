# Muster-React

## Introduction

Muster-React is a library that helps using Muster in an application written in React. 

## Installation

```bash
npm install --save @dws/muster-react
```

## Usage

Muster-React exposes a [[container]] function which is used for creating a wrapper for a
React component. This wrapper component is responsible for making queries to Muster, handling
responses and passing them as props to the wrapped component. The wrapper component assumes the
existence of a `muster` property on a React context. It can be set with the help of a [[Provider]]
component. The library exports a modified version of a `muster` helper. By default, when using
`muster` from `@dws/muster` it creates an application with all core muster graph nodes. This custom
version of `muster` helper additionally includes all `muster-react` graph nodes. 


### Setting up Muster [[Provider]]
```jsx
import * as React from 'react';
import muster, { Provider } from '@dws/muster-react';

// Create a muster app
const app = muster({
  name: 'Bob',
});

function Application() {
  return (
    <Provider muster={app}>
      {/* Your application goes here */}
    </Provider>
  );
}
```
This example shows how to create a Muster application that has a single branch `name`.
The `Application` component is responsible for storing that application on the React context so
that any child component has access to it.


### Creating connected components
```jsx
import * as React from 'react';
import { container } from '@dws/muster-react';

function MyComponent({ name }) {
  return <h1>{name}</h1>;
}

const MyConnectedComponent = container({
  graph: {
    name: 'Bob',
  },
  props: {
    name: true,
  },
})(MyComponent);

// To render this component simply type <MyConnectedComponent />
// No props are needed as they'll be injected by Muster-React
```
This example shows how to create a very basic Muster-React component. We first start by creating
a pure React component that takes one prop `name`. Next we create a connected component out of it.
When creating a Muster application we do this by defining a Muster graph with nodes and
relationships between them. Muster-React connects that **global graph** through the [[Provider]]
discussed in the previous example. The global graph contains the state of the application and it is
shared between all of the connected components. Additionally, each component has its own,
**local graph**. This graph is unique to every instance of a given component - one component does
not have access to another component's local graph. In this example, the configuration of the
connected component is split into two parts:
* **graph** - Defines the local graph - here you can use any graph nodes, just like in the pure
  muster. Refs defined in this graph are addressed against the root of the local graph. In order
  to make a reference to a global graph you have to define it as:
  `ref(global('nested', 'global', 'path'))`
* **props** - Nodes to retrieve from the local graph. The nodes can be retrieved as:
  * [[getter]] - Gets the value of a graph node
  * [[setter]] - Gets a function that can be used to set the value of the settable node
  * [[caller]] - Gets a function that can be used to call an action
  * [[list]] - Gets a list of items
  
In this example we used a short-hand [[getter]] notation - `name: true`. This means we simply want
to get the value of the `name` node. Internally Muster-React prepares a query that looks like this:
```js
import { key, query, root } from '@dws/muster';

const myConnectedComponentQuery = query(root(), {
  name: key('name'),
});
```
The connected component runs that query against the **local graph** and subscribes to the result
when its `componentWillMount` method get called by React. The subscription is closed when the
`componentWillUnmount` method gets called by React.


### Referencing global graph
```jsx
import * as React from 'react';
import muster, { container, global, Provider, ref } from '@dws/muster-react';

function User({ name }) {
  return <h1>{name}</h1>
}

const ConnectedUser = container({
  graph: {
    name: ref(global('user', 'name')),
  },
  props: {
    name: true,
  },
})(User);

const app = muster({
  user: {
    name: 'Bob',
  },
});

function Application() {
  return (
    <Provider muster={app}>
      <ConnectedUser />
    </Provider>
  );
}
```
This example shows how to make references to the global muster graph.


### Using [[setter]] prop type
```jsx
import * as React from 'react';
import { container, propTypes, types, variable } from '@dws/muster-react';

function NewsletterSettings({ sendNewsletter, setSendNewsletter }) {
  return (
    <button onClick={() => setSendNewsletter(!sendNewsletter)}>
      {sendNewsletter ? 'Stop sending newsletter' : 'Subscribe to newsletter'}
    </button>
  );
}

const ConnectedNewsletterSettings = container({
  graph: {
    sendNewsletter: variable(false),
  },
  props: {
    sendNewsletter: types.bool, 
    setSendNewsletter: propTypes.setter('sendNewsletter', types.bool),
  },
})(NewsletterSettings);
```
This example shows how to declare setter props and how to use them. This example also introduces the
concept of typed props. In previous example we've been defining props as `propName: true` which is
a short-hand of `propName: types.any`. In this example we defined the type of the prop explicitly:
`sendNewsletter: types.bool`. This will inform Muster to validate the type of the property as bool.
Next we're defining a `setSendNewsletter` property, which is a setter of a `sendNewsletter` node
and that it should be validated as a setter of a boolean values.

In this example we're completely ignoring the return value of the `setSendNewsletter` setter
function but it's important to remember that it is returning a Promise that resolves to a value
that was set.


### Using [[caller]] prop type
```jsx
import * as React from 'react';
import { action, container, propTypes } from '@dws/muster-react';

function Something({ getGreeting }) {
  async function onClick() {
    const greeting = await getGreeting('Bob');
    console.log(greeting); // Hello, Bob
  }
  return (
    <button onClick={onClick}>Log greeting</button>
  );
}

const ConnectedSomething = container({
  graph: {
    getGreeting: action((name) => `Hello, ${name}`),
  },
  props: {
    getGreeting: propTypes.caller(),
  },
})(Something);
```
This example shows how to declare an action, get a caller for it and call it. It is similar to
the previous example with `setter` in a way that the `getGreeting` caller function returns a
promise, just like the setter function in a previous example.


### Typed [[getter]] prop type
```jsx
import * as React from 'react';
import { container, types } from '@dws/muster-react';

function MyComponent({ name }) {
  // Display the name
  return null;
}

const MyConnectedComponent = container({
  graph: {
    name: 'Bob',
  },
  props: {
    name: types.string,
  },
})(MyComponent); 
```
This example shows how to use Muster types to declare a type of a prop that should be injected
to the component.


### Named [[getter]] prop type
```jsx
import * as React from 'react';
import { container, propTypes, types } from '@dws/muster-react';

function MyComponent({ myName }) {
  // Display the name
  return null;
}

const MyConnectedComponent = container({
  graph: {
    firstName: 'Bob',
  },
  props: {
    myName: propTypes.getter('firstName', types.string),
  },
})(MyComponent); 
```
This example shows how to use the [[getter]] prop type to retrieve a node with a different name
than the name used for the prop.


### Retrieving nested data
```jsx
import * as React from 'react';
import { container } from '@dws/muster-react';

function MyComponent({ user }) {
  // Display the user
  return null;
}

const MyConnectedComponent = container({
  graph: {
    user: {
      firstName: 'Bob',
      lastName: 'Doe',
      address: {
        line1: '1141 Losbi Lane',
        postCode: 'A0Y 6D3',
      },
    },
  },
  props: {
    user: {
      firstName: true,
      lastName: true,
      address: {
        line1: true,
      },
    },
  },
})(MyComponent);
```
This example shows how to request a nested data from local graph. **By now you've noticed that the
shape of the props must match the shape of the graph.** You might have also noticed that the address
in the local graph defines a `postCode` node but the props are not requesting it. This shows
that you don't have to load everything from your local graph to the component props. 


### Retrieving nested data from global graph
```jsx
import * as React from 'react';
import muster, { container, global, Provider, ref } from '@dws/muster-react';

const app = muster({
  currentUser: {
    firstName: 'Bob',
    lastName: 'Doe',
    address: {
      line1: '1141 Losbi Lane',
      postCode: 'A0Y 6D3',
    },
  },
});

function MyComponent({ firstName, lastName, address }) {
  // Display the user
  return null;
}

const MyConnectedComponent = container({
  graph: ref(global('currentUser')),
  props: {
    firstName: true,
    lastName: true,
    address: {
      line1: true,
    },
  },
})(MyComponent);

function Application() {
  return (
    <Provider muster={app}>
      <MyConnectedComponent />
    </Provider>
  );
}
```
In the example **Referencing global graph** we showed that nodes from the local graph can reference
parts of the global graph. This example extends that concept by showing that the entire local graph
can point to a specific part of a global graph. This means that every prop must match branch names
from the `currentUser` in the global graph. 


### Using [[list]] prop type for value-based collection
```jsx
import * as React from 'react';
import { container, propTypes } from '@dws/muster-react';

function MyComponent({ numbers }) {
  // Display the numbers.
  // In this example numbers = [1, 2, 3, 4]
  return null;
}

const MyConnectedComponent = container({
  graph: {
    numbers: [1, 2, 3, 4],
  },
  props: {
    numbers: propTypes.list(),
  },
})(MyComponent);
```
This example shows how to use the [[list]] prop type to retrieve items from a collection.


### Using [[list]] prop type for branch-based collection
```jsx
import * as React from 'react';
import { container, propTypes } from '@dws/muster-react';

function MyComponent({ friends }) {
  // Display the list of friends
  // In this example friends = [
  //   { firstName: 'Sylvia', lastName: 'Garcia' },
  //   { firstName: 'Carl', lastName: 'Francis' },
  //   { firstName: 'Arthur', lastName: 'Kennedy' },
  // ]
  return null;
}

const MyConnectedComponent = container({
  graph: {
    friends: [
      { firstName: 'Sylvia', lastName: 'Garcia', age: 48 },
      { firstName: 'Carl', lastName: 'Francis', age: 63 },
      { firstName: 'Arthur', lastName: 'Kennedy', age: 28 },
    ], 
  },
  props: {
    friends: propTypes.list({
      firstName: true,
      lastName: true,
    }),
  },
})(MyComponent);
```
This example shows how to use the [[list]] prop type to retrieve items with specific properties from
a collection. In this case we omitted the `age` property as it wasn't necessary for our component.


### Loading asynchronous data
In Muster there's no difference between loading synchronously available data and asynchronous.
Queries run against Muster graph are waiting for the entire data-set to be loaded before returning
it to the subscribers.

```jsx
import * as React from 'react';
import { container, fromPromise } '@dws/muster-react';

function MyComponent(props) {
  console.log('Rendering the component: ', props);
  return null;
}

const MyConnectedComponent = container({
  graph: {
    async: fromPromise(() => Promise.resolve('value')),
    sync: 'value',
  },
  props: {
    async: true,
    sync: true,
  },
})(MyComponent);

// Console output (when rendered):
// Rendering the component: { async: 'value', sync: 'value' }
```
This example shows that the rendering happens only when all of the data is loaded. This prevents
inconsistent UI states and ensures the minimum amount of renders.


### Deferring asynchronous data
There are sometimes moments when you would like to show a loading spinner when some data is loading
as it might take longer time to retrieve it from the server. Muster-React introduces two prop types
doing just that: [[defer]] and [[isLoading]].

The [[defer]] prop can be applied to any [[getter]] and [[list]] prop, and it instructs Muster to
load the given node asynchronously. When the node does not resolve immediately for the first time
it will return a fallback value: `null`. **However, when the node was resolved and goes to the
pending state again this prop will return a previous value of this node as a fallback.**

The [[isLoading]] prop is a meta-property which takes a name of a different prop from the same
branch (it must be a prop wrapped in a [[defer]]) and monitors the `pending` state of it.

```jsx
import * as React from 'react';
import { container, fromPromise, propTypes } '@dws/muster-react';

function MyComponent(props) {
  console.log('Rendering the component: ', props);
  return null;
}

const MyConnectedComponent = container({
  graph: {
    async: fromPromise(() => Promise.resolve('value')),
    sync: 'value',
  },
  props: {
    async: propTypes.defer(true),
    isLoadingAsync: propTypes.isLoading('async'), // It isn't necessary for the defer to work as described
    sync: true,
    // isLoadingSync: propTypes.isLoading('sync'), // ERROR, sync is not deferred!
  },
})(MyComponent);

// Console output (when rendered):
// Rendering the component: { async: null, isLoadingAsync: true, sync: 'value' }
// Rendering the component: { async: 'value', isLoadingAsync: false, sync: 'value' }
```
This example shows how to defer loading certain parts of the graph. **One thing to remember is that
for this to work correctly, every asynchronous prop must be wrapped in defer.** This is due to the
fact, that Muster normally waits for all data to be loaded before returning it to subscriber. 
The [[defer]] prop is notifying Muster that a particular graph node is not crucial for the
application to work and the query doesn't have to wait for it to resolve. When some other nodes
in the query share the same async behaviour but aren't wrapped in [[defer]] they will be blocking
the query from resolving.
The following example shows how that might happen:
```jsx
import * as React from 'react';
import { container, fromPromise, propTypes } '@dws/muster-react';

function MyComponent(props) {
  console.log('Rendering the component: ', props);
  return null;
}

const MyConnectedComponent = container({
  graph: {
    async1: fromPromise(() => Promise.resolve('value 1')),
    async2: fromPromise(() => Promise.resolve('value 2')),
    sync: 'value',
  },
  props: {
    async1: propTypes.defer(true),
    async2: true,
    sync: true,
  },
})(MyComponent);

// Console output (when rendered):
// Rendering the component: { async1: 'value 1', async2: 'value 2', sync: 'value' }
```
The component is rendered only once, because the `async2` prop is not marked as deferred. 


### Handling loading state
So far we've covered how to handle loading non-crucial data. It's not always possible to render
a component without certain points of data. For these cases you can use a special property
of [[container]] - `renderLoading`. It takes a function which will be called whenever a
component goes into a loading state - data is pending but not marked as deferred. The function
takes one parameter: last props, and is expected to return a JSX Element to render. You can use
this function to render for example a loading spinner. 

```jsx
import * as React from 'react';
import { container, fromPromise } '@dws/muster-react';

function MyComponent(props) {
  console.log('Rendering the component: ', props);
  return null;
}

const MyConnectedComponent = container({
  graph: {
    async: fromPromise(() => Promise.resolve('value')),
    sync: 'value',
  },
  props: {
    async: true,
    sync: true,
  },
  renderLoading: (props) => {
    console.log('Rendering a loading spinner');
    return null;
  },
})(MyComponent);

// Console output (when rendered):
// Rendering a loading spinner
// Rendering the component: { async: 'value', sync: 'value' }
```


### Handling errors
Error handling is as very important part of application development. Sometimes it's the network
problem, a simple developer mistake, or user trying to do something incorrectly.
Good applications should be able to recover from these kinds of issues. Muster and Muster-React
enable a few layers of error handling:
* Network-layer error handling by means of `transformResponseMiddleware` and `handleErrors` helper
* Node-level error handling with the `IfErrorNode`
* [[container]] - `renderError` function.

The first two methods of error handling are covered in Muster documentation. This example will
focus only on the last one - `renderError`.
```jsx
import * as React from 'react';
import { container, computed } '@dws/muster-react';

function MyComponent(props) {
  console.log('Rendering the component: ', props);
  return null;
}

const MyConnectedComponent = container({
  graph: {
    name: computed([], () => {
      throw new Error('Some unexpected error');
    }), 
  },
  props: {
    name: true,
  },
  renderError: (errors, props) => {
    console.log('An error has occurred: ', errors);
    return null;
  },
})(MyComponent);

// Console output (when rendered):
// An error has occurred: [
//   { $type: 'error', error: new Error('Some unexpected error'), path: ['name'] },
// ]
```
This example shows how to use the `renderError` method to access the array of errors.


### Accessing react props from the local graph
As mentioned at the beginning of this document, the connected component does not require any react
props to run correctly. That doesn't mean it can't have any props. Any additional props set on a
connected component can be accessed from the local graph with the help of a [[PropNode]]. This
example shows how to access such props:
```jsx
import * as React from 'react';
import { container, computed, prop } from '@dws/muster-react';

function MyComponent({ greeting }) {
  console.log('Greeting: ', greeting);
  return null;
}

const MyConnectedComponent = container({
  graph: {
    greeting: computed([prop('name')], (name) => `Hello, ${name}`),
  },
  props: {
    greeting: true,
  },
})(MyComponent);

// Somewhere in another part of the application:
<MyConnectedComponent name="Bob" />

// Console output (when rendered):
// Greeting: Hello, Bob
```
