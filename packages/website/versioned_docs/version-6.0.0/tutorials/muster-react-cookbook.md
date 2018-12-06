---
id: version-6.0.0-muster-react-cookbook
title: Muster React Cookbook
original_id: muster-react-cookbook
---

The goal of this page is to collect useful snippets you can adapt and use in your apps. These snippets are for Muster-React. They're designed in a way which should allow you to quickly adapt them to your requirements.

## Forcing the render of a component even if its container data is loading

By default Muster-React tries to play it safe, and doesn't render your component when the data hasn't been fully loaded. This is done so that the component logic which depends on particular pieces of data to be present wouldn't find unexpected `undefined` in place of expected data. You can however overwrite this behaviour, and instruct Muster-React to render your component even if the data is loading. To do this you must use `container()` function (`simpleContainer()` doesn't have this feature), and set `renderLoading: true`:

```jsx harmony
import { container, fromPromise } from '@dws/muster-react';

function MyComponent({ user }) {
  // Watch out, cos user might be undefined!
  return (
    <section>
      {user && (
        <h1>
          {user.firstName} {user.lastName}
        </h1>
      )}
    </section>
  );
}

const MyContainer = container({
  graph: {
    user: fromPromise(() => fetch('https://some.api.com/user'))
  },
  props: {
    user: {
      firstName: true,
      lastName: true
    }
  },
  renderLoading: true
});
```

Note that in the `MyComponent()` function we're explicitly checking if user is not undefined. In larger components this might be a bit cumbersome, so that's why the `renderLoading` enables one more way of enabling a loading state - it can also take a function with a single argument (last props) and is supposed to return a component to render. Armed with that knowledge let's improve that example a bit:

```jsx harmony
import { container, fromPromise } from '@dws/muster-react';

function MyComponent({ isLoading, user }) {
  // Watch out, cos user might be undefined!
  return (
    <section>
      {!isLoading <h1>{user.firstName} {user.lastName}</h1>}
    </section>
  );
}

const MyContainer = container({
  graph: {
    user: fromPromise(() => fetch('https://some.api.com/user')),
  },
  props: {
    user: {
      firstName: true,
      lastName: true,
    },
  },
  renderLoading: (props) => <MyComponent {...props} isLoading />,
});
```

The `isLoading` property we now passed into the `MyComponent` will now inform us if any piece of data is in the process of being loaded. The downside of this approach is that it creates a dependency between the `MyContainer` and `MyComponent`, and could cause potential problems with unit testing.

**Ideally when the component is meant to be rendered even when the data is being loaded you should use `propTypes.defer` and `propTypes.isLoading`.**

> **Note:** The loading state of the component is not affected by the `propTypes.defer()` prop type. Any time a deferred property goes into a loading state the component remains in a fully-loaded state. This means that when deferred node switches from resolved to pending state, the `renderLoading` function is not going to get called.

## Optional prop transforms

You may sometimes need to perform arbitrary logic between retrieving data from a graph and injecting it as props into your component. For just this occasion, `container` offers a second parameter after its configuration hash: the Prop Transform function.

```jsx harmony
// ...
export default container(
  {
    graph: {
      results: ref(global('search', 'results')),
      loading: ref(global('search', 'loading'))
    },
    props: {
      results: types.array,
      loading: types.bool
    }
  },
  (props) => {
    // property transform function
    if (props.loading) {
      return {
        ...props,
        results: [] // overwriting the value of the results prop
      };
    }
    return props; // returning as normal
  }
)(SearchResultsComponent);
```

Here you can see an example where if for any reason the value of `loading` is truthy, the `results` prop will always be set to an empty array on injection into the target component.

> There are better ways to track loading state than with a separate graph key -- Muster can tell when values are "pending", and Muster-React offers tools for handling loading state.

> Prop transform functions are a quick way to achieve specific results, but should be used cautiously - they're not the right place for complex or repeated business logic.

## Additional component props with `PropNode`

Typically, connected components don't take in external props -- their data requirements are satisfied by their connection to an external source (hence the name, after all). However, should the need arise (external routing framework, ephemeral data, arcane prophecy), Muster-React can help. The `prop` node lets you access an external prop from within a container's local graph.

```jsx harmony
// ...
import { container, computed, prop } from '@dws/muster-react';

function MyComponent({ greeting }) {
  console.log('Greeting:', greeting);
  // ...
}

const MyConnectedComponent = container({
  graph: {
    // here's the prop node, being used as a dependency of a computed node
    greeting: computed([prop('name')], (name) => `Hello, ${name}`)
  },
  props: {
    greeting: true
  }
})(MyComponent);

// Somewhere in another part of the application:
<MyConnectedComponent name="Bob" />;

// Console output (when rendered):
// Greeting: Hello, Bob
```

As you can see, the `prop` node can be used much the same way as a `ref` (global or otherwise), but can only (for reasons which should be obvious) be used within a container's local graph, and not the global graph.

## Rendering a `list`

It's pretty common to need to render out lists of items in your app. This is where the `list` prop definition comes in. There are a couple of different cases for it, so let's start with the simple one.

### Value lists

If you have a set of simple values, your props require minimal configuration.

```jsx harmony
// ...
import { container, propTypes } from '@dws/muster-react';

function MyComponent({ numbers }) {
  return (
    <p>
      My favourite numbers are
      {numbers.map((n) => (
        <span> {n}</span>
      ))} // pretend this is fine
    </p>
  );
}

export default container({
  graph: {
    numbers: [1, 2, 3, 4],
  },
  props: {
    numbers: propTypes.list(),
  },
});
```

