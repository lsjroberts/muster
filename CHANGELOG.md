---
id: changelog
title: Latest Changes
---

<!--lint disable -->

## Unreleased

### 🐛 Bug Fixes

- Fixed a problem with serialising Graph Metadata for the purpose of using it in Muster DevTools.

## 6.5.0 (2018-12-06)

### 🚀 New Features

- Made first public release to npm!

### 📝 Documentation

- Added `parallel()` and `series()` node definitions to the `Essential Nodes` page.
- Added a link to github issues on the `Help` page.

## 6.4.1 (2018-12-03)

### 🐛 Bug Fixes

- Fixed a problem with `placeholder` node removing a `getItems` request when the filter is changed by Muster React.
- Fixed a problem with an example code in `Crafting Muster Nodes` tutorial.

## 6.4.0 (2018-11-30)

### 🚀 New Features

- Extended the `querySet()` API by adding a short-hand versions of operation factories:
  ```javascript
  querySetGetChildOperation(getChildOperation('someKey'));
  // or
  querySetGetChildOperation('someKey');
  ```
  ```javascript
  querySetCallOperation(callOperation([value('arg1'), value('arg2')]));
  // or
  querySetCallOperation([value('arg1'), value('arg2')]);
  ```
  ```javascript
  querySetSetOperation(setOperation(value('newValue')));
  // or
  querySetSetOperation(value('newValue'));
  ```
  
### 🐛 Bug Fixes

- Fixed a problem with `queryBuilder` incorrectly batching requests for the similar looking `getItems` requests.

### 💅 Polish

- Improved the integration with Jest testing framework by adding a better handling for Muster types.

## 6.3.1 (2018-11-27)

### 🐛 Bug Fixes

- Fixed a problem with `proxy()` node sometimes making empty `getChild` requests.
- Fixed a problem with `proxy()` node not handling correctly `nil()` collections.

### 💅 Polish

- Locked the version of `event-stream` to `3.3.4` to make sure it doesn't cause us any problems. We were unlikely to be affected by the vulnerability as the packages that use `event-stream` weren't used on the client browser. The packages using the `event-stream` are:
  - `muster-repl` -> `blessed-contrib` -> `event-stream` - It runs in the command line, so it should have no access to your wallets.
  - `npm-run-all` -> `ps-tree` -> `event-stream` - It runs at build time, also in the command line.

## 6.3.0 (2018-11-23)

### 🚀 New Features

- Extended the `join()` node to support collections:
  ```javascript
  join(' ', query(ref('names'), entries()))
  // or
  joinItems(' ', ref('names'))
  ```
- Added the `flow()` node, which imitates the `flow()` function from lodash.
  ```javascript
  call(flow(
    fn((a, b) => add(a, b)),
    fn((sum) => format('The sum is ${sum}', { sum }),
  ), [1, 2]))
  // === 'The sum is 3'
  ```
- Added the `setResult()` node, which resolves the value to a static node before setting it.
  The node has the same API as the `set()` node.

### 🐛 Bug Fixes

- Fixed a problem with `fn` node migration from Muster 5 to Muster 6.
- Added `muster-message-transport` to `muster-server` dependencies

## 6.2.0 (2018-11-20)

### 🚀 New Features

- Added a new `createBehavior()` node, which can be used to implement custom behaviours:
  ```javascript
  function editable(original, fieldName) {
    const editableFieldName = `$$editable_${fieldName}`;
    return {
      [editableFieldName]: variable(undefined),
      [fieldName]: createBehavior({
        evaluate: () => ifElse({
          if: not(eq(ref(editableFieldName), undefined)),
          then: ref(editableFieldName),
          else: get(original, fieldName),
        }),
        set: (params, operation) => set(editableFieldName, operation.value),
      }),
    };
  }
  ```
- Added a new `unique` node, to identify unique items in a collection:
  ```javascript
  const app = muster({
    numbers: applyTransforms(
      [1, 2, 3, 1, 2],
      [unique()],
    ),
  });
  
  const uniqueNumbers = await app.resolve(query(ref('numbers'), entries()));
  // uniqueNumbers === [1, 2, 3]
  
  const app = muster({
    products: applyTransforms(
      [
          { name: 'Apple', category: 'Fruit' },
          { name: 'Bicycle', category: 'Toy' },
          { name: 'Pear', category: 'Fruit' },
          { name: 'Apple', category: 'Fruit' },
      ],
      [
        unique((item) => get(item, 'name')),
      ],
    ),
  });
  
  const uniqueProducts = await app.resolve(query(ref('products'), entries({
    name: true,
  })));
  // uniqueProducts === [{ name: 'Apple' }, { name: 'Bicycle' }, { name: 'Pear' }]
  ```
