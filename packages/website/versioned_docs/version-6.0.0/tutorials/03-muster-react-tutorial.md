---
id: version-6.0.0-muster-react-tutorial
title: Muster React Tutorial
original_id: muster-react-tutorial
---

## What is Muster React?

Muster React is a library used to interface between [React](https://reactjs.org/) and Muster. It introduces a concept of container graphs that connect a React component with a Muster graph, and which can contain self-contained Muster graphs available only to a single instance of a given component, but which also have ability to connect to the **global** application graph.

In the course of this tutorial I'm assuming that the reader has a basic knowledge about making **React** components, and has basic knowledge about Muster. At the time of writing this tutorial the best resource to learn muster is to follow a **From zero to Muster hero** tutorial, but there might be better resources if you're living in the future 🖖

## Hello, Muster React world!

Let's start by making a React component, and then converting it to a Muster React component. The component will show a `Hello, ${name}!` message, where `name` is going to be a property of the component:

```jsx harmony
import * as React from 'react';
import * as ReactDOM from 'react-dom';

function MyComponent({ name }) {
  return <p>Hello, {name}!</p>;
}

ReactDOM.render(<MyComponent name="world" />, document.body);

// Rendered HTML:
// <p>Hello, world!</p>
```

This part should be quite familiar to you, so I won't go into details.

Building an application with Muster React is done in four steps:

1. Declare Muster application, with the use of a familiar `muster({ /* graph */ })` syntax
2. Wrap the top-level component in a Muster React `Provider` component, with a reference to the Muster application (called henceforth **global graph**).
3. Create a component decorator, whose responsibility is to connect to the **global graph** to get the values from it.
4. Run the `MyComponent` through the Muster React decorator, and use the result in your code.

Let's start by declaring our **global graph**:

```jsx harmony
// ...
import muster from '@dws/muster-react';
// or you could do:
// import muster from '@dws/muster-react';
// It doesn't matter where you import 'muster' from, as it's the same function

const app = muster({
  name: 'world'
});
```

The next step is to wrap the top-level component in a Muster React `Provider` component:

```jsx harmony
// ...
import { Provider } from '@dws/muster-react';

// ...

ReactDOM.render(
  <Provider muster={app}>
    <MyComponent name="world" />
  </Provider>,
  document.body
);
```

The `Provider` component has one mandatory property - `muster`. This property takes an instance of Muster application, which is going to serve as a **global graph**, and which will be available to every **connected component** that is a child of that `Provider`.

Now, let's make a component decorator, which is going to be called from now on **container**:

```jsx harmony
// ...
import { /*...*/ simpleContainer } from '@dws/muster-react';

const myContainer = simpleContainer({
  name: true
});
```

This code block creates a component decorator which connects it to the **global graph**. The first argument of the `simpleContainer()` takes an object describing which nodes should be loaded from the graph. Note that the name of the `name` property matches the name of the `name` branch defined in the **global graph**. At the same time it also defines the name of the property which is going to be sent to component's render function.
We're going to cover this in more detail later so don't worry if it isn't 100% clear yet.

The last step is to run the component through the decorator in a process called **connecting component**, and which produces a **connected component**:

```jsx harmony
// ...
const MyConnectedComponent = myContainer(MyComponent);

ReactDOM.render(
  <Provider muster={app}>
    <MyConnectedComponent />
  </Provider>,
  document.body
);
```

Notice that the `MyConnectedComponent` no longer has a `name` prop set on it. It is because that property is now loaded from the **global graph**.

Here's a finished code:

```jsx harmony
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import muster, {
  Provider,
  simpleContainer
} from '@dws/muster-react';

const app = muster({
  name: 'world'
});

function MyComponent({ name }) {
  return <p>Hello, {name}!</p>;
}

const myContainer = simpleContainer({
  name: true
});

const MyConnectedComponent = myContainer(MyComponent);

ReactDOM.render(
  <Provider muster={app}>
    <MyConnectedComponent />
  </Provider>,
  document.body
);

// Rendered HTML:
// <p>Hello, world!</p>
```

You might have noticed that the rendered HTML hasn't changed. It's because the `name` node in the graph has a value `world`, which is the same as the value of the property used in the initial version of this example.

## Components reacting to changes in the graph

One of Muster's biggest strengths is that the nodes reactively respond to the changes in the values of their dependencies (when they're subscribed). Muster React builds on this by bringing the same behaviour to React components. This means that your component will be automatically re-rendered every time a node on which this component depends changes.

