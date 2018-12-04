
## What is Muster?
So you're here, and now you're asking yourself a question "What exactly is this Muster?". Muster is a data library whose task is to:
- Collect data from multiple sources (user input, files, APIs, databases, etc.)
- Process the data in a reactive way, meaning that when the source (e.g. a file) changes, your logic that depends on that file gets re-run
- Manage dependencies between different pieces of logic,
- Expose the data and logic as a graph
- Transparently handle synchronous and asynchronous data

Every Muster application expresses its data as a set of graph nodes, which can create links (dependencies) between each other.
In future I'm going to refer to them as just **nodes** for short.

When you learned about graphs in school (or maybe you're self-taught), you might notice that every node of that graph was untyped, they just had letters or numbers to identify them, and a bunch of lines between each other.

Muster takes that concept to the next level, and introduces a concept of typed nodes, and different types of edges (we call them **operations**) between these nodes.

Fortunately, you don't have to know any of that to be able to use Muster, but is very useful when making custom types of nodes.

That description wasn't actually short, but Muster is a very powerful library, and it was hard to condense its essence to just a few words😉

## How does Muster store the data?

Now that we know what Muster is let's talk about how to store data in Muster.

As I mentioned earlier, Muster is a library that stores the data and the logic in a graph. When building your app the graph looks a bit like a tree with a root and a set of branches. The names of these branches are used to identify the nodes in the graph.

You might ask yourself "So why does he claim this is a graph, when in fact it is a tree?". A fair question! The Muster "graph" is declared as a "tree" to make it easier to write it in "JS", and to help with understanding where nodes are located in your graph, and what path they have. The "graph" part comes in when you start making connections between these nodes.

Let's start with a basic example of Muster graph:
```javascript
import muster from '@dws/muster';

const app = muster({
  greeting: 'Hello world',
});
```
The code above creates a muster application `app`. The call to the `muster()` takes a definition of your Muster graph, which can be defined explicitly, or implicitly through conversion from pure JS objects. In the case above we used a JS object with a `greeting` property, and a `Hello world` value.
This creates a Muster graph, which converts the object into a tree with a single branch called `greeting` and a value `Hello world`.

Right, so we have a simple application. Now let's get to the business of getting the value of that branch from Muster:
```javascript
import muster, { ref } from '@dws/muster';

const app = muster({
  greeting: 'Hello world',
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Hello world
```
This example introduces the first, and probably the most useful muster node `ref()`. Without going into too much details, this node is used to create links in the graph, and to create links to the output.
In this example we made a link from a node available at path `'greeting'` to the output of Muster. The path in the `ref()` node usually begins from the root of the graph tree. We'll talk about some nodes that might change that in the future, but for now we can safely assume that the path in `ref()` starts from the root of the graph.

The method `.resolve()` used here returns an object that implements both an [TC39 Observable](https://tc39.github.io/proposal-observable/) and [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) API. This means that the result can be handled as a stream, or as a promise. For simplicity we used the Promise nature of that result.

So, yeah. We're able to get a constant from the graph. This is a useful feature, but we won't build a nice TodoMVC app with just constants, right?

## How to embed logic in the Muster graph?

Up to this point I wrote only about embedding constants in the graph, and reading their values. I also introduced the first explicitly defined Muster node `ref()`. The `ref()` node can also be embedded in the graph. Consider a following example:
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
This time the node that is wired to the output is `ref('refToGreeting')`, but
the output is the same as in the previous example. This happens because Muster first resolves the `ref('refToGreeting')`, where it finds that the node that ref points to is another ref. Because of the fact that`ref()` node isn't a static node, Muster then resolves it (`ref('greeting')`), and that finally leads to the `'Hello world'`, which is a static node.
The resolution chain in this case looks like this:
  - `ref('refToGreeting')` -> `ref('greeting')`
  - `ref('greeting')` -> `'Hello world'`
  - `'Hello world'` <--- Static node; use this as output


In the previous paragraph I mentioned a concept of `static nodes`. In Muster some nodes have operations (graph edges) coming out of them, and some don't. Static nodes are a type of nodes which have no operations, and are there just as pieces of data. On the other hand, non-static nodes (dynamic and stateful) implement some operations. For example, the `ref()` node implements the `evaluate` operation, which is used by Muster as sort of default operation connecting this node with a next node. When you call `muster.resolve()` with a node, Muster will always try to traverse the `evaluate` edge if a node has one, or return the node if it doesn't.
To give you another example, a `tree()` node (implicitly created in the examples above from the JS object) is also a dynamic node, but it only implements a `getChild` operation. Calling `await muster.resolve(tree({}))` will return the same tree that was used to call `muster.resolve()`, because the `tree()` doesn't implement the `evaluate` operation.

Sorry if I made your head spin. Don't worry if this isn't clear to you yet. With practice comes perfection 😉

Anyhow, as a gift for getting this far in the tutorial I'm going to introduce you to a new Muster node, which you might find very useful. Dear reader, meet `computed()`; `computed()` meet the reader!.
```javascript
import muster, { computed, ref } from '@dws/muster';

const app = muster({
  subject: 'Dear reader',
  greeting: computed(
    [ref('subject')],
    (subject) => `Hello, ${subject}!`,
  ),
});

const greeting = await app.resolve(ref('greeting'));
console.log(greeting);

// Console output:
// Hello, Dear reader!
```
`computed()` node is a very useful node that makes a bridge between Muster
and JavaScript world. The first argument of that node takes an array of `dependencies`, and the second argument is a JS function we call `combine` function (which must be synchronous). That function is called with resolved values of dependencies, and the number of arguments corresponds to the number of dependencies. In the example above we've specified only one dependency (`ref('subject')`) so the function also takes one argument. The `combine` function can return any JS value, and any Muster node, but in the example above it made sense to return a string with a composed greeting.

Similarly to the previous example let's go through the resolution chain for this code:
  - `ref('greeting')` -> `computed()`
  - `computed([ref('subject')], () => ...)` - Can't be resolved yet as it depends on `ref('subject')`
      - `ref('subject')` -> `'Dear reader'`
  - going back to `computed(['Dear reader'], () => ...)` -> `'Hello, Dear reader!'`
  - `'Hello, Dear reader!'` <--- Static node; use this as output

The resolution chain seems a bit more complicated, but this highlights how Muster handles dependencies, and the order in which nodes are resolved. One thing to remember is that the dependencies are resolved before the the node that depends on them.

Let's do one more example of a `computed()` node, but this time with numbers:
```javascript
import muster, { computed, ref } from '@dws/muster';

const app = muster({
  three: 3,
  threePlusFive: computed(
    [ref('three'), 5],
    (left, right) => left + right
  ),
});

const result = await app.resolve(ref('threePlusFive'));
console.log(result);

// Console output:
// 8
```
The example above shows that a `computed()` node can also be used to do some math calculations. Note that the node has now two dependencies, which have to be resolved first before running the `combine` function:
  - `ref('three')`
  - `5`

I think it's the right time to tell you that `5` isn't actually what is being stored in the graph. By design, Muster graph must always store nodes, and a value `5` isn't a node. As I mentioned before, when creating `muster()` graph the `muster()` factory function performs some implicit conversion of the values passed into it. One of the implicit conversions supported by Muster is converting JS strings, numbers, boolean values, etc. into `value()` nodes.
Note that in the example above we're defining a branch `three: 3`. The `muster()` factory function converts that into a `three: value(3)`. Similar conversion is done to the object passed into the `muster()` factory:
```javascript
{
  three: 3,
  threePlusFive: computed(
    [ref('three'), 5],
    (left, right) => left + right
  ),
}
```
gets turned into
```javascript
tree({
  three: value(3),
  threePlusFive: computed(
    [ref('three'), value(5)],
    (left, right) => left + right
  ),
})
```
Spot that the object is wrapped in a `tree()` node, as well as `3` in `value()`. There's one more change that happened - the second dependency of the `computed()` node was turned into `value(5)`.

A `value()` node is static node used for storing constant pieces of data. They work in the same way as `const` keyword in JavaScript - once a constant is declared it can't be changed. In JavaScript constants containing objects allow mutating these objects, but in Muster we recommend not doing that as it might introduce inconsistencies in your applications. Muster doesn't enforce immutability of these objects, but you could use a library like [Immutable.js](https://facebook.github.io/immutable-js/) to enforce it.

## Graph variables

Another useful node to know is a `variable()` node. As the name suggests this node can be used to store a mutable state in the graph. Let's start with a simple example:
```javascript
import muster, { ref, variable } from '@dws/muster';

const app = muster({
  greeting: variable('Hello, world!'),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Hello, world!
```
As you can probably notice, the variable behaves in a similar way to a `value()` node. It's not a suriprise that it does, because `variable()` is another node that does implicit conversion of its arguments to nodes.
This means that `variable('Hello, world!')` becomes `variable(value('Hello, world!'))`. An eagle eyed reader will notice that this means that one could also construct a variable that stores a node different than a `value()`, e.g. a `computed()`:
```javascript
import muster, { computed, ref, variable } from '@dws/muster';

const app = muster({
  name: 'world',
  greeting: variable(
    computed([ref('name')], (name) => `Hello, ${name}!`),
  ),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Hello, world!
```
Note that the console output doesn't change, even though the value of the variable does. The example above doesn't represent a real-world use case for a `variable()` node, but just serves as a showcase of the potential of the composable nature of Muster nodes.

Let's go back to the previous example for a second. It shows that we can read values of the `variable()`, but says nothing about setting a new value to it. Let's change that then:
```javascript
import muster, { ref, set, variable } from '@dws/muster';

const app = muster({
  greeting: variable('Hello, world!'),
});

let result = await app.resolve(ref('greeting'));
console.log('Before set:', result);

await app.resolve(set('greeting', 'Goodbye, world!'));

result = await app.resolve(ref('greeting'));
console.log('After set:', result);

// Console output:
// Before set: Hello, world!
// After set: Goodbye, world!
```
This example introduces a new node - `set()`. The node is used to set a value of a node located at a specified path in the graph. The path of the `set()` node is supposed to be defined as a node, but as is the case with most of the Muster nodes, they come with a bunch of convenient implicit conversions. This means that `set('greeting', 'Goodbye, world!')` is equivalent to `set(ref('greeting'), value('Goodbye, world!'))`. Additionally, for longer paths you can use another shorthand `set(['deeply', 'nested', 'name'], 'Bob')`. One thing different about implicit conversion in the `set()` node compared to `muster()` function is that in `set()` the second argument is implicitly converted to a `value()` node, while in `muster()` it is converted to a `tree()`:
```javascript
set('user', { firstName: 'Bob' });
// is equivalent to
set('user', value({ firstName: 'Bob' }));

muster({ firstName: 'Bob' });
// is equivalent to
muster(tree({ firstName: value('Bob') }));
```

As I mentioned before, the one of Muster's strengths is that it processes the data in a reactive way. This means that the graph, and by extension the nodes embedded in it can react to changes in their dependencies. In all of the examples above we treated the output of `muster.resolve()` as a Promise. Now let's take a look at how to handle the output that changes over time:

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
Now, instead of calling `await app.resolve(ref('greeting'))` we subscribed to the stream emitted by the `ref('greeting')`. Note that the `'Hello, world!'` is outputed to the console right after logging the `Subscribing to ref('greeting')`, and just before logging the `Setting 'greeting'`. This is because Muster is trying to resolve nodes synchronously when it can. We'll cover asynchronous nodes later in the tutorial.

Previously we covered how resolution of nodes work in Muster. Additionally, when muster resolves a node it also creates a stream of data that flows from dependencies to the dependants. Let's look at a resolution chain for this example:

| Node                               | Result                             |
| ---------------------------------- | ---------------------------------- |
| `ref('greeting')`                  | `variable(value('Hello, world!'))` |
| `variable(value('Hello, world!'))` | `value('Hello, world!')`           |
| `value('Hello, world!')`           | Static node; nothing to resolve    |

The resolution chain is defined top to bottom, just like dependency chain.
This means that for example the value of `ref('greeting')` depends on the value of `variable(value('Hello, world!'))`. Changing the value of `variable()` notifies the `ref('greeting')` that the value of its dependency changed, and that it should also change its own value.

Let's go through another example to hopefully make things a bit clearer:
```javascript
import muster, { computed, ref, set, variable } from '@dws/muster';

const app = muster({
  name: variable('world'),
  greeting: computed([ref('name')], (name) => `Hello, ${name}!`),
});

console.log('Subscribing to `ref(\'greeting\')`');
app.resolve(ref('greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Setting `name`...');
await app.resolve(set('name', 'reader'));

// Console output:
// Subscribing to `ref('greeting')`
// Hello, world!
// Setting `name`...
// Hello, reader!
```
This time we used the variable as a dependency of a `computed()` node, to which we made a subscription using `app.resolve(ref('greeting'))`. Said computed node composes a greeting message that depend on the current value of a `name` variable. Because of the reactive nature of Muster, the `computed() ` node is notified about the change in the `name` variable, and so it re-runs its `combine` function with the updated value.

## Lifecycle of a node

One thing we haven't touch on before is a lifecycle of a node. When you create a graph Muster doesn't resolve any node until you subscribe to them in one way or another. The subscription can be created in two ways:
  - Direct subscription, by doing `app.resolve(<<my node>>)`. This makes a subscription to a `<<my node>>` node.
  - Indirect subscription, by subscribing to a node that depends on a non-static node, or resolves to a non-static node.

Example of indirect subscription through a dependency:
```javascript
import muster, { computed, ref } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  fullName: computed(
    [ref('firstName'), ref('lastName')]
    (firstName, lastName) => {
      console.log('Subscribed to `fullName`')
      return `${firstName} ${lastName}`;
    },
  ),
});

console.log('Subscribing to a computed that produces greeting...');
let result = await app.resolve(
  computed(
    [ref('fullName')],
    (fullName) => {
      console.log('Subscribed to `greeting`');
      return `Hello, ${fullName}!`
    },
  ),
);
console.log(result);

console.log('Subscribing to `ref("fullName")`');
result = await app.resolve(ref('fullName'));
console.log(result);

// Console output:
// Subscribing to a computed that produces greeting...
// Subscribed to `fullName`
// Subscribed to `greeting`
// Hello, Bob Smith!
// Subscribing to `ref("fullName")`
// Subscribed to `fullName`
// Bob Smith
```
This example shows that the nodes are evaluated only when a subscription is made to them, and in which order such subscription is created. The `await` keyword next to the `app.resolve()` makes a quick subscription to the stream returned from `app.resolve()`, and unsubscribes once first non-pending result is returned. Note that the second time we did `app.resolve(ref('fullName'))` produced a console log output `Subscribed to 'fullName'`. Let's try changing the first use of `await` to a normal subscription, and see what happens then:
```javascript
import muster, { computed, ref } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  fullName: computed(
    [ref('firstName'), ref('lastName')]
    (firstName, lastName) => {
      console.log('Subscribed to `fullName`')
      return `${firstName} ${lastName}`;
    },
  ),
});

