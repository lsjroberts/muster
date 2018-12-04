---
id: control-flow
title: Control Flow
---
As with most languages, Muster has nodes that support flow of control of function calls and assignments through the use of `ifElse()` statements and `choose()-when()` and `switch()` cases. These nodes allow a program to conditionally execute code in different ways.
## IfElse-Statements
The `ifElse()` node works in three parts when called:
- In the `if:` branch, an expression is evaluated for truthiness.
- If the expression resolves to being 'truthy', the code at the `then:` branch is executed.
- If the expression resolves to being 'falsy', the code at the `else:` branch is executed.

For example, an `ifElse()` with a boolean expression:
```javascript
import muster, { ifElse, ref, set, variable } from '@dws/muster';

const app = muster({
  isLoggedIn: variable(false),
  greeting: ifElse({
    if: ref('isLoggedIn'),
    then: 'Hello, logged-in user!',
    else: 'Hello, guest!',
  }),
});

app.resolve(ref('greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Logging in');
await app.resolve(set('isLoggedIn', true));

// Console output:
// Hello, guest!
// Logging in
// Hello, logged-in user!
```
And another example, this time evaluating 'truthiness':
```javascript
import muster, { ifElse, ref, set, variable } from '@dws/muster';

const app = muster({
  name: variable(''),
  greeting: ifElse({
    if: ref('name'),
    then: format(`Your name is: ${localName}`,{
      localName: ref('name'),
    }),
    else: 'You have no name!',
  }),
});

app.resolve(ref('greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Assigning name');
await app.resolve(set('name', 'Bob'));

// Console output:
// You have no name!
// Assigning name
// Your name is Bob
```
In this example, when the `name` `variable()` is empty, the `ifElse()` node interprets this as 'falsy', so the `else:` branch is called. When a name is assigned, it is then interpreted as 'truthy', so the `then:` branch is called.

## Switch Cases
There may be some cases where you're expecting multiple specific values when checking against some criteria. In this instance, `switchOn()` will solve this problem.
- The first argument of `switchOn()` is a `ref()` to the node that is being evaluated.
- The second argument of `switchOn()` is an array of one or more `when()` nodes specifying conditions and an `otherwise()` node. `when()` nodes each come with two arguments
  * The first argument of `when()` is the value being assessed.
  * The second argument of `when()` is what is returned if the first argument resolves true.
- The `otherwise()` node dictates what is returned if there are no `when()` statements that resolve true.
```javascript
import muster, { otherwise, ref, set, switchOn, variable, when } from '@dws/muster';

const app = muster({
  name: variable(''),
  greeting: switchOn(ref('name'), [
    when('Hank', 'Hi, Dad!'),
    when('Peggy', 'Hi, Mom!'),
    otherwise('That`s my purse, I don`t know you!')
  ])
});

app.resolve(ref('greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Assigning name');
await app.resolve(set('name', 'Hank'));

// Console output:
// That's my purse, I don't know you!
// Assigning name
// Hi, Dad!
```
`switchOn()` can only evaluate values against one specific reference node. To perform a conditional check on the values of multiple nodes, choose `choose()`.
## Choose-When
`choose()` is similar to `switchOn()` except each `when()` node carries its own independent conditional statement.
- The only argument `choose()` has is an array of one or more `when()` nodes followed by an `otherwise()` node.
- Each `when()` node carries two arguments
  * The first argument is an expression that resolves to a 'truthy' or 'falsy' value.
  * The second argument is what is returned if the first argument resolves to 'truthy'.
- If multiple `when()` nodes resolve to 'truthy', the one which occurs first will be executed.
- If all `when()` nodes resolve to 'falsy', the `otherwise()` node will be executed.

```javascript
import muster, { eq, choose, otherwise, ref, variable, when } from '@dws/muster';

const app = muster({
  disaster: {
    monster: variable('Godzilla'),
    tidalWave: variable(true),
  },
  fate: choose([
    when(eq(ref('disaster','monster'), 'Godzilla'), 'It`s Godzilla, We`re doomed!'),
    when(eq(ref('disaster','tidalWave'), true), 'It`s a tidal wave, We`re doomed!'),
    otherwise('We`re saved!'),
  ]),
});

app.resolve(ref('fate')).subscribe((result2) => {
  console.log(result2);
});

console.log('Slaying monster');
await app.resolve(set(ref('disaster', 'monster')), '');

console.log('Breaking waves');
await app.resolve(set(ref('disaster', 'tidalWave')), false);
// Console output:
// It`s Godzilla, We`re doomed!
// Slaying monster
// It`s a tidal wave, We`re doomed!
// Breaking waves
// We`re saved!
```