To illustrate this let's take a look at a slightly modified example from previous section:

```jsx harmony
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import muster, {
  Provider,
  set,
  simpleContainer,
  variable
} from '@dws/muster-react';

const app = muster({
  name: variable('world')
});

function MyComponent({ name }) {
  return <p>Hello, {name}!</p>;
}

const myContainer = simpleContainer({
  name: true
});

const MyConnectedComponent = myContainer(MyComponent);

ReactDOM.render(
  <Provider muster={app}>
    <MyConnectedComponent />
  </Provider>,
  document.body
);

// Change the name to 'Bob'
await app.resolve(set('name', 'Bob'));

// Rendered HTML:
// <p>Hello, world!</p>

// Rendered HTML:
// <p>Hello, Bob!</p>
```

The example above shows that changing the value of a node on which a component depends causes it to be re-rendered with an updated value.
The code used to set that `variable()` would be considered fine when writing pure Muster code, but in Muster React there are much better ways of setting a variable from inside the component. We're going to talk about them in later stages of this tutorial.

## Types of container props

In our first **container** we defined the props as `{ name: true }`. This only informs Muster React that a component should make a `query()` against a **global graph** for a branch `name`. The query created by the container looks like this:

```javascript
import { query, root } from '@dws/muster';

query(root(), {
  name: true
});
```

However, the props definition used above doesn't provide any validation of a type of a loaded value. This is where `types` object come in - you might remember it from **From zero to Muster hero** tutorial, where we spoke about branch matchers:

```javascript
import muster, { simpleContainer, types } from '@dws/muster-react';

// Given a global graph
const app = muster({
  someValue: 123
});

const myContainer = simpleContainer({
  someValue: types.number
});
```

The container created here explicitly specifies the type of an expected value. An error is raised if the value loaded from the graph doesn't match the expected type.

You can also specify more complex matchers, where the expected value is one of many types:

```javascript
const myContainer = simpleContainer({
  someValue: types.oneOfType([types.string, types.number])
});
```

The type validator used here makes sure that the `someValue` property is either a string or a number. Both of these types are allowed, but for example boolean is not allowed.

As a side note, creating a container as `simpleContainer({ name: true })` is equivalent to `simpleContainer({ name: types.any })`, as both of them behave in the same way.

## Getting nested data

Similarly to the `query()` node, a Muster React container can also request nested data from the graph:

```jsx harmony
import muster, { simpleContainer } from '@dws/muster-react';

const app = muster({
  user: {
    firstName: 'Kate',
    lastName: 'Smith'
  }
});

const myContainer = simpleContainer({
  user: {
    firstName: true,
    lastName: true
  }
});

const MyConnectedComponent = myContainer(({ user }) => (
  <p>
    Hello, {user.firstName} {user.lastName}!
  </p>
));
```

This example shows how to request nested data from the graph. The query produced by the container above looks like this:

```javascript
import { query, root } from '@dws/muster-react';

query(root(), {
  user: {
    firstName: true,
    lastName: true
  }
});
```

Additionally, the `simpleContainer()` function comes with an optional first argument, which defines a `query()` root node path. In all of the examples above the path was empty, and so the query root node defaulted to a `root()` node.
Let's change the code above to make use of it:

```jsx harmony
import muster, { simpleContainer } from '@dws/muster-react';

const app = muster({
  user: {
    firstName: 'Kate',
    lastName: 'Smith'
  }
});

const myContainer = simpleContainer(['user'], {
  firstName: true,
  lastName: true
});

const MyConnectedComponent = myContainer(
  ({ firstName, lastName }) => (
    <p>
      Hello, {firstName} {lastName}!
    </p>
  )
);
```

