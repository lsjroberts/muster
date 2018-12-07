---
id: version-6.5.0-variables
title: Variables
original_id: variables
---

So far, the graphs in this tutorial have all had immutable state. The `variable()` node can be used to store a mutable state in the graph, allowing branches to be modified at runtime.

```javascript
import muster, { ref, variable } from '@dws/muster';

const person = muster({
  user: {
    firstName: 'Bob',
    lastName: 'Smith',
  }
  age: variable(35),
});

const result = await person.resolve(ref('age'));
console.log(result);

// Console output:
// 35
```
Variables can be referred to, just like `value()` nodes. This is because `variable()` does [implicit conversion][1] of its argument to **nodes**, so `variable(35)` becomes `variable(value(35))`.

Muster's resilience means that not only `value()` nodes can be stored in `variable()`, other nodes that may need to be modified can also be stored in `variable()` such as the string formatter node `format()`.

## Setters
To modify a `variable()` in Muster, it's necessary to use a specific node - `set()`.

- `set()` takes two arguments:
  * Arg 1 - A reference to a node to be modified.
  * Arg 2 - A target value to set it to.
```javascript
import muster, { ref, set, variable } from '@dws/muster';

const person = muster({
  user: {
    firstName: 'Bob',
    lastName: 'Smith',
  },
  age: variable(35),
});

let result = await person.resolve(ref('age'));
console.log('Before set:', result);

await person.resolve(set('age', 100));

result = await person.resolve(ref('age'));
console.log('After set:', result);

// Console output:
// Before set: 35
// After set: 100
```
To `set()` a nested element in the graph, pass in a `ref()` node pointing to the variable you wish to set.

```javascript
import muster, { ref, set, variable } from '@dws/muster';

const person = muster({
  user: {
    firstName: variable('Bob'),
    lastName: 'Smith',
  },
  age: variable(35),
});

let result = await person.resolve(ref('user', 'firstName'));
console.log('Before set:', result);

await person.resolve(set(ref('user', 'firstName'), 'Steve'));

result = await person.resolve(ref('user', 'firstName'));
console.log('After set:', result);

// Console output:
// Before set: Bob
// After set: Steve
```
## Modifying Variables with Arithmetic Nodes
`set()` isn't the only way to modify a variable. Operations like `increment()` and `decrement()` are [useful nodes][2] for numbers should you want to modify them as opposed to setting them outright.

Nodes like `add()` and `subtract()`, however, can be used to compute the result of an arithmetic operation, which can be assigned to a `variable()`.

For example:
```javascript
import muster, { add, increment, ref, variable } from '@dws/muster';

const person = muster({
  user: {
    firstName: 'Bob',
    lastName: 'Smith',
  },
  age: variable(35),
});

let result = await person.resolve(ref('age'));
console.log('Before arithmetic:', result);

await person.resolve(increment('age'));

result = await person.resolve(ref('age'));
console.log('After increment:', result);

const additionResult = await person.resolve(add(ref('age'),14));
await person.resolve(set('age', additionResult));
result = await person.resolve(ref('age'));
console.log('After addition:', result);
// Console output:
// Before arithmetic: 35
// After increment: 36
// After addition: 50
```
## Resetting Variables
In Muster, using the `reset()` node, it's possible to reset a variable to its original value:
```javascript
import muster, { ref, reset, set, variable } from '@dws/muster';

const person = muster({
  user: {
    firstName: variable('Bob'),
    lastName: 'Smith',
  },
  age: variable(35),
});

let result = await person.resolve(ref('user', 'firstName'));
console.log('Before set:', result);

await person.resolve(set(ref('user', 'firstName'), 'Steve'));

result = await person.resolve(ref('user', 'firstName'));
console.log('After set:', result);

await person.resolve(reset('user', 'firstName'));

result = await person.resolve(ref('user', 'firstName'));
console.log('After reset:', result);

// Console log:
// Before set: Bob
// After set: Steve
// After reset: Bob
```
## Subscriptions
One of Muster's strengths is that it processes the data in a reactive way. This means that the graph, and by extension the nodes embedded in it can react to changes in their dependencies. Muster can make use of the `subscribe()` function to execute arbitrary code upon a variable changing:
```javascript
import muster, { ref, set, variable } from '@dws/muster';

const app = muster({
  greeting: variable('Hello, world!'),
});

console.log('Subscribing to `ref(\'greeting\')`');
app.resolve(ref('greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Setting `greeting`...');
await app.resolve(set('greeting', 'Goodbye, world!'));

// Console output:
// Subscribing to `ref('greeting')`
// Hello, world!
// Setting `greeting`...
// Goodbye, world!
```
[1]: /muster/docs/understanding-muster/03-explicit-definition
[2]: /muster/docs/resources/04-essentials