- Added a new `contains` node that allows for checking whether a value or item is in a collection.
  ```javascript
  const app = muster({
    numbers: array([3, 2, 1]),
  });
  
  const contains3 = await app.resolve(contains(ref('numbers'), 3)));
  // contains3 === true
  const contains5 = await app.resolve(contains(ref('numbers'), 5)));
  // contains5 === false
  ```
  Or with a custom comparator:
  ```javascript
  const app = muster({
    products: arrayList([
      { name: 'Apple', category: 'Fruit' },
      { name: 'Bicycle', category: 'Toy' },
      { name: 'Pear', category: 'Fruit' },
      { name: 'Banana', category: 'Fruit' },
    ]),
  });
 
  const containsBananaString = await app.resolve(contains(
    ref('products'),
    'Banana',
    fn((left, right) => eq(get(left, 'name'), right)),
  )));
  // containsBananaString === true
 
  const containsBananaObject = await app.resolve(contains(
    ref('products'),
    toNode({ name: 'Banana' }),
    fn((left, right) => eq(get(left, 'name'), get(right, 'name'))),
  )));
  // containsBananaObject === true
  ```

### 🐛 Bug Fixes

- Fixed a problem with `iterate()` node implementation.
- Fixed a problem with `sort()` node returning an error when used by `iterate()`.
- Fixed a problem with showing error paths in the Jest output.

### 💅 Polish

- Improved the performance of the `map()` collection transform.
- Simplified the implementation of the `sortOrder()` node.
- Simplified the implementation of the `extend()` node.
- Added more unit tests for collection transforms using `iterate()` node.

## 6.1.0 (2018-11-13)

### 🚀 New Features

- Changed the `valueOf()` to not show a warning when a node passed to it is a non-data node, but to make a Proxied Node, which can be injected back into Muster.
- Changed the `action()` to handle the Proxied Nodes:
  ```javascript
  // Given this graph
  const app = muster({
    user: variable(nil()),
    createUser: action((name) => toNode({ name })),
    addUser: action(function* ({ name }) {
      const user = yield call('createUser', [name]);
      yield set('user', user);
    }),
  });
  // A following query should work before and after calling addUser
  app.resolve(query(ref('user'), { name: true })).subscribe((user) => {
    console.log('User:', user);
  });
  console.log('Calling `addUser(Bob)`')
  await app.resolve(call('addUser', { name: 'Bob' }));

  // Console output:
  // User: { name: undefined }
  // Calling `addUser(Bob)`
  // User: { name: 'Bob' }
  ```
  
### 🐛 Bug Fixes

- Fixed a problem with creating a `ref(0)` returning a `root()` node, instead of `get(root(), 0)`.
- Fixed workers and sockets to remove listeners on unsubscribe, not dispose of themselves

## 6.0.0 (2018-11-09)

### 💥 Breaking Changes

- Changed Muster `.resolve()` method so that it runs the output through the `valueOf` helper before returning it to
  subscribers. This behaviour can be overridden with the use of `{ raw: true }` option:
  ```javascript
  const app = muster({ /* ... */ });
  const result = await app.resolve(query(/* ... */), { raw: true }); // This will resolve to a `tree()` node
  ```
- Changed `fromPromise` node so that the `setter` function is called with an unwrapped `newValue` (run through `valueOf`
  helper), instead of a NodeDefinition.
- Renamed `partial` node to `injectDependencies`.
- Replaced `items()` node with `withTransforms()` and `entries()` node:

  Before:
  ```javascript
  query(ref('users'), items({ postcode: true }, [map(user => get(user, 'address'))]))
  ```
  After:
  ```javascript
  query(ref('users'), withTransforms([map(user => get(user, 'address'))], entries({
    postcode: true,
  })));
  ```
- Renamed mutable `array()` to `arrayList()`:
  ```javascript
  shift(array(['foo', 'bar', 'baz']))
  ```
  ```javascript
  shift(arrayList(['foo', 'bar', 'baz']))
  ```
- Refactored `proxy()` and `remote()` nodes to allow for streaming connections. The proxy node now builds a combined
  query containing every currently subscribed `placeholder()` node. These queries can be optimised for different types
  of connections with the help of custom middlewares.
- Added `batchRequestsMiddleware()` middleware (used internally by `remote()` node). This middleware is used to optimise
  a query sent to the `muster-express` by sending queries containing only the newly subscribed operations, and storing
  the values of resolved operations as long as the subscriptions for these operations are open.