console.log('Subscribing to a computed that produces greeting...');
const subscription = app.resolve(
  computed(
    [ref('fullName')],
    (fullName) => {
      console.log('Subscribed to `greeting`');
      return `Hello, ${fullName}!`
    },
  ),
).subscribe((result) => {
  console.log(result);
});

console.log('-----------');
console.log('Subscribing to `ref("fullName")`');
const result1 = await app.resolve(ref('fullName'));
console.log(result);
console.log('-----------');

console.log('Unsubscribing from `computed([ref("fullName")], ...)`')
subscription.unsubscribe();

console.log('Subscribing to `ref("fullName")` (again)');
const result1 = await app.resolve(ref('fullName'));
console.log(result);

// Console output:
// Subscribing to a computed that produces greeting...
// Subscribed to `fullName`
// Subscribed to `greeting`
// Hello, Bob Smith!
// -----------
// Subscribing to `ref("fullName")`
// Bob Smith
// -----------
// Unsubscribing from `computed([ref("fullName")], ...)`
// Subscribing to `ref("fullName")` (again)
// Subscribed to `fullName`
// Bob Smith
```
This example is a bit longer than usually, but it's illustrating a very important point about how Muster resolves nodes, and the lifecycle of the nodes.
When the first subscription is made, Muster resolves the computed that depends on a `fullName` computed. This creates a subscription to that node, and also **caches the result from that node** for as long as the subscription is open. It serves as a performance improvement cos Muster doesn't have to re-compute the value of that node when it's requested the second time.
The second time we subscribe to the `fullName` node we only get the result of the computation, without calling the `combine` function of the node - note that the `Subscribed to 'fullName'` is missing from the console output.
Then we close the original subscription, which frees the resources, and removes the cached value of the `fullName` node from Muster.
After that we make another subscription to the `fullName` node which results in `Subscribed to 'fullName'` being printed to the console output.

## Lifecycle of a `variable()` node, and how to reset its value

The `variable()` node has a slightly different lifecycle, than any other dynamic node. Initially it behaves just like a regular dynamic node - subscribing to it causes its value to be cached by Muster, and the value is removed from the cache once the node is un-subscribed.
Things change once a `variable()` node value is set. The act of setting a `variable()` node makes it persistent, in a sense that unsubscribing from that node doesn't clear its value. You can remember that from previous examples of setting the variable, that the newly set value was available to us even though there was no active subscriptions to that variable node.
This raises one question - how to reset the variable to its original state?

Here's where the `reset()` node comes in handy. It is used to manually clear the value of a variable, and to restore it back to the original state:
```javascript
import muster, { ref, reset, set, variable } from '@dws/muster';