Note that the props of the `simpleContainer()` are no longer nested under `user`. Also, the render function of the `MyConnecteComponent` accesses the `firstName` and `lastName` directly, instead of through a `user` prop.
This is because the query created by the container now looks a bit different:

```javascript
import { query, ref } from '@dws/muster';

query(ref('user'), {
  firstName: true,
  lastName: true
});
```

This should explain why the props of the `MyConnectedComponent` have different shape than in the previous example.

## Setting a variable

At the beginning of this tutorial I spoke about there being a better way of setting a value of a **settable** node with Muster React. This is where the `propTypes.setter()` function comes in. It is a kind of a matcher unique to Muster React which informs the component, that a given part of a query should be loaded as a setter function:

```jsx harmony
import muster, { computed, propTypes, ref, simpleContainer, variable } from '@dws/muster-react';

const app = muster({
  firstName: variable('Bob'),
  greeting: computed(
    [ref('firstName')],
    (firstName) => `Hello, ${firstName}!`,
  ),
});

const myContainer = simpleContainer({
  firstName: true,
  greeting: true,
  setFirstName: propTypes.setter('firstName'),
});

const MyComponent = myContainer(({ firstName, greeting, setFirstName }) => (
  <section>
    <div>
      <label>First name</label>
      <input
        type="text"
        onChange={(e) => setFirstName(e.currentTarget.value)} {/* Call the setter function */}
        value={firstName}
        />
    </div>
    <p>{greeting}</p>
  </section>
));
```

In the example above we first create a Muster global graph, that contains a `firstName` variable, and a `computed()` node that generates a greeting based on the current value of the `firstName` variable.
Next we declare the container, which requests firstName and a greeting, as well as a setter for a `firstName` node.
Note that the name of the property `setFirstName` is different from the name of the node in the graph. That is why we need to specify a name of the node this setter refers to - this is where the string argument of the `propTypes.setter()` comes in - it defines the name of the node that the setter should target. That argument wouldn't be necessary if the props were defined like this:

```javascript
simpleContainer({
  greeting: true,
  firstName: propTypes.setter()
});
```

The problem with these props is that we're only requesting a setter function for a given **settable** node, but we're not getting back the current value of a given node. That's why its better to leave `firstName` property for a getter, and assign the setter to `setFirstName` property.

> The example above treats the setter function as a normal, synchronous JavaScript function which was fine for that particular use-case. However, the setter function actually returns a Promise, which can be used to await for the value to be saved in your application graph.

## Validating setter arguments

Similarly to a regular property getter, the `propTypes.setter` also allows validating the type of a value passed to the setter. You can do it by creating an unnamed setter with a type validator (`propTypes.setter(types.string)`, which checks if the argument to the setter is a string), or as a setter with an alias, and a type validator (`propTypes.setter('variableName', types.optional(types.number))` which checks if the argument of the setter is a number or undefined or null).
Let's revisit the previous example, and add setter type validation to it as well:

```jsx harmony
import muster, { computed, propTypes, ref, simpleContainer, types, variable } from '@dws/muster-react';

const app = muster({
  firstName: variable('Bob'),
  greeting: computed(
    [ref('firstName')],
    (firstName) => `Hello, ${firstName}!`,
  ),
});

const myContainer = simpleContainer({
  firstName: true,
  greeting: true,
  setFirstName: propTypes.setter('firstName', types.string),
});

const MyComponent = myContainer(({ firstName, greeting, setFirstName }) => (
  <section>
    <div>
      <label>First name</label>
      <input
        type="text"
        onChange={(e) => setFirstName(e.currentTarget.value)} {/* Call the setter function */}
        value={firstName}
        />
    </div>
    <p>{greeting}</p>
  </section>
));
```

In our example we shouldn't have any validation problems, as the `.value` property of the HTMLInput element is always a string, but if it wasn't we'd get an error in the browser console describing what has gone wrong.