- Changed `xhrMiddleware()` and related utility functions to handle connections as Observables, instead of Promises.
- Disabled `cacheMiddleware()` as right now it is not compatible with the new `proxy()` model.
- Changed `fromStreamMiddleware()` to allow for long lasting streaming connections with remote instances of Muster.
- Re-implemented the `ifPending()` node to add more flexibility with regards to the fallback values. New `ifPending()`
  node is now capable of handling any type of fallback value. It also has fuller understanding as to when a given
  sub-operation is pending.
- Renamed `eventScheduler()` to `onGlobalEvent()`, which now is a node.
- Renamed `timeoutScheduler()` to `onGlobalEventDebounced()`, which now is a node.
- Changed the NodeType OperationHandler API to take the GraphOperation instead of a OperationProperties.
- Renamed `takeFirst()` collection transform node to `firstItem()`
- Renamed `takeLast()` collection transform node to `lastItem()`
- Renamed `takeNth()` collection transform node to `nthItem()`
- Renamed `firstItem()` node to `head()`
- Changed the `apply()` node API to allow calling it only with a node definition and arguments (optionally).
  Previously available variants with `rootAndPath` and `path` are no longer supported.
- Changed the order of arguments in the `apply()` node signature. This makes it more similar to `computed()`
  and `resolve()` nodes.
  Before:
  ```javascript
  apply(ref('myFunction'), [1, 2, 3])
  ```
  After:
  ```javascript
  apply([1, 2, 3], ref('myFunction'))
  ```
- Changed Muster React's `createContainer()` function so that it now performs the validation of props loaded from the graph.
  Every property now must be typed using Muster types, or newly introduced `propTypes`:
  - `true` - just like before, this is a shorthand for `types.any`
  - `propTypes.getter()`, `propTypes.getter(name)`, `propTypes.getter(type)`, `propTypes.getter(name, type)`
  - `propTypes.setter()`, `propTypes.setter(name)`, `propTypes.setter(type)`, `propTypes.setter(name, type)`
  - `propTypes.caller()`, `propTypes.caller(name)`, `propTypes.caller([argTypesArray])`, `propTypes.caller(name, [argTypesArray])`
  - `propTypes.list()`, `propTypes.list(name)`, `propTypes.list({ fields })`, `propTypes.list(name, { fields })`
  - `propTypes.defer(<what to defer>)`
  - `propTypes.isLoading(relativePropName)`
  - `propTypes.injected()`, `propTypes.injected(...path)`
  
  Example container:
  ```javascript
  createContainer({
    graph: { /* ... */ },
    props: {
      time: true,
      user: propTypes.defer({
        firstName: types.string,
        lastName: types.string,
        delete: propTypes.caller(),        
        friends: propTypes.list({
          firstName: types.string,
          lastName: types.string,
        }),
      }),
      isLoadingUser: propTypes.isLoading('user'),
    },
  })
  ```
- Changed Muster React so that it now performs validation of data received from Muster against types specified in the props section of the container.
- Replaced `inject()` function with a static method exposed by the container:
  
  Before:
  ```javascript
  const Child = createContainer({...})(() => { /* ... */ });

  function Parent(props) {
    return <Child {...inject(props)} />;
  }
  ```
  After:
  ```javascript
  const Child = createContainer({...})(() => { /* ... */ });

  function Parent(props) {
    return <Child {...Child.inject(props)} />
  }
  ```

- Removed `deferAll()` function, which is now replaced with a correctly implemented `propTypes.defer()` that allows nested properties.
- Changed the way `query()` node handles errors. Instead of returning a partially resolved query, now the node responds with first encountered error.
  
  Before:
  ```javascript
  const app = muster({
    firstName: 'Bob',
    lastName: error('Some error'),
  });

  await app.resolve(query(root(), {
    firstName: key('firstName'),
    lastName: key('lastName'),
  })); // === { firstName: 'Bob', lastName: new Error('Some error') }
  ```
  After:
  ```javascript
  const app = muster({
    firstName: 'Bob',
    lastName: error('Some error'),
  });

  await app.resolve(query(root(), {
    firstName: key('firstName'),
    lastName: key('lastName'),
  })); // ===  new Error('Some error')
  ```
