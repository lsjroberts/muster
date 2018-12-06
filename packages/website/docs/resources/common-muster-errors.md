---
id: common-muster-errors
title: Common Muster Errors
---

This document serves as a directory of common errors you might encounter when using Muster, what do they mean, and how to fix them.


## Invalid query: missing child fields

This error happens when a `query()` node requests a particular node as a leaf, while in the graph it is defined as a node that supports a `getChild` operation:
```js
import muster, { query, root } from '@dws/muster';

const app = muster({
  user: {
    firstName: 'Bob',
    lastName: 'Smith',
  },
});

// Resolving this query results in an error
await app.resolve(query(root(), {
  user: true, // Requesting user as a leaf
}));
```
The way to fix this is to explicitly define your query:
```js
// Requesting only the first name of the user
await app.resolve(query(root(), {
  user: {
    firstName: true,
  },
}));
``` 


## Invalid query: missing list item fields

This error happens when a `query()` node requests a particular node as a leaf, while in the graph it is defined as a node that supports a `getItems` operation:
```js
import muster, { query, root } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3],
});

// Resolving this query results in an error
await app.resolve(query(root(), {
  numbers: true,
}));
```
The way to fix this is to explicitly define your query:
```js
import { entries } from '@dws/muster';

await app.resolve(query(root(), {
  numbers: entries(),
}));
```


## A node returned from a computed doesn't get resolved when the dependency of a computed changes

This one isn't exactly an error you will see in the browser console, but a behaviour that might get you by surprise.
Consider the following code:
```js
import muster, { computed, dispatch, on, ref, series, set, variable } from '@dws/muster';

const app = muster({
  onNameChanged: on((event) => {
    if (event.type === 'name-changed') {
      console.log('Name changed');      
    }
    return true;
  }, true),
  name: variable('initial'),
  monitorName: computed([ref('name')], () => {
    console.log('resolving monitorName');
    return series([
      dispatch('name-changed'),
      value(undefined),
    ]);
  }),
});

// Make sure the name is monitored
app.resolve(ref('monitorName')).subscribe(() => {});

console.log('Setting name to `updated`');
await app.resolve(set('name', 'updated'));

// Console output:
// resolving monitorName
// Name changed
// Setting name to `updated`
// resolving monitorName
```
The code above is supposed to log `Name changed` every time a `name-changed` event is dispatched. The `name-changed` is dispatched from the `monitorName` node every time the `name` node emits a new value.
The expected console output would look like this:
```js
// Console output
// resolving monitorName
// Name changed
// Setting name to `updated`
// resolving monitorName
// Name changed
```
However, as you can see the final `Name changed` is missing from the output in our example code. The reason for that is the node returned from `monitorName` is the same very time the `name` changes. When a node is returned from a computed node Muster does a check if its hash is the same as before the change, and stops execution when it is the same.

The way to fix this is by somehow making the return value different, for example:
```js
monitorName: computed([ref('name')], (name) => {
  console.log('resolving monitorName');
  return series([
    dispatch('name-changed'),
    value(name),
  ]);
})
```

## Target node does not support the "getChild" operation

This error might be caused by multiple things:

1. **The most likely case** - A misspelled `ref()`:
    ```js
    const app = muster({
      user: {
        firstName: 'Bob',
      },
      users: array([/* ... */]),
    });
    // Note that the ref() in the query is pointing to `users`, instead of `user`.
    await app.resolve(query(ref('users'), {
      firstName: true,
    }))
    ```
2. A node in the graph has a different type than expected:
    ```js
    const app = muster({
      user: value({
        firstName: 'Bob',
      }),
    });
    // Note that the `user` is a value node, which doesn't support `getChild` operation.
    await app.resolve(query(ref('user'), {
      firstName: true,
    }));
    ```
    
## Invalid child key: <<key_name>>

There are two possible reasons for this particular error:

1. A misspelled `ref()`, name of the `get()` or invalid key in the `query()` node:
    ```js
    const app = muster({
      user: {
        firstName: true,     
      },
    });
    
    // Note that the `firstname` should be spelled as `firstName`
    await app.resolve(ref('user', 'firstname'));
 
    // Again, `firstname` should be spelled as `firstName`
    await app.resolve(get(root(), ['user', 'firstname']));
 
    // The final example of misspelled `firstname`
    await app.resolve(query(root(), {
      user: {
        firstname: true,     
      },
    }));
    ```
2. A requested path does not exist in the graph.