const app = muster({
  someVariable: variable('initial value'),
});

console.log(await app.resolve(ref('someVariable')));

console.log('Setting the value of someVariable');
await app.resolve(set('someVariable', 'updated value'));

console.log(await app.resolve(ref('someVariable')));

console.log('Resetting the someVariable');
await app.resolve(reset('someVariable'));

console.log(await app.resolve(ref('someVariable')));

// Console output:
// initial value
// Setting the value of someVariable
// updated value
// Resetting the someVariable
// initial value
```

## Fun with branches

In all of the examples up to this point we kept the Muster graph flat - there was no nesting of `tree()` nodes, but that doesn't mean it can't be done. Let's start with something simple:
```javascript
import muster, { ref } from '@dws/muster';

const app = muster({
  user: {
    firstName: 'Bob',
    lastName: 'Smith',
  },
});

const result = await app.resolve(ref('user', 'firstName'));
console.log(result);

// Console output:
// Bob
```
This example shows how to nest `tree()` nodes in Muster graph. Even though we havent explicitly defined `tree()` nodes, you might remember that JS objects are implicitly cast to a `tree()` node by the `muster()` factory function. Explicit graph definition would look like this:
```javascript
import muster, { tree, value } from '@dws/muster';

const app = muster(tree({
  user: tree({
    firstName: value('Bob'),
    lastName: value('Smith'),
  }),
}));
```
Even though this syntax is more explicit in what nodes are created, I'd recommend sticking to the shorter version as it's just quicker to write, and less prone to errors.

Going back to the example, after the definition of the muster graph comes the part where we resolve a `ref('user', 'firstName')`. This means that Muster should first resolve the `user` node until it reaches another tree, and then get `firstName` from that tree.

The branches of the `tree()` node can also be defined as **branch matchers**. These branch matchers inform the `tree()` node that a given branch can be accessed with a path that matches a specific type. Let's start with a simple matcher that accepts any name:
```javascript
import muster, { match, ref, types } from '@dws/muster';

const app = muster({
  greeting: {
    [match(types.string, 'name')]: 'Hello, world!',
  },
});

let result = await app.resolve(ref('greeting', 'Bob'));
console.log(result);

result = await app.resolve(ref('greeting', 123));
console.log(result);

// Console output:
// Hello, world!
// Error('Invalid child key: 123')
```
This example introduces two new concepts: a`types` object, and a `match()` function. The `types` object contains a number of different **type matchers**, that are used to inform Muster about a type of expected thing. These matchers can be used outside of Muster as well, for example:
```javascript
import { types } from '@dws/muster';

console.log('Is "hello" a string?', types.string('hello'));
console.log('Is 123 a string?', types.string(123));
console.log('Is true a string?', types.string(true));

