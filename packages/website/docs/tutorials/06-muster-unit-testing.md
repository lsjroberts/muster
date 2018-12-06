---
id: muster-testing
title: Muster Unit Testing
---

By design the Muster graphs can hold both synchronous and asynchronous nodes, which are usually tricky to test.  For this reason Muster comes bundled with a set of tools used for unit testing your application graphs/modules. These tools are built on top of the [Jest](https://jestjs.io/) testing framework. Similarly to building Muster graphs, the Muster Unit Tests are written in a declarative way. Muster testing framework consists of two functions exported from `'@dws/muster/test'`:
  - `runScenario()` - Used for defining a test suite. It allows you to define your Muster graph, as well as serves as a place to define a set of nodes to run against that graph in order to test a particular behaviour.
  - `operation()` - Used to define an operation to run against the graph defined in the `runScenario()`.

## Structuring application code

When making an application it is important to settle on a good directory structure, and design your code in a way that allow easy testing and adding new features. Consider a following directory structure of a React-based project:

### Directory structure
```
- <project_root>
  - components // React components
    - component1
    - component2
  // Muster graph
  - muster
    - index.js // Exports an instance of Muster application with the `graph-root.js` node as the root of your graph
    - graph-root.js // Contains the root of your graph as a Muster node
    - auth.js // Contains some imaginary auth graph
    - profile.js // Contains some imaginary profile graph
```
The reason behind splitting the `index.js` and `graph-root.js` is to allow importing the `graph-root` in your unit tests.

### muster/index.js
```js
import muster from '@dws/muster';
import graphRoot from './graph-root';

export default muster(graphRoot);
```

### muster/graph-root.js
```js
import { ref, toNode } from '@dws/muster';
import auth from './auth';
import profile from './profile';

export default toNode({
  auth,
  profile: profile({
    isLoggedIn: ref('auth', 'isLoggedIn'),
  }),
});
```

### muster/auth.js
```js
import { scope, variable } from '@dws/muster';

export default scope({
  isLoggedIn: variable(false),
  // ...
});
```

### muster/profile.js
```js
import { computed, createModule, error, ifElse, ref, toNode } from '@dws/muster';

export default createModule(
  {
    isLoggedIn: true,
  },
  ({ isLoggedIn }) => ifElse({
    if: isLoggedIn,
    then: toNode({
      firstName: 'Bob',
      lastName: 'Smith',
      fullName: computed(
        [ref('firstName'), ref('lastName')],
        (firstName, lastName) => `${firstName} ${lastName}`,
      ),
    }),
    else: error('Not logged in'),
  }),
);
```

This file uses a `createModule` function, which will be introduced in later stages of this tutorial, so don't worry if you don't understand what is it's purpose.



## First unit test

Now that we have directory structure out of the way let's make a first unit test. To do this we'll need an example Muster graph to test:

### muster/graph-root.js

First thing to do is define an application graph. To make things simple the graph below has a single branch `firstName` with a `value('Bob')`.

```js
import { toNode } from '@dws/muster';

export default toNode({
  firstName: 'Bob',
});
```

### muster/graph-root.spec.js

```js
import muster, { ref, value } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import graphRoot from './graph-root';

describe('Test graphRoot', () => {
  // Begin test scenario
  runScenario({
    description: 'GIVEN a graph with first name',
    graph: () => muster(graphRoot), 
    operations: [
      // Declare test case
      operation({
        description: 'WHEN resolving a `ref("firstName")`',
        input: ref('firstName'),
        expected: value('Bob'),
      }),
    ],
  });
});
```
The test file begins with a bunch of Muster imports, and a statement that imports our graph to test. This imported graph root is then used in our first unit test scenario (`graph: () => muster(graphRoot)`).

The definition of the Muster Unit Test scenario contains the description of the test, a function that returns a Muster instance with the graph that is going to be used for testing, and an array of operations to run against that graph. As our graph is very simple we have only one operation.

The operation consists of a description of what it does, input (a Muster node to resolve against the graph), and (optionally) expected result. The result is always going to be a Muster node.



## Running multiple operations

As mentioned before, the scenario takes an array of operations to run against the Muster graph. These operations don't interfere with each-other, as before running each top-level scenario operation the graph is re-created using the `graph()` function declared on the test scenario:

### muster/graph-root.js
```js
import { toNode, variable } from '@dws/muster';

export default toNode({
  firstName: variable('Bob'),
});
```

### muster/graph-root.spec.js
```js
import muster, { ref, set, value } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import graphRoot from './graph-root';

describe('Test graphRoot', () => {
  // Begin test scenario
  runScenario({
    description: 'GIVEN a graph with first name',
    graph: () => muster(graphRoot), 
    operations: [
      // Test setting the value of `firstName`
      operation({
        description: 'WHEN setting the value of `firstName`',
        input: set('firstName', 'Jane'),
        expected: value('Jane'),
      }),
      // Test getting the default value of `firstName`
      operation({
        description: 'WHEN resolving a `ref("firstName")`',
        input: ref('firstName'),
        expected: value('Bob'), // The set() from previous operation won't affect this test
      }),
    ],
  });
});
```
The test execution flow for this example looks like this:

1. Initialise Muster graph by calling`graph()` function
2. Run operation **WHEN setting the value of `firstName`'**
3. Initialise Muster graph by calling `graph()` function
4. Run operation **WHEN resolving a `ref("firstName")`'**



## Running code before and after scenario and operation

Similarly to the [Jest](https://jestjs.io/) testing framework `runScenario()` and `operation()` allow defining code blocks to be run before/after given scenario/operation. These functions can be synchronous or asynchronous (depending on your use case). These functions can be used to clean [Jest](https://jestjs.io/) mocks, or do some test-specific logic.

### muster/graph-root.spec.js
```js
import muster, { ref, value } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';

describe('Use `before` and `after` functions', () => {
  runScenario({
    description: 'GIVEN a graph with a fistName',
    before() {
      console.log('Scenario start');      
    },
    after() {
      console.log('Scenario end');      
    },
    graph: () => muster({
      firstName: 'Kate',
    }),
    operations: [
      operation({
        description: 'WHEN getting firstName',
        async before() {
          await Promise.resolve();
          console.log('Operation start');
        },
        after() {
          console.log('Operation end');
        },
        input: ref('firstName'),
        expected: value('Kate'),
      }),
    ],
  });
});
```

The test execution flow for this example looks like this:

1. Call scenario.before, which runs `console.log('Scenario start')`
2. Initialise Muster graph by calling `graph()` function
3. Call operation.before, which runs `console.log('Operation start')`
4. Resolve node `ref('firstName')`
5. Call operation.after, which runs `console.log('Operation end')`
6. Call scenario.after, which runs `console.log('Scenario end')`



## Custom assertions

Aside from checking if a given node resolves to a specific node, the `operation()` function allows specifying custom assertion function. This function can be used for custom assertions using [Jest](https://jestjs.io/) `expect()` function. The `assert()` function can be synchronous or asynchronous (depending on your use case). Additionally, this function receives an array of nodes to which `input` node of your `operation()` resolved to.

### muster/graph-root.spec.js
```js
import muster, { action, call } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';

describe('Example use of assert()', () => {
  let mockAction;
  
  runScenario({
    description: 'GIVEN a graph containing an action',
    before() {
      mockAction = jest.fn(() => 'Hello world');
    },
    graph: () => muster({
      getHelloWorld: action(mockAction),
    }),
    operations: [
      operation({
        description: 'WHEN calling the `getHelloWorld` action',
        before() { jest.clearAllMocks(); }, // It's always good to clear Jest mocks before the test
        input: call('getHelloWorld'),
        expected: value('Hello world'),
        assert() {
          expect(mockAction).toHaveBeenCalledTimes(1);
        },
      }),
    ],
  });
});
```
In the example above we used the `assert()` function to check if the `mockAction` function gets called when we call the `getHelloWorld` action. Note that in this operation we also clear [Jest](https://jestjs.io/) mocks. It is a good practice to clear the mocks before a given test as other operations might interfere with this test.



## Chaining operations

The `runScenario()` allows chaining operations, which allows testing side-effects of operations. The way you do this is by adding an `operations` property to your operation. These operations will be run after that operation, and will share the same Muster graph state. Let's revisit the previous example, and design our test scenario in a way that tests the default value, and also what happens after changing it:

### muster/graph-root.spec.js
```js
import muster, { ref, set, value } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import graphRoot from './graph-root';

describe('Test graphRoot', () => {
  // Begin test scenario
  runScenario({
    description: 'GIVEN a graph with first name',
    graph: () => muster(graphRoot), 
    operations: [
      // Test getting the default value of `firstName`
      operation({
        description: 'WHEN resolving a `ref("firstName")`',
        input: ref('firstName'),
        expected: value('Bob'),
        operations: [
          // Test setting the value of `firstName`
          operation({
            description: 'AND then setting the value of `firstName`',
            input: set('firstName', 'Jane'),
            expected: value('Jane'),
            operations: [
              // Test getting the updated value of `firstName`
              operation({
                description: 'AND then again resolving `ref("firstName")`',
                input: ref('firstName'),
                expected: value('Jane'),
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
```
This particular pattern allows you checking the side-effects of your operations against the Muster graph. However, this isn't the best way of checking side effects. As you know, Muster is a library that handles the data in a reactive way. Resolving a node creates a stream that can output new values when the node or its dependencies have changed. Muster test framework takes full advantage of this fact, and allows you checking if a subscription to a particular node emitted new values.



## Reactive testing

In all of the examples above you witnessed the `operations` property of the `operation()` defined as an array of `operation()` objects. This however isn't the only type the `operations` property can take. Optionally, this property can be defined as a function that returns an array of operations, and which has one argument: a getter for a `subscriber` object used when resolving the input against the muster graph. The `subscriber` contains two properties:
  - `next`, which is a mock function that was passed into the `app.resolve(operation.input).subscribe(subscriber.next)`
  - `subscription`, the result of the `app.resolve(operation.input).subscribe(subscriber.next)`

### muster/graph-root.spec.js
```js
import muster, { ref, set, value } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import graphRoot from './graph-root';

describe('Test graphRoot', () => {
  // Begin test scenario
  runScenario({
    description: 'GIVEN a graph with first name',
    graph: () => muster(graphRoot), 
    operations: [
      // Test getting the default value of `firstName`
      operation({
        description: 'WHEN resolving a `ref("firstName")`',
        input: ref('firstName'),
        expected: value('Bob'),
        operations: (getSubscriber) => [
          // Test setting the value of `firstName`
          operation({
            description: 'AND then setting the value of `firstName`',
            before() {
              // Very important when dealing with mocks
              jest.clearAllMocks();
            },
            input: set('firstName', 'Jane'),
            expected: value('Jane'),
            assert() {
              expect(getSubscriber().next).toHaveBeenCalledTimes(1);
              expect(getSubscriber().next).toHaveBeenCalledWith(value('Jane'));
            },
          }),
        ],
      }),
    ],
  });
});
```



## Problem with cross-module dependencies

In the first section of this tutorial (**Structuring application code**) you witnessed the example of a recommended directory structure for Muster code alongside the example implementation of these modules. You might have noticed that the **muster/profile.js** file used a `createModule` function. This function will be introduced in the next section of this tutorial. For now I'm going to show you the same example without the use of it, and talk about the problems that might arise from not splitting your code into separate modules:

### muster/profile.js
```js
import { computed, error, ifElse, ref, toNode } from '@dws/muster';

export default ifElse({
  if: ref('auth', 'isLoggedIn'), // Note that this ref requires a prior knowledge of the entire graph!
  then: toNode({
    firstName: 'Bob',
    lastName: 'Smith',
    fullName: computed(
      // These refs require knowledge about where in the graph this module exists
      [ref('profile', 'firstName'), ref('profile', 'lastName')],
      (firstName, lastName) => `${firstName} ${lastName}`,
    ),
  }),
  else: error('Not logged in'),
});
```
Note that the `firstName` computed node has to specify the absolute reference to the `firstName` and `lastName` nodes. This introduces another point of failure in case we decide to refactor our graph by changing the name of the branch in which does the **profile** module exists. Similarly, we must specify the full path to the `ref('auth', 'isLoggedIn')`.

### muster/profile.spec.js
```js
import muster, { ref, value, variable } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import profile from './profile';

describe('profile', () => {
  runScenario({
    description: 'GIVEN a graph containing a profile branch, and isLoggedIn = true',
    graph: () => muster({
      auth: {
        isLoggedIn: variable(true),
      },
      profile,
    }),
    operations: [
      operation({
        description: 'WHEN getting the fullName',
        input: ref('profile', 'fullName'),
        expected: value('Bob Smith'),
      }),
    ],
  });
});
```
Note that the Muster graph must mimic the shape of the actual application graph for everything to work. We couldn't rename the `auth` branch to something else, as this would result in the failure of our test. This however can be solved with a correct use of a `scope` node and a `createModule` function, both of which are exported from `'@dws/muster'`, and which are covered in the next example. 



## Using `scope` node to simplify paths in the modules

One thing we can do to improve the quality of the code in the `muster/profile.js` from the previous example is to introduce a `scope()` node, which should help with the problem of knowing where the `profile` module is defined in the graph:

### muster/profile.js
```js
import { computed, error, ifElse, ref, scope } from '@dws/muster';

export default ifElse({
  if: ref('auth', 'isLoggedIn'), // Note that this ref requires a prior knowledge of the entire graph!
  then: scope({
    firstName: 'Bob',
    lastName: 'Smith',
    fullName: computed(
      // A change from toNode to scope improved these paths
      [ref('firstName'), ref('lastName')],
      (firstName, lastName) => `${firstName} ${lastName}`,
    ),
  }),
  else: error('Not logged in'),
});
```

The unit test for this example remains the same as before.

Introduction of the `scope()` node definitely helped with the implementation of the **profile** module, but note that we still need to know where in the graph exists the node that tells us if a user is logged in. This is where the `createModule()` helper function comes in.



## Using `createModule`

### muster/profile.js
```js
import { computed, createModule, error, ifElse, ref, toNode } from '@dws/muster';

export default createModule(
  {
    isLoggedIn: true,
  },
  ({ isLoggedIn }) => ifElse({
    if: isLoggedIn, // isLoggedIn is a node, not a value!
    then: toNode({ // Note that we don't need `scope` node, as this module gets automatically wrapped in scope() by createModule()
      firstName: 'Bob',
      lastName: 'Smith',
      fullName: computed(
        [ref('firstName'), ref('lastName')],
        (firstName, lastName) => `${firstName} ${lastName}`,
      ),
    }),
    else: error('Not logged in'),
  }),
);
```

Now that looks much better. The module we just made is easier to test, and easier to understand. We just have to make some changes to the **graph-root.js** and the **profile.spec.js**

### muster/profile.spec.js
```js
import muster, { ref, value, variable } from '@dws/muster';
import { operation, runScenario } from '@dws/muster/test';
import profile from './profile';

describe('profile', () => {
  runScenario({
    description: 'GIVEN a graph containing a profile branch, and isLoggedIn = true',
    graph: () => muster({
      isLoggedIn: variable(true),
      user: profile({
        isLoggedIn: ref('isLoggedIn'),
      }),
    }),
    operations: [
      operation({
        description: 'WHEN getting the fullName',
        input: ref('user', 'fullName'),
        expected: value('Bob Smith'),
      }),
    ],
  });
});
```

Note that now we're not forced to have the same graph structure as in our working application. 

### muster/graph-root.js

And finally, the changes to the root of the graph.

```js
import { ref, toNode } from '@dws/muster';
import auth from './auth';
import profile from './profile';

export default toNode({
  auth,
  profile: profile({
    isLoggedIn: ref('auth', 'isLoggedIn'),
  }),
});
```