- Renamed `deferred()` node to `defer()`.
- Removed `muster-history` package - this is now fully handled by a single muster node `location()`.
- Removed `muster-navigation` package.
- Renamed `template()` node to `format()`.
- Removed `withIndex()` node.
- Removed `defaultValue` arguments from `placeholder()` and `itemPlaceholder()` nodes.
- Changed the value to which the `nil()` resolves to from `null` to `undefined`. This should help with using `defaultProps` in React.
- Refactored the `location()` node by replacing the `json` option with an `encoding: 'json'`.
  The `encoding` option now takes following values: `'json'`, `'base64'`, or a custom encoder object:
  ```javascript
  location({
    encoding: {
      encode(value) { return btoa(value); }, // Return a string with an encoded value
      decode(value) { return atob(value); }, // Return a decoded object
    },
  })
  ```
- Changed the `get()` node so that it no longer support `key()` node - this was a legacy feature.
- Refactored the `computed()` node to be just a thin function wrapper on top of the `resolve()` node.
  The API of the `computed()` factory remains unchanged.
- Changed the `messageListenerDecorator()` API to support manual disposal of the decorator.
- Removed the ability to create a `call()` node with a following syntax:
  ```javascript
  call(ref('user'), 'doSomething', ['some', 'arguments']);
  // and
  call(ref('user'), 'doSomethingElse')
  ```  
- Changed the `createCaller()` and `createSetter()` API to allow passing in an optional dispose emitter. This emitter will let Muster know that the call and set should be cancelled if it is in progress.
- Removed the `log` configuration option of `fromStreamMiddleware`. To log requests/responses use the `logMiddleware()`.
- Changed the behaviour of `log` configuration option of `xhrMiddleware`. Now it enables logging of request headers. To log requests/responses use the `logMiddleware()`.
- Changed the return value of the `query()` node from nested `tree()` to a plain `value()` node. The legacy behaviour of the `query()` node is now handled by the newly introduced `legacyQuery()` node. This node is used as a compatibility layer with older versions of Muster, and new code should not use the `legacyQuery()` node.
- Changed the name of `muster-express` package to `muster-server`.
- Changed the `musterExpress` to no longer be a default export from the `muster-server` package.
  ```javascript
  // How it was before the change
  import musterExpress from '@dws/muster-express';
  // After the change
  import { musterExpress } from '@dws/muster-server';
  ```

### 🚨 Deprecations

- Renamed `treeToObject` helper to `valueOf`. `treeToObject` now prints a deprecation warning when used.
- Deprecated `apply({ root, path }, args)` and `apply(root, path, args)` in favour of `apply(ref(...), args)`
- Renamed `graph` helper to `toNode`. `graph` helper will now print a deprecation warning message.
- Replaced `objectToTree` helper with `toNode`. `objectToTree` helper will now print a deprecation warning message.
- Deprecated `data` property in the `createContainer()` in favour of `graph` property:
  
  Before:
  ```javascript
  createContainer({
    data: { firstName: 'Bob' },
    props: { firstName: types.string },
  })
  ```
  After:
  ```javascript
  createContainer({
    graph: { firstName: 'Bob' },
    props: { firstName: types.string },
  })
  ```
- Deprecated the `createContainer()` function in favour of a `container()` function.
- Deprecated `ref([...args])` in favour of `ref(...args)`.
- Deprecated `relative([...args])` in favour of `relative(...args)`.
- Deprecated `global([...args])` in favour of `global(...args)`.
- Deprecated the `collection()` node in favour of the `applyTransforms()` node.
- Deprecated the `getItems()` node in favour of the `applyTransforms()` node.
- Deprecated the `strlen()` node in favour of the `length()` node. The `strlen()` node now uses the `length()` node to perform the logic.

### 🚀 New Features

- Changed the `runScenario` so that tests without `assert` and `expected` now check if the `input` resolved to an error node.
- Added `choose()` node:
  ```javascript
  choose([
    when(and(ref('isLoggedIn'), ref('isOnline')), 'Logged in'),
    when(ref('isLoggedIn'), 'Logged in (no connectivity)'),
    when(ref('isOnline'), 'Log in'),
    otherwise('No connectivity'),
  ])
  ```
- Added `switchOn()` node:
  ```javascript
  switchOn(ref('lang'), [
    when('en', 'Welcome'),
    when('de', 'Willkommen'),
    when('fr', 'Bienvenue'),
    when('es', 'Bienvenido'),
    otherwise('Welcome'),
  ])
  ```
- Added `pattern()` node for pattern-matching in `switchOn()` node:
  ```javascript
  switchOn(ref('basketTotal'), [
    when(pattern(_ => gte(_, 75)), 'Free priority shipping!'),
    when(pattern(_ => gte(_, 50)), 'Free shipping'),
    when(0, 'Empty basket'),
    otherwise('Add more items to qualify for free shipping'),
  ])
  ```