## Calling an action

Just like the `setter`, there's a also a `propType.caller()` which instructs Muster React to retrieve a caller function, which is capable of calling a **callable** node defined in the graph (e.g. `action()`, `fn()` nodes).

```jsx harmony
import muster, {
  action,
  propTypes,
  simpleContainer
} from '@dws/muster-react';

const app = muster({
  showHelloAlert: action(function*(name) {
    alert(`Hello, ${name}!`);
  })
});

const myContainer = simpleContainer({
  showHelloAlert: propTypes.caller()
  // or
  // callShowHelloAlert: propTypes.caller('showHelloAlert')
});

const MyComponent = myContainer(({ showHelloAlert }) => (
  <button onClick={() => showHelloAlert('Bob')}>
    Show "Hello, Bob!" alert
  </button>
));
```

Clicking on the button rendered by this component will result in the `showHelloAlert` action being called with a single argument: `name = 'Bob'`. Multiple arguments can be provided just like to a normal JavaScript function:
`showHelloAlert('Bob', 1, 2, 3)`. These additional arguments will be discarded, as the action in the graph doesn't require more parameters than just the one - `name`.

## Validating caller arguments

The `caller()` functions can also validate the number and type of arguments provided to the caller function. To do this you just specify an array of type matchers used to validate each argument of the caller function:

- `propTypes.caller([])` or `propTypes.caller('showHelloAlert', [])` - empty array informs that the caller function should take no arguments, and that it should return error when it's called with arguments.
- `propTypes.caller([types.string])` or `propTypes.caller('showHelloAlert', [types.string])` - the caller function is expected to take only single argument - a string - and it should return error when it's called with invalid number of arguments, or arguments with incorrect type.
  Let's revisit the previous example, and add a caller function argument validation:

```jsx harmony
import muster, {
  action,
  propTypes,
  types,
  simpleContainer
} from '@dws/muster-react';

const app = muster({
  showHelloAlert: action(function*(name) {
    alert(`Hello, ${name}!`);
  })
});

const myContainer = simpleContainer({
  showHelloAlert: propTypes.caller([types.string])
  // or
  // callShowHelloAlert: propTypes.caller('showHelloAlert', [types.string])
});

const MyComponent = myContainer(({ showHelloAlert }) => (
  <button onClick={() => showHelloAlert('Bob')}>
    Show "Hello, Bob!" alert
  </button>
));
```

## Getting items from a primitive collection

A process of loading a collection of primitive items is very similar to requesting a normal static node. All we have to do is to tag a given property in a way that lets Muster React know that we're dealing with a collection of primitives. To do this we use `propTypes.list()` prop matcher. Similarly to the `propTypes.setter()` and `propTypes.caller()`, this function allows for specifying an alias, and a type matcher - in this case the type matcher is going to be for a type of the primitive item - `propTypes.list(types.string)` defines a list matcher for a primitive collection containing only string items.
Time for an example:

```jsx harmony
import muster, {
  propTypes,
  types,
  simpleContainer
} from '@dws/muster-react';

const app = muster({
  femaleNames: ['Kate', 'Jane', 'Jasmine']
});

const myContainer = simpleContainer({
  femaleNames: propTypes.list(types.string)
  // or
  // names: propTypes.list('femaleNames', types.string),
});

const MyComponent = myContainer(({ femaleNames }) => (
  <ul>
    {femaleNames.map((name) => (
      <li>{name}</li>
    ))}
  </ul>
));
```

This brief example demonstrates how to instruct Muster React component to load a given node as a collection of primitive items. The type validation is **optional**, but but recommended.

## Getting specific fields from a collection

Sometimes your application graph might contain collections of `tree()` nodes. As you might remember from the Muster tutorial, these collections must be queried by requesting specific fields from each collection item. This can be done with the help of the `propTypes.list()` prop type. Yup, the same prop type matcher as in the previous example.
In the case of collections with primitive items, the signature of the `propTypes.list()` allowed for three combinations:

