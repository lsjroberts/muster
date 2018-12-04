---
id: resolution-chains
title: Resolution Chains
---

When resolving the values of nodes, Muster follows a series of resolutions as it may find nodes which refer to other nodes or perform calculations. This series of resolutions is a ***'resolution chain'***. The resolution chain is the explicit steps Muster takes from a reference to a node to output of that reference.

Consider the following example:
```javascript
import muster, { ref } from '@dws/muster';

const app = muster({
  greeting: 'Hello world',
  refToGreeting: ref('greeting'),
});

const result = await app.resolve(ref('refToGreeting'));
console.log(result);

// Console output:
// Hello world
```
The node that is wired to the output is `ref('refToGreeting')`, however this isn't what is used *as* the output. The `ref()` node isn't a static node, Muster resolves it as (`ref('greeting')`), and that finally leads to the `'Hello world'`, which is a static node, and therefore an acceptable output.
The resolution chain in this case looks like this:
  - `ref('refToGreeting')` -> `ref('greeting')`
  - `ref('greeting')` -> `'Hello world'`
  - `'Hello world'` <--- Static node; use this as output

When using more complex graphs, such as one with a `format()` node which is dependant on other nodes, it's useful to know the order in which the nodes are resolved to deliver the final output.

Consider the following example:
```javascript
import muster, { format, ref } from '@dws/muster';

const app = muster({
  subject: 'Dear reader',
  greeting: format('Hello, ${thisSubject}!',{
    thisSubject: ref('subject'),
  }),
});

const greeting = await app.resolve(ref('greeting'));
console.log(greeting);

// Console output:
// Hello, Dear reader!
```
And here is the resolution chain:
- `ref('greeting')` -> `format()`
- `format('Hello, ${thisSubject}!',{ ... })` - Can't be resolved yet as it depends on `thisSubject`
    - `thisSubject` -> `ref('subject')`
    - `ref('subject')` -> `'Dear reader'`
- going back to `format('Hello, ${thisSubject}!',{ ... })` -> `'Hello, Dear reader!'`
- `'Hello, Dear reader!'` <--- Static node; use this as output

The resolution chain seems complicated, but this highlights how Muster handles dependencies, and the order in which nodes are resolved.

**One thing to remember is that the dependencies are resolved before the node that depends on them.**