- Added `fetchItems` node. This node is used when creating a collection with transforms that need to be run locally, and
  not sent over the wire like they are without `fetchItems` node:
  ```javascript
  collection(
    fetchItems(ref('remote', 'users')), // Ref to a remote users collection
    [
      map((user) => tree({ name: get(user, 'firstName') })), // This transform will be applied locally
    ],
  )
  ```
- Added `clamp` node:
  ```javascript
  clamp(5.2, { min: 5, max: 6 }) // === value(5.2)
  clamp(4.9, { min: 5, max: 6 }) // === value(5)
  clamp(6.1, { min: 5, max: 6 }) // === value(6)
  ```
- Added `ceil` node:
  ```javascript
  ceil(5.2) // === value(6)
  ceil(ref('tenPointFive')) // == value(11)
  ```
- Added `floor` node:
  ```javascript
  floor(5.2) // === value(5)
  floor(ref('tenPointFive')) // == value(10)
  ```
- Added `max` node:
  ```javascript
  max(1.5, 1, ref('five')) // === value(5)
  ```
- Added `min` node:
  ```javascript
  min(1.5, 1, ref('minusFive')) // === value(-5)
  ```
- Added `round` node:
  ```javascript
  round(5.3) // === value(5)
  round(5.6) // === value(6)
  ```
- Added `quote` node.
- Added `push`, `pop`, `shift`, `unshift`, `addItemAt`, `removeItemAt`, `length` and mutable `array` nodes.
  This enables a new syntax when pushing an item to a local in-memory collection:

  ```javascript
  muster({
    people: array([ // `array` is a mutable collection. By default muster will create an immutable `items` collection.
      { firstName: 'Lizzie', lastName: 'Ramirez' },
      { firstName: 'Charlotte', lastName: 'Schneider' },
    ]),
  });

  // Example mutable collection operations
  push(ref('people'), toNode({ firstName: 'Genevieve', lastName: 'Patrick' })); // === ok()
  pop(ref('people')); // === tree({ firstName: value('Genevieve', lastName: value('Patrick') }
  unshift(ref('people'), toNode({ firstName: 'Myrtle', lastName: 'Sims' })); // === ok()
  shift(ref('people')); // === tree({ firstName: value('Myrtle'), lastName: value('Sims') })
  addItemAt(ref('people'), toNode({ firstName: 'Margot', lastName: 'James' }), 2); // === ok()
  removeItemAt(ref('people'), 2); // === ok()
  length(ref('people')); // === value(2)
  ```
- Revamped muster-react `runScenario()` test runner
- Added `combineLatest()` node, which joins multiple input values into a combined `array()` output:
  ```javascript
  muster({
    primary: variable('red'),
    secondary: variable('green'),
    tertiary: variable('blue'),
    themeColors: combineLatest([
      ref('primary'),
      ref('secondary'),
      ref('tertiary'),
    ]),
  })
  ```
- Added `clear()` node, which empties mutable arrays:
  ```javascript
  muster({
    users: arrayList(['Alice', 'Bob', 'Charles']),
  })

  clear(ref('users')) // === ok()
  ```
- Added `types.recursive()` type matcher:

  ```javascript
  var tree = types.recursive((ref) => types.shape({
    value: types.string,
    children: types.arrayOf(ref),
  }));
  ```
- Added a `querySet()` node, which serves as a more low-level version of a query node. It comes with a number of possible
  QuerySet operations:
  - `querySetCallOperation()` - Instructs the `querySet()` to do a `call()` of a target node.
  - `querySetGetChildOperation()` - Instructs the `querySet()` to do a `getChild()` on a target node.
  - `querySetGetItemsOperation()` - Instructs the `querySet()` to do a `getItems()` on a target node.
  - `querySetOperation()` - Instructs the `querySet()` to run a custom graph operation.
  - `querySetSetOperation()` - Instructs the `querySet()` to do a `set()` on a target node.
  
  In most cases these operations can be chained to create more complex behaviour:
  
  ```javascript
  query(root(), {
    user: key('user', {
      firstName: key('firstName'),
      lastName: key('lastName'),
    }),
  });
  ```
  Is similar to:
  ```javascript
  querySet(root(), [
    querySetGetChildOperation(getChildOperation('user'), [
      querySetGetChildOperation(getChildOperation('firstName'), [
        querySetOperation(resolveOperation()),
      ]),
      querySetGetChildOperation(getChildOperation('lastName'), [
        querySetOperation(resolveOperation()),
      ]),
    ]),
  ])
  ```
  The result of resolving the above `querySet()` is non-traversable, as it resolves to a nested `array()` node.