- `propTypes.list()` - untyped list of primitives
- `propTypes.list(<<type matcher>>)` - a collection of items that are of a `<<type matcher>>` type
- `propTypes.list(<<graph alias>>, <<type matcher>>)` - an aliased collection of items that are of a `<<type matcher>>` type
  There are two additional variants of this prop type matcher used when instructing a component to load a given prop as a collection of `tree()` nodes:
- `propTypes.list({ <<fields matchers>> })` - a collection of `tree()` nodes, where the component requires only a given fields from the `<<fields matchers>>` object.
- `propTypes.list(<<graph alias>>, { <<fields matchers>> })` - just like the one above, but with additional graph alias

The example should make this a bit clearer:

```jsx harmony
import muster, {
  propTypes,
  simpleContainer
} from '@dws/muster-react';

const app = muster({
  products: [
    { name: 'Quiet runner 2000', category: 'Shoes' },
    { name: 'Smooth criminal brogue', category: 'Shoes' },
    { name: 'Winter jacket', category: 'Jackets' },
    { name: 'Waterproof jacket', category: 'Jackets' },
    { name: 'Fake mustache', category: 'Accessories' }
  ]
});

const myContainer = simpleContainer({
  products: propTypes.list({
    name: true
  })
});

const MyComponent = myContainer(({ products }) => (
  <ul>
    {products.map(({ name }) => (
      <li>{name}</li>
    ))}
  </ul>
));
```

The example above makes a container that makes a query against the **global graph** for a list of names from a collection of products. Additionally, we could change the code to add type validation for the `name` property of the product, but for simplicity I left it as `true`.

> You can use every matcher from `propTypes` in the definition of the `propTypes.list({})` prop type matcher. For example: When every item in the graph has an action `doSomething: action()`, you can define a list prop type matcher that gets a caller for that function:
>
> ```jsx harmony
> import muster, {
>   action,
>   propTypes,
>   ref,
>   relative,
>   simpleContainer
> } from '@dws/muster-react';
>
> const app = muster({
>   someItems: [
>     {
>       name: 'Item 1',
>       showAlert: action(function*() {
>         const name = yield ref(relative('name'));
>         alert(`Alert for ${name}`);
>       })
>     },
>     {
>       name: 'Item 2',
>       showAlert: action(function*() {
>         const name = yield ref(relative('name'));
>         alert(`Alert for ${name}`);
>       })
>     }
>   ]
> });
>
> const myContainer = simpleContainer({
>   someItems: propTypes.list({
>     name: true,
>     showAlert: propTypes.caller()
>   })
> });
>
> const MyComponent = myContainer(({ someItems }) => (
>   <ul>
>     {someItems.map(({ name, showAlert }) => (
>       <li>
>         <p>{name}</p>
>         <button onClick={showAlert}>Show alert</button>
>       </li>
>     ))}
>   </ul>
> ));
> ```
>
> You can then call the `showAlert()` function on a specific item by just clicking on a corresponding 'Show alert' button.

## Handling asynchronous data loading

All of the examples we covered until now used synchronous data. However, real world applications rarely stick only to the data that's available on the device, but have to fetch it from some kind of remote data source. This means that the process of loading that data takes time. By default Muster React containers wait for all of the requested data to be fully loaded before issuing a render of your component. This ensures that the logic in the component can safely access all the data without worrying about `undefined` references.
The downside of this approach is that there might be a significant delay between the moment when you start your application, and the first render of your component. Consider a following example:

```jsx harmony
import muster, {
  fromPromise,
  simpleContainer,
  toNode
} from '@dws/muster-react';

const app = muster({
  user: fromPromise(() =>
    new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
      toNode({
        firstName: 'Bob',
        lastName: 'Smith'
      })
    )
  )
});

const myContainer = simpleContainer({
  user: {
    firstName: true,
    lastName: true
  }
});

const MyComponent = myContainer(({ user }) => (
  <p>
    Hello, {user.firstName} {user.lastName}
  </p>
));
```