// Console output:
// Is "hello" a string? true
// Is 123 a string? false
// Is true a string? false
```
I recommend going through Muster API docs to find out about different type matchers.

`match()` is a function used only inside of a `tree()` node to declare a branch matcher. The first argument of the `match()` is a type matcher, that checks if a given branch "name" (if I can call it "name") matches with the expected type. I said "name" in quotes, because in Muster branch "names" don't have to be strings. They can also be numbers, objects and nodes. This will be covered in the later stages of this tutorial.
The second argument of `match()` specifies a name of parameter that should be created when a given matcher captures the path. In the example above, for a path `ref('greeting', 'Bob')` the `name` parameter will contain `'Bob'`.

Going back to the example, note that in this example we tried resolving two different `ref()` nodes. One was for `'Bob'` string, and the other for `123` number. Looking back at the Console output you can notice that the first one logged a `'Hello, world!'` string, and the other one resulted in Error.

Let's tweak that example to utilise the value of the `'name'` parameter:
```javascript
import muster, { computed, match, param, ref, types } from '@dws/muster';

const app = muster({
  greeting: {
    [match(types.string, 'name')]: computed(
      [param('name')],
      (name) => `Hello, ${name}!`,
    ),
  },
});

let result = await app.resolve(ref('greeting', 'Bob'));
console.log(result);

result = await app.resolve(ref('greeting', 'Blueberry Muffin'));
console.log(result);

// Console output:
// Hello, Bob!
// Hello, Blueberry Muffin!
```
Now that's better! Note the new node - `param()`. The `param()` node can be used inside a branch matched by a branch matcher. The string argument used to create the `param()` node must match the one used when creating a branch matcher. Using it outside that branch, or misspelling name will result in that node resolving to an error.

As mentioned before, branch matchers don't have to be only matching string. Consider a following example:
```javascript
import muster, { computed, match, param, ref, types } from '@dws/muster';

const app = muster({
  greet: {
    [match(types.shape({
      firstName: types.string,
      lastName: types.string,
    }), 'user')]: computed(
      [param('user')],
      (user) => `Hello, ${user.firstName} ${user.lastName}!`,
    ),
  },
});

const result = await app.resolve(
  ref('greet', { firstName: 'Bob', lastName: 'Smith' }),
);
console.log(result);

// Console output:
// Hello, Bob Smith!
```
This example shows how to define branches that match on a specific shape. The shape in this case is expected to have a `firstName` and a `lastName`. Any other properties do not affect the shape matcher, and are allowed:
```javascript
const result = await app.resolve(
  ref('greet', { firstName: 'Bob', lastName: 'Smith', age: 25 }),
);
console.log(result);

// Console output:
// Hello, Bob Smith!
```

Just like normal named branches, branch matchers can be nested. One thing to remember is that it's always best to uniquely name branch parameters, so that they don't shadow previously defined parameters. Let's refactor the previous example into a nested branch matcher:
```javascript
import muster, { computed, match, param, ref, types } from '@dws/muster';

const app = muster({
  greet: {
    [match(types.string, 'firstName')]: {
      [match(types.string, 'lastName')]: computed(
        [param('firstName'), param('lastName')],
        (firstName, lastName) => `Hello, ${firstName} ${lastName}!`,
      ),
    }
  },
});

const result = await app.resolve(
  ref('greet', 'Bob', 'Smith'),
);
console.log(result);

// Console output:
// Hello, Bob Smith!
```

Branch matchers themselves are a very useful feature, but they make so much more sense when combined with nested `ref()` nodes:
```javascript
import muster, { computed, match, param, ref, set, types, variable } from '@dws/muster';

const app = muster({
  userFirstName: variable('Bob'),
  greet: {
    [match(types.string, 'name')]: computed(
      [param('name')],
      (name) => `Hello, ${name}!`,
    ),
  },
});

app.resolve(ref('greet', ref('userFirstName'))).subscribe((greeting) => {
  console.log(greeting);
});

console.log('Changing `userFirstName` to `Kate`...')
await app.resolve(set('userFirstName', 'Kate'));

// Console output:
// Hello, Bob!
// Changing `userFirstName` to `Kate`...
// Hello, Kate!
```
Note that the `ref()` we subscribe to is a bit different than usually:
`ref('greet', ref('userFirstName'))`. The first part of the ref, as usual is implicitly cast to a `value('greet')`, however the second node is actually a `ref()` to another node in the graph. In the course of resolving that top-level `ref()` muster first traverses the `getChild('greet')` operation on the root, which resolves to a tree:
```javascript
tree({
  [match(types.string, 'name')]: computed(
    [param('name')],
    (name) => `Hello, ${name}!`,
  ),
})
```
Next step for `ref()` is to figure out the value of the second path parameter `ref('userFirstName')`. As this isn't a static node, Muster adds it as a dependency of the `ref('greet', ref('userFirstName'))`, and resolves its value. That dependency ensures that when the value of `ref('userFirstName')` changes, the `ref()` that depends on it also gets updated.

## Asynchronous data

As I mentioned in the beginning of this tutorial, Muster comes with a great ability to seamlessly handle synchronous and **asynchronous** data. Now I'm going to introduce you to some core Muster nodes that should help you with this.

### Promises

The first node is `fromPromise()`, and as it's name suggests, it helps with [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

This node can be used to integrate libraries, whose API returns Promises, and to handle custom Web API requests (e.g. [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)).

Let's start with a very simple, contrived example:
```javascript
import muster, { fromPromise, ref } from '@dws/muster';