- Added a `querySetResult()` node, which enables traversal of the `querySet()` result.
- Added a `takeLast()` node, which works similarly to `combineLatest()`, but instead of returning an array of results it
  returns a value of the last dependency, while keeping a subscription to all of the dependencies.
  ```javascript
  muster({
    updateName: action(function *(name) {
      yield set('name', name);
    }),
    name: variable('Initial name'),
  });
- Added a `groupBy()` collection transform. This transform is used when grouping items by a given predicate. The result
  of this transform is an array of arrays containing different groups of items. Consider an example:
  ```javascript
  muster({
    items: [
      { category: 'vegetable', name: 'carrot' },
      { category: 'fruit', name: 'apple' },
      { category: 'fruit', name: 'plum' },
      { category: 'vegetable', name: 'potato' },
      { category: 'confectionery', name: 'chocolate' },
    ],
    groupedItems: collection(
      ref('items'),
      [groupBy((item) => get(item, 'category'))],
    ),
  })
  ```
  The `groupedItems` collection has following items:
  ```javascript
  array([
    array([
      { category: 'vegetable', name: 'carrot' },
      { category: 'vegetable', name: 'potato' },
    ]),
    array([
      { category: 'fruit', name: 'apple' },
      { category: 'fruit', name: 'plum' },
    ]),
    array([{ category: 'confectionery', name: 'chocolate' }])
  ])
  ```
- Added a `removeItem()` node. This node is used when removing an item from an `arrayList()`.
  ```javascript
  // Given a graph:
  muster({
    people: arrayList([
      { name: 'Sarah' },
      { name: 'Jane' },
      { name: 'Kate' },
    ]),
  });
  // Remove `Kate` from the list of people
  removeItem(ref('people'), ref('people', last()));
  // Remove `Jane` from the list of people
  removeItem(ref('people'), head(getItems(ref('people'), [
    filter((person) => eq(get(person, 'name'), 'Jane'))
  ])));
  ```
- Added a `removeItems()` node. This node is used to remove matching items from an `arrayList()`.
  ```javascript
  // Given a graph:
  muster({
    tasks: arrayList([
      { description: 'First task', completed: true },
      { description: 'Second task', completed: false },
      { description: 'Third task', completed: true },
    ]),
  });
  // Remove completed tasks from the list of tasks
  removeItems(ref('tasks'), (item) => get(item, 'completed'))
  ```
- Added a validation layer to every node factory which ensures that a node is created with a correct properties.
- Added query shape validation: query shape must specify a valid subset of the target graph shape
  ```javascript
  muster({
    user: {
      firstName: 'John',
      lastName: 'Doe',
    },
  });

  query(root, { user: true }); // Throws: "Invalid query: missing child fields (path: ["user"])"
  query(root, { user: { firstName: true, lastName: true } }); // Works correctly
  ```
- Added `withScope()` node. This node can used in combination with the `scope()` node to allow evaluation of arbitrary queries within a sandbox scope.
  ```javascript
  // Given a graph:
  muster({
    private: value('secret'),
    sandbox: scope({
      todos: arrayList([]),
      addTodo: fn((item) => push(ref('todos'), item)),
    }),
  });
  // Evaluate an arbitrary expression within the sandboxed scope
  const query1 = call('addTodo', ['First item']);
  withScope(ref('sandbox'), query1);
  // The expression cannot access anything outside the sandboxed scope
  const query2 = call('addTodo', [ref('private')]);
  withScope(ref('sandbox'), query2); // Error: "Invalid child key: "private"
  ```
- Added a `wildcard` operation, which can be used to implement handling for any operation type.
- Added `pow()` node:
  ```javascript
  await app.resolve(pow(5, 2)); // === 25
  ```

- Added `sqrt()` node:
  ```javascript
  await app.resolve(sqrt(4)); // === 2
  ```

- Added `isNil()` node:
  ```javascript
  await app.resolve(isNil(value(true))); // === false
  await app.resolve(isNil(nil())); // === true
  ```

- Changed `deferred()` node to support custom fallback values for `pending()` branches. A fallback can be defined as
  a node or a function that takes previous node and returns a new node.

- Added ability to specify fallback values from Muster React `propTypes.defer()`. The fallback value can be of any shape,
  but ultimately must be a node that can be run through the `valueOf()` helper (e.g. `value()`, `tree()` and `array()` nodes):
  ```javascript
  createContainer({
    graph: {
      // ...
    },
    props: {
      user: propTypes.defer('Loading...', {
        firstName: types.string,
        lastName: types.string,
      }),
    },
  })
  ```

- Added ability to catch errors in specific parts of the query with the use of the `catchError()` node:
  ```javascript
  query(root(), {
    user: catchError(value('Could not load user'), {
      firstName: key('firstName'),
      lastName: key('lastName'),
    }),
  });
  ```

- Added ability to catch leaf/branch errors in the definition of the component props:
  ```javascript
  createContainer({
    graph: {
      user: error('Some error'),
    },
    props: {
      user: propTypes.catchError('Could not load user', {
        firstName: types.string,
        lastName: types.string,
      }),
    },
  })
  ```
- Added a `Redbox React`-style error panel for components created with `createContainer()`. This panel is shown every time a component without a custom `renderError` function receives an error, and the instance of muster to which it is connected is in `debug: true` mode (which is by default set to true). To disable this behaviour either set a custom `renderError`, or set `debug: false` on the muster instance.
- Added `simpleContainer()` function, which can be used to create a container without a local component graph.
  Such container will load all of its props from the global application graph.

  ```javascript
  // Given a global graph:
  const app = muster({
    views: {
      user: {
        firstName: 'Bob',
        lastName: 'Smith',
      },
    },
  });

  // One can create a simple container that loads the user's first and last names
  const simpleContainer = simpleContainer({
    views: {
      user: {
        firstName: true,
        lastName: true,
      },
    },
  });

  // Optionally a query prefix can be defined, if all props are located within a nested path in the graph
  const simpleContainer = simpleContainer(['views', 'user'], {
    firstName: true,
    lastName: true,
  });
  ```

- Added ability to define custom `getType` implementations for every NodeType.
- Added a `relaxPropsValidation` parameter to the `container()` function. This parameter downgrades the severity of prop validation errors from error to a warning.
- Added ability to call actions defined on an item through a `proxy()` and a `remote()` node.
- Added ability to validate value of the `variable()` node using Muster types.
- Improved the performance of Muster collections and queries by about 27%.
- Implemented the `applyTransforms()` node, which replaces both `collection()` and `getItems()`.
- Changed the implementation of the `length()` node to allow getting a length of a value node:
  ```javascript
  ref('user', 'firstName', length())
  // or
  length(ref('user', 'firstName'))
  // or
  strlen(ref('user', 'firstName'))
  ```
- Added ability to serialize and de-serialize Muster type matchers.
- Added ability to see dynamic branch matchers, and make subscriptions to them in the Muster DevTools.
- Added ability to name arguments in `action()` node:
  ```javascript
  action(({ firstName, lastName }) => { /* ... */})
  // and then call it like this
  call(ref('myActionWithNamedArgs'), {
    firstName: 'Kate',
    lastName: 'Jonson',
  })
  // or apply
  apply({
    firstName: 'Kate',
    lastName: 'Jonson',
  }, ref('myActionWithNamedArgs'))
  ```
- Added ability to name arguments in `fn()` node:
  ```javascript
  fn(['firstName', 'lastName'], ({ firstName, lastName }) => {/* ... */})
  // and then call it like this
  call(ref('myActionWithNamedArgs'), {
    firstName: 'Kate',
    lastName: 'Jonson',
  })
  // or apply
  apply({
    firstName: 'Kate',
    lastName: 'Jonson',
  }, ref('myActionWithNamedArgs'))
  ```
- Added a new package: **muster-remote**. This contains a replacement for the existing `remote` node in Muster, with added support for streaming connections using WebSockets.
  ```javascript
  import { remote } from '@dws/muster-remote';
  
  const graph = {
    server: remote('ws://server:8999', { useSockets: true })
  };
  ```
- Added support for socket streaming connections to **muster-express**.
  ```javascript
  import { default as express } from 'express';
  import * as http from 'http';
  import { socketConnect } from '@dws/muster-server';

  const graph = muster(/*...*/);
  
  const server = http.createServer(express());
  const wss = new WebSocket.Server({ server });
  wss.on('connection', (ws) => {
    socketConnect(graph, ws);
  });
  
  server.listen(process.env.PORT || 8999);
  ```
- Added a `logMiddleware()`. This middleware is used for enabling logging of requests/responses. By default it uses the `console.log` as a target, but can be configured to use a custom function.
- Added a `partial()` node, which can be used to create partially applied functions. This node works with both named and positional arguments.
  ```javascript
  const app = muster({
    greet: action((name) => `Hello, ${name}!`),
    greetBob: partial(ref('greet'), ['Bob']),
  });

  await app.resolve(call('greetBob'));
  // === 'Hello, Bob!'

  await app.resolve(call('greetBob', ['Alice']));
  // === 'Hello, Bob!'
  ```
- Added an `optimistic()` node, which can be used as a wrapper for a `settable` node.
- Added a `isUpdating()` node, which can be used to check if the target node is in process of 
  optimistically setting the value of the underlying settable node.  
- Added a new package: **muster-worker**. This supports creating and running a graph in a standalone worker thread. 

  `my.worker.js`:

  ```javascript
  import muster from '@dws/muster';
  import { workerConnect } from '@dws/muster-worker';
  
  const graph = muster({
    // ...
  });
  
  workerConnect(graph, self);
  ```
  
  App:

  ```javascript
  import muster, { ref } from '@dws/muster';
  import { worker } from '@dws/muster-worker';
  
  const clientApp = muster({
    worker: worker('./my.worker.js'),
    // ...
  });
  ```
  See the package README for more details.
- Added ability to yield named nodes from generator `action()`:
  ```javascript
  action(function* () {
    const { first, last } = yield {
      first: ref('firstName'),
      last: ref('lastName'),
    };
    // Do the logic here
  })
  ```

### 💅 Polish

- Improved the speed `graph-hash` functions.
- Added documentation for the `strlen` node.
- Improved `muster-payground` by sharing the same muster graph between the `Query Result` and `Muster-React Result` windows.
- Added compatibility with newer versions of React - use new lifecycle methods with a backwards compatible polyfill.
- Improved the way `valueOf()` handles `error()` nodes. Now it returns a `new Error()` with the correct message, stack
  and all data properties assigned to the error:
  ```javascript
  valueOf(error('Error message', {
    code: 'error code',
    data: {}
  }));
  // returns
  Object.assign(new Error('Error message'), {
    code: 'error code',
    data: {}
  });
  ```
- Improved the way `action()` generators handle exceptions: all `error()` exceptions are first run through
  the `valueOf()` helper before passing it to the generator function.
  ```javascript
  muster({
    thisResolvesToError: error('Some error', {
      code: '123',
      data: { some: 'value' },
    }),
    someAction: action(function* () {
      try {
        yield ref('thisResolvesToError');
      } catch (ex) {
        // ex === new Error('Some error')
        // ex.code === '123'
        // ex.data === { some: 'value' }
      }
    })
  });
  ```
- Increased the maximum operation count to 9,999,999 to allow for handling of larger collections of items
- Optimised the way `GraphActions` are added to the resolution queue in the `store`. On average this improves the performance by about 15%.
- Improved the implementation of `placeholder()` and `itemPlaceholder()` nodes by using wildcard operation, instead of hardcoding each operation
- Improved the implementation of `proxy()` node to support any type of graph operation
- Improved the error message shown when a Muster React component is rendered without being embedded in a Muster Provider
- Refactored the `tree()` node to use a custom `getType()` implementation
- Improved hasher performance which results in overall 30% performance boost
- Moved the `array()` node into the `collection` directory
- Improved the performance of `querySet()` node
- Improved performance of the `query()` node by around 25%. 

### 📝 Documentation

- Improved the documentation of the following nodes:
  - `location()`
  - `ref()`
  - `push()`
  - `pop()`
  - `shift()`
  - `unshift()`
  - `addItemAt()`
  - `removeItemAt()`
- Added `done()` node documentation
- Added `emptyItem()` node documentation
- Added `fetchItems()` node documentation
- Added `first()` node documentation
- Added `last()` node documentation
- Added `injectDependencies()` node documentation
- Added `itemPlaceholder()` node documentation
- Added `iteratorResult()` node documentation
- Added `length()` node documentation
- Added `nodeList()` node documentation
- Added `notFound()` node documentation
- Added `nth()` node documentation
- Added `skip()` node documentation
- Added `caller()` prop type documentation
- Added `setter()` prop type documentation
- Added `catchError()` prop type documentation
- Added `defer()` prop type documentation
- Added `getter()` prop type documentation
- Added `injected()` prop type documentation
- Added `isLoading()` prop type documentation
- Added `tree()` prop type documentation
- Added `list()` prop type documentation
- Added "Crafting Muster nodes" tutorial
- Added "Common Muster errors" docs page
- Created a modular tutorial
- Added a series of documents to help users understand Muster
- Added a series of resources including a glossary, essential nodes and a FAQ
- Added a section about WebSockets to the "Muster on the server" docs page.

### 🔧 Refactors

- Refactored the `nil()` node to utilise the `wildcard` operation.
- Upgraded the project to TypeScript 3.1.6