Note that the `user` branch defined in the **global graph** has a delay of 5 seconds before it returns the user data. This means that when we render our application with `<MyComponent />` we're going to see a blank screen for about 5 seconds.
One way to improve the user experience is to use the `propTypes.defer()` prop type matcher around the `user` fields. This informs Muster React, that a given set of properties isn't necessary for correct functioning of the component, and that it can render it while they're loading. This means that by deferring `user` the MyComponent gets rendered twice:

- with `{ user: null }`
- and then (once the data is loaded) with `{ user: { firstName: 'Bob', lastName: 'Smith' } }`

Changing the `user` to be deferred introduces one edge-case we need to handle inside our component - now the component might get rendered with `user = null`, but the current implementation of `MyComponent` wouldn't like that much. Let's revisit the code then:

```jsx harmony
import muster, {
  fromPromise,
  propTypes,
  simpleContainer,
  toNode
} from '@dws/muster-react';

const app = muster({
  user: fromPromise(() =>
    new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
      toNode({
        firstName: 'Bob',
        lastName: 'Smith'
      })
    )
  )
});

const myContainer = simpleContainer({
  user: propTypes.defer({
    firstName: true,
    lastName: true
  })
});

const MyComponent = myContainer(({ user }) => {
  if (!user) {
    return <p>Loading...</p>;
  }
  return (
    <p>
      Hello, {user.firstName} {user.lastName}
    </p>
  );
});
```

Now, that's so much better. The users should be much happier seeing a Loading label, instead of a blank screen.

The `propTypes.defer()` comes with an additional feature of returning a previous value of a given node/branch when the node switches back to a **pending** value:

```jsx harmony
import muster, {
  fromPromise,
  match,
  propTypes,
  ref,
  set,
  simpleContainer,
  toNode,
  types,
  variable
} from '@dws/muster-react';

const app = muster({
  currentUser: ref('users', ref('currentUserId')),
  currentUserId: variable('1'),
  users: {
    [match(types.string, 'userId')]: fromPromise(({ userId }) =>
      new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
        toNode({
          firstName: `First name of user ${userId}`,
          lastName: `Last name of user ${userId}`
        })
      )
    )
  }
});

const myContainer = simpleContainer({
  currentUser: propTypes.defer({
    firstName: true,
    lastName: true
  }),
  setCurrentUserId: propTypes.setter('currentUserId')
});

const MyComponent = myContainer(
  ({ currentUser, setCurrentUserId }) => {
    if (!currentUser) {
      return <p>Loading...</p>;
    }
    return (
      <section>
        <p>
          {currentUser.firstName} {currentUser.lastName}
        </p>
        <button onClick={() => setCurrentUserId('2')}>
          Set currentUserId=2
        </button>
      </section>
    );
  }
);
```

The example above serves to illustrate a problem with the use of a `null` value of a `propTypes.defer()` to check if a component is loading data. At the beginning we get two renders:

- `{ currentUser: null }`
- `{ currentUser: { firstName: 'First name of user 1', lastName: 'Last name of user 1' } }`
  The problem begins when a user clicks on the `Set currentUserId=2` button. The `currentUser` property doesn't go back to `null`, because the correct behaviour for the `propTypes.defer()` is to return the previous value of a given property, or `null` when there was no previous value. This means that our component is rendered with **stale** data for 5 seconds, and then it gets re-rendered with new properties - the loading state is completely skipped here.
  The way to improve this behaviour is to use another type of a prop type matcher: `propTypes.isLoading()`. This prop type matcher works by checking if another deferred property (with a given relative name) is loading. It resolves to either `true` when the deferred property is loading data, or to `false` when it's no longer loading data:

```javascript
const myContainer = simpleContainer({
  firstName: propTypes.defer(true),
  isLoadingFirstName: propTypes.isLoading('firstName')
});
```

> The name argument used in the `isLoading()` function refers to a sibling property, and not to the name of the branch in the graph.

Going back to our original example. Let's improve the experience by utilising the `propTypes.isLoading()` prop type matcher:

```jsx harmony
import muster, {
  fromPromise,
  match,
  propTypes,
  ref,
  set,
  simpleContainer,
  toNode,
  types,
  variable
} from '@dws/muster-react';

const app = muster({
  currentUser: ref('users', ref('currentUserId')),
  currentUserId: variable('1'),
  users: {
    [match(types.string, 'userId')]: fromPromise(({ userId }) =>
      new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
        toNode({
          firstName: `First name of user ${userId}`,
          lastName: `Last name of user ${userId}`
        })
      )
    )
  }
});

const myContainer = simpleContainer({
  isLoading: propTypes.isLoading('currentUser'),
  currentUser: propTypes.defer({
    firstName: true,
    lastName: true
  }),
  setCurrentUserId: propTypes.setter('currentUserId')
});

const MyComponent = myContainer(
  ({ currentUser, isLoading, setCurrentUserId }) => {
    if (isLoading) {
      return <p>Loading...</p>;
    }
    return (
      <section>
        <p>
          {currentUser.firstName} {currentUser.lastName}
        </p>
        <button onClick={() => setCurrentUserId('2')}>
          Set currentUserId=2
        </button>
      </section>
    );
  }
);
```

## Handling errors

All examples we covered up to this point assumed that the code we wrote never encounters an error. It's not exactly the case when building real-world apps, as most of the times it requires interfacing with some kind of a back-end. This introduces additional points of failure, e.g. a server goes offline, the network is down or has a high latency, etc.
In these cases one can't rely on the nodes returning correct data 100% of the time. When something goes wring, an error is being returned from a node, and all manner of bad things can happen when a component doesn't handle it. In development mode, Muster React renders a red box with a caught error, which should be helpful with debugging, but in a production mode the only thing you're going to get is a blank screen.
This section is going to cover another type of a prop type matcher - `propTypes.catchError()`. It is used to surround a given property/branch/list with something that works like a `try ... catch` block in JavaScript.
Let's start with an example of a component that requests a node that resolves to an error:

```jsx harmony
import muster, { error, simpleContainer } from '@dws/muster-react';

const app = muster({
  description: error('Something went wrong')
});

const myContainer = simpleContainer({
  description: true
});

const MyComponent = myContainer(({ description }) => (
  <p>{description}</p>
));
```

Trying to render the `MyComponent` in the dev mode will only result in a red box being rendered with the `Something went wrong` error being displayed in it, instead of actually rendering the `MyComponent`.

Such error can be caught with the help of the `propTypes.catchError()`:

```jsx harmony
import muster, {
  error,
  propTypes,
  simpleContainer
} from '@dws/muster-react';

const app = muster({
  description: error('Something went wrong')
});

const myContainer = simpleContainer({
  description: propTypes.catchError(
    'Could not load description',
    true
  )
});

const MyComponent = myContainer(({ description }) => (
  <p>{description}</p>
));
```

This example uses a string as a fallback value for the `propTypes.catchError()`, but you can use any value you like. Additionally, the fallback for the `propTypes.catchError()` can also be defined as a fallback generator function. This function is called with `error` and `previousValue` arguments (in this order), and is supposed to return a fallback node, or original error.

## Local container graph - `container()`