const app = muster({
  greeting: fromPromise(() => Promise.resolve('Hello, world!')),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Hello, world!
```
As you see, the syntax of accessing the value of an async node is no different from a sync node. One thing to note here is that the `fromPromise()` node takes an argument, which is a Promise factory. There are two main reasons for this:
  - Creating a promise also begins the work that the promise is supposed to do, and we only want to do it when a node is resolved by Muster (e.g. as a dependency of another node)
  - Promise once consumed can't be re-created.

Of course I could return `new Promise((resolve) => resolve('Hello, world!'))`, but that would make the example code unnecessarily long.

Now, that covers the successful promises, but sometimes things go wrong (slow network causes a timeout, no connction, server is down, etc.), and our code must be able to handle these scenarios as well. Thankfully Muster comes with a solution for that. Take a look at this example:
```javascript
import muster, { fromPromise, ref } from '@dws/muster';

const app = muster({
  greeting: fromPromise(() => Promise.reject('Could not load greeting')),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Error: Could not load greeting
```
The code above tries to get a `'greeting'`, which results in a rejected promise. Muster picks up the reason for the promise rejection, and creates an error object with that. This error then bubbles up to the output of your request.

In most cases Errors in Muster are being short-circuited, and returned to the user. To illustrate this let's take a look at another example:
```javascript
import muster, { computed, fromPromise, ref } from '@dws/muster';

const app = muster({
  name: fromPromise(() => Promise.reject('Could not load name')),
  greeting: computed([ref('name')], (name) => {
    console.log('Computing greeting for name:', name);
    return `Hello, ${name}!`;
  }),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Error: Could not load name
```
Note that the only console output entry we get is the error with its message, and not the `Computing greeting for name:`. The `computed()` node requested its dependency (`ref('name')`) to be resolved to a static node. The `error()` node is a static node, but it's a special kind of a static node, that must be explicitly allowed by a node that depends on it. The `computed()` node does not allow `error()`, and so they get short-circuited and returned as a result of the `computed()` node.

In some cases you might want to catch these errors in your code, and return some fallback value instead. This is where the `ifError()` node comes in handy
```javascript
import muster, { computed, fromPromise, getType, ifError, ref } from '@dws/muster';

const app = muster({
  name: fromPromise(() => Promise.reject('Could not load name')),
  safeName: ifError((e) => {
    console.log('Caught error:', getType(e));
    return 'world';
  }, ref('name')),
  greeting: computed([ref('safeName')], (name) => {
    console.log('Computing greeting for name:', name);
    return `Hello, ${name}!`;
  }),
});

const result = await app.resolve(ref('greeting'));
console.log(result);

// Console output:
// Caught error: error('Could not load name')
// Computing greeting for name: world
// Hello, world!
```
This example shows how to use the `ifError()` node to handle Muster errors, and how to return a fallback value. The first argument of this node can be either a fallback node, or like in the example above a fallback generator function. The fallback generator function can decide what to do based on the received error. It might even return received error, if it can't be handled by it.
In the example above you might have noticed a use of a mystery `getType()` function. This is due to the fact that the `e` is an instance of muster `error()` node, and logging it directly will not be very useful, as its structure has way more information than needed (e.g. internal type information, and a less beginner-friendly data layout). That's why Muster comes with a utility function that can convert these nodes to a human-readable format.

The `fromPromise()` node has one more trick up its sleeve. The promise factory function is actually called with a single argument: an object with all path `param()` nodes available in the current execution context:
```javascript
import muster, { fromPromise, match, ref, types } from '@dws/muster';

const app = muster({
  [match(types.string, 'firstName')]: fromPromise((params) =>
    Promise.resolve(`Hello, ${params.firstName}!`),
  ),
});

const result = await app.resolve(ref('Bob'));
console.log(result);

// Console output:
// Hello, Bob!
```

### Settable `fromPromise()`

The `fromPromise()` node can also be used to handle asynchronous `set` operations. This is handled by the second argument of the `fromPromise()` node. This means that the full signature of the `fromPromise()` node is:
```
fromPromise(
  getFactory: (pathParams) => Promise
  [, setFactory: (pathParams, value) => Promise]
)
```
This can be useful when implementing a node which integrates with an API that supports getting, and setting a value.

```javascript
import muster, { computed, fromPromise, ok, ref, set } from '@dws/muster';

let userName = 'world';

const app = muster({
  name: fromPromise(
    () => Promise.resolve(userName),
    (params, value) => {
      userName = value;
      return Promise.resolve(ok());
    },
  ),
  greeting: computed([ref('name')], (name) => `Hello, ${name}!`),
});

app.resolve(ref('greeting')).subscribe((result) => {
  console.log(result);
});

console.log('Setting name...');
await app.resolve(set('name', 'Bob'));

// Console output:
// Hello, world!
// Setting name...
// Hello, Bob!
```
This simple example shows how to use a settable `fromPromise()` node. This example of course doesn't take the full advantage of it, as it doesn't do anything asynchronous, but you could easily replace both uses of `Promise.resolve()` with `fetch()`, or a call to a library of your choice.

### Streams

The second node used when handling async data is `fromStream()`. Again, as the name suggests it is used when integrating streams with Muster apps. The `fromStream()` node supports streams that conform to the [TC39 Observable](https://tc39.github.io/proposal-observable/) API.
```javascript
import { BehaviorSubject } from '@dws/muster-observable';
// or
// import { BehaviorSubject } from 'rxjs';
import muster, { fromStream, ref } from '@dws/muster';

// This can be imported either from '@dws/muster-observable' or from 'rxjs',
// as both are API-compatible.
const nameSubject = new BehaviorSubject('world');

const app = muster({
  name: fromStream(nameSubject),
});

app.resolve(ref('name')).subscribe((result) => {
  console.log('Name:', name);
});

console.log('Pushing new name to the `nameSubject` stream.');
nameSubject.next('Bob');

// Console output:
// Name: world
// Pushing new name to the `nameSubject` stream.
// Name: Bob
```
This example shows how to integrate streams with Muster, and that Muster reacts to the changes of that stream. The code uses our own implementation of `BehaviorSubject`, but you could also use streams from `rxjs`.


## Callable graph functions

When building an application it is sometimes necessary to embed fragments of code that can be called with a set of arguments. In Muster this can be done in a number of ways:
  - Through a `computed()` node embedded inside a branch matcher
  - With a `fromPromise()` node
  - With an `action()` and `fn()` nodes, which I'm going to introduce you to

As mentioned before, Muster supports a number of graph operations. Currently we spoke about three:
  - `evaluate` - default action used by Muster when resolving a node to a static value
  - `getChild` - used by `ref()` to traverse the graph
  - `set` - used by the `set()` node (and implemented by `variable()`) to set a value of the node

Functions in Muster are implmeneted as a `call` operation. Similarly to `set`, this operation can take arguments.

There are some differences between `action()` and `fn()` nodes:
  - `action()` is a node whose implementation is written in JavaScript, but which can't be serialised, and sent to a remote instance of Muster
  - `fn()` is a node whose implementation is written using only Muster nodes, and which can be serialised (if all nodes used in the body support serialising), and sent to a remote instance of Muster

In order to run the `action()` and `fn()` nodes you must use `call()` node. Simply resolving `action()` and `fn()` noodes won't do anything, as they do not support `evaluate` operation, and will be used as the result of resolving that node.
```javascript
import muster, { action, call } from '@dws/muster';

const app = muster({
  getGreeting: action(() => {
    console.log('getGreeting called');
    return 'Hello, world!';
  }),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// getGreeting called
// Hello, world!
```
The code above shows how to define callable graph functions with the use of the `action()` node. Notice that the `call()` node takes a string. Just like most of Muster nodes it comes with its own implicit conversion - it converts the first argument to a `ref()` node. The explicitly defined `call()` would look like this: `call(ref('getGreeting'))`.
Now, let's try to do the same using `fn()` node:
```javascript
import muster, { call, fn, value } from '@dws/muster';

const app = muster({
  getGreeting: fn(() => value('Hello, world!')),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// Hello, world!
```
This example produces more or less the same output as the `action()`, with a notable lack of the `console.log()` inside of the `fn()` body. This is due to the fact, that the body of that node must consist only of Muster nodes.

Going back to the `action()` node, the node comes with a support for [generator functions (function*)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), which make the process of creating more complex actions much easier. Consider a following example of an `action()` without the use of **generator function**:
```javascript
import muster, { action, call, computed, ref } from '@dws/muster';

const app = muster({
  name: 'Bob',
  getGreeting: action(() =>
    computed([ref('name')], (name) => `Hello, ${name}!`),
  ),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// Hello, Bob!
```
And a similar `action()` written with **generator function**:
```javascript
import muster, { action, call, ref } from '@dws/muster';

const app = muster({
  name: 'Bob',
  getGreeting: action(function* () {
    const name = yield ref('name');
    return `Hello, ${name}!`;
  }),
});

const result = await app.resolve(call('getGreeting'));
console.log(result);

// Console output:
// Hello, Bob!
```
Even though both of the actions produce the same desired result, the second one (in my opinion) looks a bit cleaner and easier to follow. In the `action()` implemented with the generator function you can see the `yield ref('name')` expression. This causes the `ref('name')` node to be returned to the Muster for resolving, and once it is resolved the generator function assigns its value to the `name` variable, which you can then use just like a normal JS value.
There is no limit to how many times you `yield` a node in an `action()`.

### Yielding multiple results

Implementing `action()` as a generator function has one more benefit. You can yield multiple nodes at the same time, which should help to keep your code short and understandable.

```javascript
import muster, { action, call, ref } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  getFullName: action(function* () {
    const [firstName, lastName] = yield [
      ref('firstName'),
      ref('lastName'),
    ];
    return `${firstName} ${lastName}`;
  }),
});

const result = await app.resolve(call('getFullName'));
console.log(result);

// Console output:
// Bob Smith
```
This example shows how to yield multiple nodes from an action, and how to extract the results from the response. The `yield []` resolves to an array of values, where the order of results matches the order of yielded nodes.

### Calling an action with arguments

The `action()` and the `fn()` nodes can also be called with a number of arguments:
```javascript
import muster, { action, call } from '@dws/muster';

const app = muster({
  addNumbers: action((left, right) => left + right),
});

const result = await app.resolve(call('addNumbers', [1, 2]));
console.log(result);

// Console output:
// 3
```
This example shows how to call a function with some arguments. As with most of Muster nodes, the implicit conversion will convert them to `value(1)` and `value(2)`. You can also call functions with other nodes:
```javascript
import muster, { action, call, ref } from '@dws/muster';

const app = muster({
  addNumbers: action((left, right) => left + right),
  five: 5,
  two: 2,
});

const result = await app.resolve(
  call('addNumbers', [ref('five'), ref('two')]),
);
console.log(result);

// Console output:
// 7
```

### `call()` doesn't respond to changes in the graph

Most of Muster nodes follow the mantra of reactively responding to changes in their dependencies. The `call()` node is a bit different. It is tasked with a goal of reproducing a one-off function call, which also means that it shouldn't try calling the function again when its dependencies have changed. Take a look at this example:
```javascript
import muster, { action, call, ref, set, variable } from '@dws/muster';

const app = muster({
  name: variable('Bob'),
  changeName: action(function* (newName) {
    const name = yield ref('name');
    if (newName === name) return;
    yield set('name', newName);
  }),
});

await app.resolve(call('changeName', ['Jane']));
```
This code would cause an infinite loop if `call()` node was subscribed to the changes in the nodes used by it. Thankfully the `call()` node prevents it, and you're able to run that code without worrying about your app looping until the end of times.

## Updating `settable` nodes

Previously we talked about a concept of setting the value of a **settable** node. The process looked very similar to a normal variable assignment in JavaScript. Updating a **settable** node does slightly more than just a normal `set()`, notably the value you set to a node can be influenced by the current value of the node. Consider a following code in JavaScript:
```javascript
// This declares a variable, and assigns a value to it
let someVariable = 'initial value';

// This sets the value of the variable, and discards the previous value
someVariable = 1;

// This updates a value to value + 1
someVariable += 1;
```
The same code can be expressed in Muster with the use of following nodes:
```javascript
import muster, { action, ref, set, update, variable } from '@dws/muster';

// This declares a variable, and assigns a value to it
const app = muster({
  someVariable: variable('initial value'),
});

// This sets the value of the variable, and discards the previous value
await app.resolve(set('someVariable', 1));

// This updates a value to value + 1
await app.resolve(update('someVariable', action((value) => value + 1)));
```
The code above introduces a new node - `update()`. It works somewhat similar to `set()` in the sense that the first argument expresses a path to the node to set. The difference is in the second argument, as in the `set()` node it was a raw value to set, here it's a **callable** node that takes one parameter (current value of the settable node) and returns a new value to set. In theory you could completely ignore the `value` parameter, and use it to set the value of the **settable** node to a brand new value (unrelated to the original **value**), but that would be very wasteful:
```javascript
await app.resolve(
  update('someVariable', action((value) => 'some other value')),
);
```

## Introduction to collections

A big part of Muster is handling collections of items. In Muster, any node can be an item in a collection, but most common types of node used as an item of the collections are `value()` and `tree()`.

Muster comes bundled with a two types of collections:
  - `array()` - A fixed-length collection; similar to an array in Java. Once defined, this collection can't change its size, but its items still can be set (with the use of a `variable()` and `set()` nodes)
  - `arrayList()` - A dynamic-length collection; similar to an ArrayList in Java. This collection supports a number of length-changing operations:
    * `push()` - Adds a new item to the back of the collection
    * `pop()` - Removes an item from the back of the collection
    * `unshift()` - Adds a new item at the front of the collection
    * `shift()` - Removes an item from the front of the collection
    * `addItemAt()` - Adds an item at a given index of the collection
    * `clear()` - Removes all items from the collection
    * `removeItem()` - Removes a given item from the collection
    * `removeItemAt()` - Removes an item at a given index
    * `removeItems()` - Removes item that match a given predicate

Aside from collections having different types, every collection can also be transformed using a number of transforms you might be familiar from different programming languages:
  - `map()`
  - `filter()`
  - `count()`
  - `sort()`
  - `take()`
  - `slice()`
  - `groupBy()`
  - `skip()`
  - and a few more

I'm going to cover only some of these transforms in this tutorial just to give you a feel for how to use them. For more information on different collection transforms please refer to Muster API docs.

Right, let's get to the fun part. Time to make a simple `array()` node:
```javascript
import muster from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3],
});
```
The code above relies on an implicit conversion from a JS array to an `array()` node. An explicitly defined array would look like this:
```javascript
import muster, { array, value } from '@dws/muster';

const app = muster({
  numbers: array([value(1), value(2), value(3)]),
});
```
The `array()` node hides one more secret when it comes to implicit conversion:
```javascript
import muster from '@dws/muster';

const app = muster({
  fruits: [
    { name: 'Banana' },
    { name: 'Apple' },
    { name: 'Plum' },
  ],
});
```
Similarly to the `tree()` node definition, any items that are objects are converted to `tree()` nodes. This means that an explicitly declared array would look like this:
```javascript
import muster, { array, tree, value } from '@dws/muster';

const app = muster({
  fruits: array([
    tree({ name: value('Banana') }),
    tree({ name: value('Apple') }),
    tree({ name: value('Plum') }),
  ]),
});
```
I intentionally left out the part of the code responsible for loading that collection from Muster, as it relies on the knowledge of `query()` node. You can find the introduction to the `query()` node in the section below.

## Requesting values of multiple nodes at the same time

Until now we've been using a fairly simple `ref()` node to request a single value at a time from our graph. This wouldn't be the most efficient in an real-world application, as we'd have to repeat a lot of our code, and also the quality of that code wouldn't be the best. This is where the `query()` node comes in handy. It's a node that is used when making a query for multiple pieces of data, arranged in a tree-like structure. Let's start small:
```javascript
import muster, { query, root } from '@dws/muster';

const app = muster({
  firstName: 'Bob',
  lastName: 'Smith',
  age: 25,
});

const result = await app.resolve(query(root(), {
  firstName: true,
  lastName: true,
}));
console.log(result);

// Console output:
// { firstName: 'Bob', lastName: 'Smith' }
```
The first thing you might notice here, is that the graph contains nodes `firstName`, `lastName` and `age`, but the response of the `query()` contains only `firstName` and `lastName`. This is because the query we've constructed only asked for these two nodes. The `query()` node is constructed by first providing the root node of the query - in this case we use a `root()` node. The `root()` node serves as a kind of meta-node which always resolves to the top-most node of the application graph. In this example the `root()` node resolves to:
```javascript
tree({
  firstName: value('Bob'),
  lastName: value('Smith'),
  age: value(25),
})
```
The root of the `query()` node can also be set to any other node, but we'll talk about this in the later stages of this tutorial.
The second argument of the `query()` is a node that defines the shape of nodes to extract. Again, the implicit conversion to a node helps us here a bit. The same query defined explicitly would look like this:
```javascript
query(root(), fields({
  firstName: key('firstName'),
  lastName: key('lastName'),
}))
```
As with most Muster nodes, I recommend sticking to the short-hand versions of them as it's faster, and easier to write them.

The query we ended up creating informs Muster, that we'd like to load from a root of our graph fields `firstName` and `lastName`. These fields should be first resolve to a non-error node that doesn't implement `evaluate` operation.

A `query()` node can also be used when loading nested data structures from the graph:
```javascript
import muster, { computed, query, ref, root } from '@dws/muster';

const app = muster({
  user: {
    age: 25,
    firstName: 'Bob',
    lastName: 'Smith',
    fullName: computed(
      [ref('user', 'firstName'), ref('user', 'lastName')],
      (firstName, lastName) => `${firstName} ${lastName}`,
    ),
  },
});

const result = await app.resolve(query(root(), {
  user: {
    age: true,
    fullName: true,
  },
}));
console.log(result);

// Console output:
// {
//   user: {
//     age: 25,
//     fullName: 'Bob Smith',
//   },
// }
```
The query we just constructed requested two fields (`age` and `fullName`) from the `user` tree, which we just observed in the result received from the muster. Again, as in the previous example the `query()` node we made uses a `root()` node as the root of the query, but now that we have some nesting in our graph we could re-write this query to use the `user` as the starting point of the query:
```javascript
import muster, { computed, query, ref } from '@dws/muster';

const app = muster({
  user: {
    age: 25,
    firstName: 'Bob',
    lastName: 'Smith',
    fullName: computed(
      [ref('user', 'firstName'), ref('user', 'lastName')],
      (firstName, lastName) => `${firstName} ${lastName}`,
    ),
  },
});

const result = await app.resolve(query(ref('user'), {
  age: true,
  fullName: true,
}));
console.log(result);

// Console output:
// {
//   age: 25,
//   fullName: 'Bob Smith',
// }
```
The `query()` node created in this example sets is root as `ref('user')`, which means that the `fields` part of the query now is defined relative to the `user` branch. Also, note that the output no longer has the `user: {}` object, and that the `age` and `fullName` properties are present directly inside the top-level object.

### Querying items from a collection

In the brief introduction to collections in Muster I wrote about how to define collections, but not how to get the data from them. This is because getting data from the collection require constructing a `query()` against it. This is because each item can be a `tree()` node, and in Muster "Get me the whole tree" doesn't make any sense. When getting data from a `tree()` you have to be explicit in terms of what to get from it. To illustrate the problem with "Get me the whole tree" sentence, consider this example:
```javascript
import muster, { computed, match, query, param, root, types } from '@dws/muster';

const app = muster({
  greet: {
    [match(types.string, 'userName')]: computed(
      [param('userName')],
      (userName) => `Hello, ${userName}!`,
    ),
  },
});

// This will result in an error
const result = await app.resolve(query(root(), {
  greet: true,
}));
console.log(result);

// Console output:
// Error: Invalid query: missing child fields
```
This code makes a query to retrieve the `greet` as a plain value, but it is in fact a `tree()`. To make matters worse, this tree allows for an (nearly) infinite number of values, and so it is impossible to create a correct result for this query. Similar problem exists when requesting items from a collection.
This is why we made a decision to not allow such queries.

Now, back to the topic. Let's make a simple query to get items from a collection containing primitive items (`value()` nodes):
```javascript
import muster, { entries, query, root } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3],
});

const result = await app.resolve(query(root(), {
  numbers: entries(),
}));
console.log(result);

// Console output:
// [1, 2, 3]
```
This example introduces a new Muster node - `entries()`. The only use for this node is as part of the `query()` node definition, and it is used to indicate to the `query()` node that a given node should be loaded as a collection of items. The `entries()` node has one optional argument that defines the shape of each item, but not specifying it tells the `query()` that it is supposed to expect these items to be primitive items (`value()`).

The following code fragment shows how to make a `query()` against a collection containing `tree()` nodes:
```javascript
import muster, { entries, query, root } from '@dws/muster';

const app = muster({
  people: [
    { firstName: 'Bob', lastName: 'Smith' },
    { firstName: 'Kate', lastName: 'Doe' },
    { firstName: 'Jane', lastName: 'Jonson' },
  ],
});

const result = await app.resolve(query(root(), {
 people: entries({
   firstName: true,
 }),
}));
console.log(result);

// Console output:
// {
//   people: [
//     { firstName: 'Bob' },
//     { firstName: 'Kate' },
//     { firstName: 'Jane' },
//   ]
// }
```
Note that the returned items contain only `firstName` property, as this is the only property that was requested from the item.

## Filtering collections with `value()` items

Now that we've covered the basics of `array()` and `query()` node, I think it's time to introduce the first collection transform - `filter()`. The transforms can be applied in two ways:
 - By defining a collection with transforms
 - By defining a query with transforms

```javascript
import muster, { applyTransforms, entries, filter, gt, query, ref } from '@dws/muster';

const app = muster({
  filteredNumbers: applyTransforms(
    [1, 2, 3, 4, 5],
    [
      filter((number) => gt(number, 2)),
    ],
  ),
});

const result = await app.result(
  query(ref('filteredNumbers'), entries())
);
console.log(result);

// Console output:
// [3, 4, 5]
```
This example shows how to define a `applyTransforms()` with a `filter()` transform. The `applyTransforms()` node allows assigning transforms to an underlying collection. The first argument of the `applyTransforms()` node is either an array of items, or a muster node that can be resolved to a collection. The second argument is an array of collection transforms. In our example the `applyTransforms()` node is defined with an array of numbers, which is implicitly converted to `array([value(1), value(2), value(3), value(4), value(5)])`. We could also define the collection with a `ref()` to an array:
```javascript
import muster, { applyTransforms, entries, filter, gt, query, ref } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3, 4, 5],
  filteredNumbers: applyTransforms(
    ref('numbers'),
    [
      filter((number) => gt(number, 2)),
    ],
  ),
});

const result = await app.result(
  query(ref('filteredNumbers'), entries())
);
console.log(result);

// Console output:
// [3, 4, 5]
```
The `filter()` is a node that takes one argument, which should be a callable node (a node that supports a `call` operation), or a javascript function which is implicitly converted to `fn()` node. The body of the filter is going to be called for every item from the collection, and is supposed to return `true` if it should end up in the output, or `false` if the item should be discarded. The body of the `filter()` above uses the `gt()` (greater than) node, that checks if a node value is greater than 2 - this should explain why we ended up with [3, 4, 5] as the result of running a query against the 'filteredNumbers' collection.

Let's change this example to move the filter into the query:
```javascript
import muster, { entries, filter, gt, query, ref, withTransforms } from '@dws/muster';

const app = muster({
  numbers: [1, 2, 3, 4, 5],
});

const result = await app.result(
  query(ref('filteredNumbers'), withTransforms([
    filter((number) => gt(number, 2)),
  ], entries()))
);
console.log(result);

// Console output:
// [3, 4, 5]
```
Note that the `entries()` node is now wrapped in a new `withTransforms()` node. This node first defines an array of transforms to apply to the target collection, and then the shape of items of that collection, which is where the empty `entries()` comes in.

## Filtering collection with `tree()` items

In the following example we're going to filter a list of people to find only people whose first name contains a letter 'a':
```javascript
import muster, { applyTransforms, entries, filter, get, includes, query, ref } from '@dws/muster';

const app = muster({
  filteredPeople: applyTransforms(
    [
      { firstName: 'Bob', lastName: 'Smith' },
      { firstName: 'Kate', lastName: 'Doe' },
      { firstName: 'Jane', lastName: 'Jonson' },
    ],
    [
      filter((person) => includes('a', get(person, 'firstName')))
    ],
  ),
});

const result = await app.resolve(
  query(ref('filteredPeople'), entries({
    firstName: true,
  })),
);
console.log(result);

// Console output:
// [
//   { firstName: 'Kate' },
//   { firstName: 'Jane' },
// ]
```
This example introduces two new Muster nodes: `includes()` and `get()`.
The `includes()` node is a node that operates on `value()` nodes containing a string value, and it checks if a given node contains a given sub-string. The first argument defines the sub-string we're looking for, and the second argument defines the target.
This brings us to the `get()` node, which is a node used when traversing Muster graph from a specific point in the graph. This node is internally used by the `ref()` node to do the path traversal.
For example, a node `ref('user', 'firstName')` is actually being turned into `get(root(), ['user', 'firstName'])`. The code `get(person, 'firstName')` means "Run the `getChild('firstName')` operation on a `person` node.".

Collection transforms can also be defined with `ref()` nodes in them, which should enable parametrisation of the criteria. To illustrate this let's take a look at a following code:
```javascript
import muster, {
  applyTransforms,
  entries,
  eq,
  filter,
  get,
  includes,
  query,
  ref,
  set,
  variable,
} from '@dws/muster';

const app = muster({
  products: [
    { name: 'Quiet runner 2000', category: 'Shoes' },
    { name: 'Smooth criminal brogue', category: 'Shoes' },
    { name: 'Winter jacket', category: 'Jackets' },
    { name: 'Waterproof jacket', category: 'Jackets' },
    { name: 'Fake mustache', category: 'Accessories' },
  ],
  filteredProducts: applyTransforms(ref('products'), [
    filter((product) =>
      eq(get(product, 'category'), ref('selectedCategory'))
    ),
  ]),
  selectedCategory: variable('Shoes'),
});

app.resolve(
  query(ref('products'), entries({ name: true }))
).subscribe((results) => {
  console.log(results);
});

console.log('Changing `selectedCategory` to `Jackets`');
await app.resolve(set('selectedCategory', 'Jackets'));

// Console output:
// [{ name: 'Quiet runner 2000' }, { name: 'Smooth criminal brogue' }]
// Changing `selectedCategory` to `Jackets`
// [{ name: 'Winter jacket' }, { name: 'Waterproof jacket' }]
```
This example introduces a new logic node - `eq()`. It is used when comparing two `value()` nodes, and it works in the same way as `===` symbol in JavaScript, maning that:
```javascript
eq(1, 1) // resolves to value(true)
eq(1, '1') // resolves to value(false)
```

## Adding items to collections

In muster there are two types of collections:
  - fixed size collections, which we spoke about already
  - dynamic size collections, which allow adding and removing items from it

The simplest node that is an example of dynamic size collection is the `arrayList()` node. This node implements all collection-modifying operations (namely `push()`, `pop()`, `clear()`, etc.).

The syntax for pushing item to a collection is very similar to the `set()` operation. Let's start with a simple example:

```javascript
import muster, { arrayList, entries, query, ref, push } from '@dws/muster';

const app = muster({
  numbers: arrayList([1, 2, 3]),
});

app.resolve(query(ref('numbers'), entries())).subscribe((result) => {
  console.log(result);
});

console.log('Pushing an item to the numbers collection');
await app.resolve(push(ref('numbers'), 4));

// Console output:
// [1, 2, 3]
// Pushing an item to the numbers collection
// [1, 2, 3, 4]
```
Note that the `numbers` collection is now explicitly defined as an `arrayList()` node. Declaring the collection as an `array()` node would not work, as the `array()` node does not support operations that can change the size of the collection.

Check out the Muster API docs to learn more about different `arrayList()` operations.

## Scopes

Just like most of programming languages, Muster also has a concept of scopes. In Muster, scopes are used to create a self-contained parts of a graph, that have no access to the "outside world" apart from the nodes that are explicitly injected to it. Take a look at these examples, first without a scope:
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
Even though the definition of the graph hasn't change much from one example to the other one, the output changed quite significantly. This is due to the fact, that the `scope()` node begins a new graph, and all refs used within that scope start their traversal from the root of that scope, and not from the root of the graph as they usually do.
This behaviour is quite useful when making self-contained pieces of logic, and it makes sure that the logic you build doesn't depend on the place in the graph it is placed in.

The `scope()` node doesn't have to be completely isolated from the graph it is used in. This is where `context()` values come in.
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

## Final words

Congratulations on finishing this Muster tutorial. With it you should be able to start building apps, but there's more to learn.
Muster comes with a lot more nodes that weren't mentioned in this tutorial. You can find all of them in the Muster API docs, and each of them should contain a few examples showing you how to use it.