[Try this example on the Muster Playground](/muster/playground/?toggles=eyJzaG93R3JhcGgiOmZhbHNlLCJzaG93UXVlcnkiOmZhbHNlLCJzaG93UXVlcnlSZXN1bHQiOmZhbHNlLCJzaG93Q29udGFpbmVyIjp0cnVlLCJzaG93VmlldyI6dHJ1ZSwic2hvd1ZpZXdSZXN1bHQiOnRydWV9&view=Iih7IG51bWJlcnMgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxwPk15IGZhdm91cml0ZSBudW1iZXJzIGFyZVxuICAgICAge251bWJlcnMubWFwKChuKSA9PiA8c3Bhbj4ge259PC9zcGFuPil9XG4gICAgPC9wPlxuICApO1xufSI%3D&containerGraph=ImNvbnRhaW5lcih7XG4gIGdyYXBoOiB7XG4gICAgbnVtYmVyczogWzEsIDIsIDMsIDRdLCAvLyB2YWx1ZSBhcnJheSwgY29udmVydGVkIHRvIGEgYGNvbGxlY3Rpb25gXG4gIH0sXG4gIHByb3BzOiB7XG4gICAgbnVtYmVyczogcHJvcFR5cGVzLmxpc3QoKSwgLy8gbm8gcGFyYW1ldGVycyByZXF1aXJlZCBhcyBrZXkgbmFtZXMgbWF0Y2hcbiAgfSxcbn0pXG4i&graph=IntcbiAgXG59Ig%3D%3D&query=IiI%3D)

In this case, the `list` declaration takes no parameters, but must match the prop name against the corresponding `data` key.

### Branch/nested lists

If your list is a collection of nested objects or branches in graph parlance, you'll need to be a little more specific.

```jsx harmony
// ...
import { container, propTypes } from '@dws/muster-react';

function MyComponent({ friends }) {
  // In this example, friends = [
  //   { firstName: 'Sylvia', lastName: 'Garcia' },
  //   { firstName: 'Carl', lastName: 'Francis' },
  //   { firstName: 'Arthur', lastName: 'Kennedy' },
  // ]
  // ...
}

export default container({
  graph: {
    friends: [
      // this array is translated to an `array()` node
      { firstName: 'Sylvia', lastName: 'Garcia', age: 48 },
      { firstName: 'Carl', lastName: 'Francis', age: 63 },
      { firstName: 'Arthur', lastName: 'Kennedy', age: 28 }
    ]
  },
  props: {
    friends: propTypes.list({
      // prop and data keys must match
      firstName: true, // nested props are defined just as elsewhere
      lastName: true
    }) // we're omitting the `age` key here
  }
})(MyComponent);
```

[Try this example on the Muster Playground](/muster/playground/?toggles=eyJzaG93R3JhcGgiOmZhbHNlLCJzaG93UXVlcnkiOmZhbHNlLCJzaG93UXVlcnlSZXN1bHQiOmZhbHNlLCJzaG93Q29udGFpbmVyIjp0cnVlLCJzaG93VmlldyI6dHJ1ZSwic2hvd1ZpZXdSZXN1bHQiOnRydWV9&view=Iih7IGZyaWVuZHMgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxwPk15IGZhdm91cml0ZSBmcmllbmRzIGFyZVxuICAgICAge2ZyaWVuZHMubWFwKChmKSA9PiA8c3Bhbj4ge2YuZmlyc3ROYW1lfSB7Zi5sYXN0TmFtZX0sIDwvc3Bhbj4pfVxuICAgIDwvcD5cbiAgKTtcbn0i&containerGraph=ImNvbnRhaW5lcih7XG4gIGdyYXBoOiB7XG4gICAgZnJpZW5kczogWyAvLyB0aGlzIGFycmF5IGlzIHRyYW5zbGF0ZWQgdG8gYSBgY29sbGVjdGlvbmBcbiAgICAgIHsgZmlyc3ROYW1lOiAnU3lsdmlhJywgbGFzdE5hbWU6ICdHYXJjaWEnLCBhZ2U6IDQ4IH0sXG4gICAgICB7IGZpcnN0TmFtZTogJ0NhcmwnLCBsYXN0TmFtZTogJ0ZyYW5jaXMnLCBhZ2U6IDYzIH0sXG4gICAgICB7IGZpcnN0TmFtZTogJ0FydGh1cicsIGxhc3ROYW1lOiAnS2VubmVkeScsIGFnZTogMjggfSxcbiAgICBdLCBcbiAgfSxcbiAgcHJvcHM6IHtcbiAgICBmcmllbmRzOiBwcm9wVHlwZXMubGlzdCh7IC8vIHByb3AgYW5kIGRhdGEga2V5cyBtdXN0IG1hdGNoXG4gICAgICBmaXJzdE5hbWU6IHRydWUsIC8vIG5lc3RlZCBwcm9wcyBhcmUgZGVmaW5lZCBqdXN0IGFzIGVsc2V3aGVyZVxuICAgICAgbGFzdE5hbWU6IHRydWUsXG4gICAgfSksIC8vIHdlJ3JlIG9taXR0aW5nIHRoZSBgYWdlYCBrZXkgaGVyZVxuICB9LFxufSlcbiI%3D&graph=IntcbiAgXG59Ig%3D%3D&query=IiI%3D)

This time, the `list` prop declaration needs a bit of config. This is very similar to handling nested data (covered above) - names must match, types are optional (for gets), and you need only include the data you want.

> It would be straightforward move this collection data to the global graph and reference it there. It's likely that most collections you handle will be in global graphs, but you can always get them up and running locally first.