As I mentioned in the **What is Muster React** section, Muster React components can have their own, isolated Muster graphs for storing local component state. The `simpleContainer()` we used in previous examples does not have this ability, as it's used for connecting directly with the **global graph**. This is where the `container()` comes in. It supports all the prop types we've covered before (`getter()`, `setter()`, `caller()`, etc.), but the query that is produced by these props is always run against the **local graph**. The **local graph** can use references to the **global graph** (with the use of `ref(global()))`.
Let's start by making a simple `container()`:

```jsx harmony
import muster, { container } from '@dws/muster-react';

const app = muster({
  // Empty global graph
});

const myContainer = container({
  graph: {
    // Local graph
    firstName: 'Bob',
    lastName: 'Smith'
  },
  props: {
    // container props, just like in simpleContainer()
    firstName: true,
    lastName: true
  }
});

const MyComponent = myContainer(({ firstName, lastName }) => (
  <p>
    {firstName} {lastName}
  </p>
));
```

The container created in this example declares a local graph with two branches: `firstName` and `lastName`, which are then requested in the `props` section of the container. The `props` section is what we used to declare when making containers with the use of `simpleContainer()`.
Note that the global graph has no data now. This is because all of the data required by the container is available in its local graph. Let's change that by moving it into the global graph:

```jsx harmony
import muster, { container, global, ref } from '@dws/muster-react';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith'
});

const myContainer = container({
  graph: {
    // Local graph
    firstName: ref(global('firstName')),
    lastName: ref(global('lastName'))
  },
  props: {
    // container props, just like in simpleContainer()
    firstName: true,
    lastName: true
  }
});

const MyComponent = myContainer(({ firstName, lastName }) => (
  <p>
    {firstName} {lastName}
  </p>
));
```

In this example you can spot a use of a `ref(global())` syntax, which tells Muster to make a reference to a global graph. In the local graph you can normally use the `ref()` nodes, but they will be referencing nodes in your local graph.
To make a reference to the global graph from the local graph you must use the `ref(global())`.

The two following examples serve to illustrate the difference between storing the data in the global graph, and storing the data in the local graph. First, let's start with an example where the data is stored in the global graph:

```jsx harmony
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import muster, {
  container,
  global,
  propTypes,
  Provider,
  ref,
  variable
} from '@dws/muster-react';

const app = muster({
  isChecked: variable(false)
});

const myContainer = container({
  graph: {
    isChecked: ref(global('isChecked'))
  },
  props: {
    isChecked: true,
    setIsChecked: propTypes.setter('isChecked')
  }
});

const MyComponent = myContainer(({ isChecked, setIsChecked }) => (
  <input
    type="checkbox"
    onClick={() => setIsChecked(!isChecked)}
    value={isChecked}
  />
));

ReactDOM.render(
  <Provider muster={app}>
    <div>
      <p>
        First checkbox <MyComponent />
      </p>
      <p>
        Second checkbox <MyComponent />
      </p>
    </div>
  </Provider>
);
```

The application rendered by this code behaves in a way that checking the `First checkbox` automatically marks the `Second checkbox` as checked. This might be a useful behaviour in some cases, but not for other.
Now, let's take a look at the same example but with the `isChecked` variable located in the local graph:

```jsx harmony
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import muster, {
  container,
  propTypes,
  Provider,
  variable
} from '@dws/muster-react';

const app = muster({
  // Empty graph
});

const myContainer = container({
  graph: {
    isChecked: variable(false)
  },
  props: {
    isChecked: true,
    setIsChecked: propTypes.setter('isChecked')
  }
});

const MyComponent = myContainer(({ isChecked, setIsChecked }) => (
  <input
    type="checkbox"
    onClick={() => setIsChecked(!isChecked)}
    value={isChecked}
  />
));

ReactDOM.render(
  <Provider muster={app}>
    <div>
      <p>
        First checkbox <MyComponent />
      </p>
      <p>
        Second checkbox <MyComponent />
      </p>
    </div>
  </Provider>
);
```

The application rendered by this code disconnects the checked state of the `First checkbox` from the `Second checkbox`.

## Custom loading and error behaviour

The `container()` function comes with two additional properties, not available in the `simpleContainer()` function:

- `renderLoading` - defines a custom function called when the component's goes into a pending state. This can be triggered before the first render, or when the component's graph changes, which causes an asynchronous data load. The function takes external component props, and is expected to return a React element to render in place of the component.
- `renderError` - similar to `renderLoading`, this function gets called whenever the props requested by the component resolve to an error. The function takes an array of errors and external component props, and is expected to return a React element to render in place of the component.

## Final words

Now you're ready to build some apps with Muster and Muster React. This tutorial covered only the basic features of Muster React, which should get you started with it, but there's a lot more features described in the Muster React API docs.
