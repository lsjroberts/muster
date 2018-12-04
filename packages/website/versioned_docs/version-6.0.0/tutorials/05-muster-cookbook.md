---
id: version-6.0.0-muster-cookbook
title: Muster Cookbook
original_id: muster-cookbook
---

The goal of this page is to collect useful snippets you can adapt and use in your apps. These snippets are for pure Muster. They're designed in a way which should allow you to quickly adapt them to your requirements.

## Get a single item from a filtered collection

The following code shows how to get a single item from a filtered collection. The filter used in this example can be adapted to your needs.

```js
import muster, {
  applyTransforms,
  filter,
  get,
  head,
  query,
  ref,
  startsWith,
  variable
} from '@dws/muster';

// Create Muster graph with an example collection
const app = muster({
  todos: [
    {
      id: 1,
      description: 'Do first thing',
      completed: variable(false)
    },
    {
      id: 2,
      description: 'Do second thing',
      completed: variable(false)
    },
    {
      id: 3,
      description: 'Do third thing',
      completed: variable(false)
    }
  ]
});

// Find the item with a description that starts with 'Do second'
await app.resolve(
  query(
    head(
      applyTransforms(ref('todos'), [
        filter((item) =>
          startsWith('Do second', get(item, 'description'))
        )
      ])
    ),
    {
      id: true,
      description: true,
      completed: true
    }
  )
);
// === {
//   id: 2,
//   description: 'Do second thing',
//   completed: false,
// }
```

The first part of the example includes imports, and a declaration of a Muster graph. Below that we resolve a `query()` node (used here just to get specific branches of the returned node). The target for that `query()` is a construct that allows us to get the first item from the filtered collection. The filter we used here checks if the description of the item in question starts with `'Do second'`, but you can change the filter to anything you want.

## Remove a specific item from a collection

The code below shows how to remove a single item from a collection that matches specific criteria:

```js
import muster, {
  and,
  applyTransforms,
  arrayList,
  eq,
  filter,
  get,
  head,
  ref,
  removeItem
} from '@dws/muster';

// Create Muster graph with an example collection
const app = muster({
  people: arrayList([
    { firstName: 'Bob', lastName: 'Smith' },
    { firstName: 'Kate', lastName: 'Doe' }
  ])
});

// Remove a person with firstName='Bob' and lastName='Smith'
await app.resolve(
  removeItem(
    ref('people'),
    head(
      applyTransforms(ref('people'), [
        filter((person) =>
          and(
            eq(get(person, 'firstName'), 'Bob'),
            eq(get(person, 'lastName'), 'Smith')
          )
        )
      ])
    )
  )
);
```

In this particular example the person we'd like to remove has `firstName = 'Bob'` and `lastName = 'Smith'`, but you can adapt the filter to something that suits your requirements.

## Perform an operation on each item from a collection - forEach()

This recipe demonstrates how to run an operation on each item from a collection. It behaves in a similar way to the `forEach()` from lodash.
This particular recipe goes through every item on our todos collection and sets `completed` to `true`, but you can easily adapt the code to do other things as well.

```js
import muster, {
  applyTransforms,
  entries,
  get,
  map,
  query,
  ref,
  set,
  variable
} from '@dws/muster';

// Create Muster graph with an example collection
const app = muster({
  todos: [
    {
      id: 1,
      description: 'Do first thing',
      completed: variable(false)
    },
    {
      id: 2,
      description: 'Do second thing',
      completed: variable(false)
    },
    {
      id: 3,
      description: 'Do third thing',
      completed: variable(false)
    }
  ]
});

// Set every task as completed
// We don't really care about the result of resolving this node, but just about its effect on the items of the collection
await app.resolve(
  query(
    applyTransforms(ref('todos'), [
      map((item) => set(get(item, 'completed'), true))
    ]),
    entries()
  )
);
```

At the beginning of the example we define a sample collection of todos. Once the Muster graph is ready we resolve a node which should go and set every item as completed.

Let's start by looking first at a definition of the `applyTransforms()` node used as part of that `query()` node. The source for that collection is a `ref()` that points to the todos collection in the application graph. Then we define an array of transforms to do on that collection, which contains a single transform - `map()`. This transform maps every item to a `set()` node. On its own resolving such collection wouldn't do much, as Muster wouldn't actually resolve these `set()` nodes:

```js
// This won't work, as the applyTransforms() node doesn't support evaluate operation, and in this case the collection would get returned unchanged.
await app.resolve(
  applyTransforms(ref('todos'), [
    map((item) => set(get(item, 'completed'), true))
  ])
);
```

This is why we had to wrap the `applyTransforms()` node in a `query()` node with `entries()`. This lets Muster know that it should resolve the node as a collection, and that it should also resolve each item to a static node. Due the fact that the `set()` nodes returned from the `map()` transform are not static, Muster will try resolving them, which causes the `completed` variable to be set to `true`.

One thing to note is that the result of that query is actually an `array()` node with following values: `array([true, true, true])`, cos that's a result of the `set()` node for each item.

## Using relative references inside collection items

Muster comes bundled with a `relative()` utility which when combined with `ref()` node allows accessing siblings of a given node. It might not be that obvious, but this pattern can also be used inside a collection item. This recipe serves to illustrate this particular use case:

```js
import muster, {
  computed,
  entries,
  query,
  ref,
  relative
} from '@dws/muster';

const app = muster({
  people: [
    {
      firstName: 'Bob',
      lastName: 'Smith',
      fullName: computed(
        [ref(relative('firstName')), ref(relative('lastName'))],
        (firstName, lastName) => `${firstName} ${lastName}`
      )
    },
    {
      firstName: 'Kate',
      lastName: 'Doe',
      fullName: computed(
        [ref(relative('firstName')), ref(relative('lastName'))],
        (firstName, lastName) => `${firstName} ${lastName}`
      )
    }
  ]
});

await app.resolve(
  query(ref('people'), entries({ fullName: true }))
);
// == [
//   { fullName: 'Bob Smith' },
//   { fullName: 'Kate Doe' },
// ]
```
