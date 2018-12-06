---
id: scope
title: Scope
---

Like most programming languages, muster has a concept of scope. In Muster, scopes are used to create a self-contained parts of a graph, that have no access to the "outside world" apart from the nodes that are explicitly injected to it. Take a look at these examples, first without a scope:
```javascript
import muster, { ref } from '@dws/muster';

const app = muster({
  someValue: 'top-level value',
  nested: {
    someValue: 'nested value',
    refToSomeValue: ref('someValue'),
  },
});

const result = await app.resolve(ref('nested', 'refToSomeValue'));
console.log(result);

// Console output:
// top-level value
```
And now for an example with `scope()`:
```javascript
import muster, { ref, scope } from '@dws/muster';

const app = muster({
  someValue: 'top-level value',
  nested: scope({
    someValue: 'nested value',
    refToSomeValue: ref('someValue'),
  }),
});

const result = await app.resolve(ref('nested', 'refToSomeValue'));
console.log(result);

// Console output:
// nested value
```
Even though the definition of the graph hasn't changed much between examples, the output changed quite significantly. This is due to the fact that the `scope()` node begins a new graph, and all refs used within that scope start their traversal from the root of that scope, and not from the root of the graph as they usually do.
This behaviour is quite useful when making self-contained pieces of logic, and it makes sure that the logic you build doesn't depend on its place in the graph.

The `scope()` node doesn't have to be completely isolated from the graph it is used in. This is where the `context()` node comes in.
While defining a scope, you can inject some context values into your scope. These context values retain their connection to the original graph, and so they also re-emit values when the value of an original node changed:
```javascript
import muster, { context, ref, scope, variable } from '@dws/muster';

const app = muster({
  firstName: variable('Bob'),
  myScope: scope(
    {
      greeting: computed(
        [context('userFirstName')],
        (firstName) => `Hello, ${firstName}!`,
      ),
    },
    {
      // The key doesn't have to be the same as the field it points to
      userFirstName: ref('firstName'),
    },
  ),
});

app.resolve(ref('myScope', 'greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Setting `firstName`')
await app.resolve(set('firstName', 'Jane'));

// Console output:
// Hello, Bob!
// Setting `firstName`
// Hello, Jane!
```
As before, the first argument of the `scope()` node defines the scoped graph, but now we're also specifying the second argument, which defines a map between context name and a node that should be resolved in the graph in which the `scope()` node is defined in.
