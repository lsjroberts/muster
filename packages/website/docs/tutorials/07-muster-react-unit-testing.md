---
id: muster-react-testing
title: Muster React Unit Testing
---

Similarly to unit testing in Muster, Muster React comes with a set of tools used for unit testing containers built with Muster React. To keep things simple, the naming of the functions used for testing is the same as in Muster:
  - `runScenario()` - Used for defining a test suite. It allows you to define your Muster graph, as well as serves as a place to define a set of nodes to run against that graph in order to test a particular behaviour. It is also used to define a container used in this particular scenario.
  - `operation()` - Used to define an operation to run against the graph defined in the `runScenario()`, or against the container graph.

There are a few differences between `runScenario()` and `operation()` exposed from `@dws/muster-react/test` compared to the ones from `@dws/muster/test`:

### New runScenario() properties
  - `container` - a Muster React container to test.
  - `component` - a React component that will be used to render the UI part of the component
  - `shallow` - a property used only when `component` is set; forces a shallow render of the component
  - `expected` - a property containing expected `props`, `snapshot` and the `graph` after the initial render of the component. Can be used to check if the component's props have correct value on initial render, or even if the initial render happened.
  - `assert` - a function that allows for custom assertions. It takes one argument, which has the same shape as the `expected` property.

### New operation() properties 
  - `input` - just like in normal Muster Test it allows declaring a node to be resolved against the global graph, or can be declared as a function which has one argument (a last result of resolving that component - has the same shape as an object used to compare against the `expected`).
  - `expected` - same as in the `runScenario()`, it is a property containing expected `props`, `snapshot`, `graph`, and additionally a `value`, which contains the result of the `input` operation.
  


## Structuring component code

When making React applications with Muster React we recommend keeping the container code separate from the component code. React recommends keeping your components in a `components` directory, where each child of that directory is a separate component. Applications build with Muster React should follow the same directory structure, and keep the container code alongside a given component. To illustrate that let's take a look at example `Profile` component:

### Directory structure
```
- components
  - profile
    - index.js
    - profile.js
    - profile.container.js
```

### components/profile/profile.js
```jsx harmony
import React from 'react';

export default function Profile({ firstName, lastName }) {
  return (
    <section>
      <h1>Hello {firstName} {lastName}</h1>
    </section>
  );
}
```

### components/profile/profile.container.js
```js
import { container } from '@dws/muster-react';

export default container({
  graph: {
    firstName: 'Bob',
    lastName: 'Smith',
  },
  props: {
    firstName: true,
    lastName: true,
  }
});
```

### components/profile/index.js
```js
import Profile from './profile';
import ProfileContainer from './profile.container';

export default ProfileContainer(Profile);
```

### Summary

Following this directory allows you to split the view from the graph, as well as enable unit testing graph separately from the view of that component. The `index.js` file combines both the container and the component into a connected component you can use in your app.


  
## First unit test
 
In this part of the tutorial we're going to build a simple unit test for the component from the previous chapter. As you might have noticed, the container isn't a very complex one. It has no dependencies on the global graph, and all of its nodes are simple `value()` nodes.

### Creating a test file

First we have to start with creating a test file, and import a few important things from `@dws/muster-react/test`. The recommendation is to name the file using a `<component_name>.container.spec.js` pattern, and placing it alongside the component and container code.
In our case we save the file as `'components/profile/profile.container.spec.js'`, and begin with:
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import ProfileContainer from './profile.container';

describe('profile', () => {
  // Test scenarios go here
});
```

### Declaring a test scenario

Now that we have our test file ready we can now proceed with the creation of a first test scenario. The scenario will test if a component gets correctly rendered with all the props and correct values for these props:
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import ProfileContainer from './profile.container';

describe('profile', () => {
  runScenario({
    describe: 'GIVEN a profile container',
    graph: () => muster({}),
    container: ProfileContainer,
    expected: {
      props: { // Declares an object containing expected props this test component should be rendered with
        firstName: 'Bob',
        lastName: 'Smith',
      },
    },
  });
});
``` 

This concludes our first unit test, as there's not much more we can test in this component.



## Testing interactive components

Time to introduce some interactivity to our components. To do this we're going to need a new component. Imagine we're tasked with building a task planner (something like a ToDo list), and we need a component that will handle adding new tasks to the list of tasks. The component should render an input field, which should create a new task when user hits `ENTER` key.

### new-task.js
```jsx harmony
import React from 'react';

const ENTER_KEY_CODE = 13;

export default function NewTask({ createTask, creationError, description, setDescription }) {
  return (
    <section>
      {creationError && <p>An error occurred when creating a task: {creationError.toString()}</p>}
      <input
        type="text"
        onChange={(e) => setDescription(e.currentTarget.value)}
        onKeyPress={(e) => e.keyCode === ENTER_KEY_CODE && createTask()}
        value={description}
        />
    </section>
  );
}
```

### new-task.container.js
```jsx harmony
import { action, container, fromPromise, propTypes, ref, reset, variable } from '@dws/muster-react';
import createNewTask from '../../api/create-new-task';

export default container({
  graph: {
    createTask: action(function* () {
      // Reset the creation error
      yield reset(ref('creationError'));
      // Get current description
      const description = yield ref('description');
      // Trim the description
      const trimmedDescription = (description || '').trim();
      // Check if the description is not empty
      if (trimmedDescription.length === 0) return;
      try {
        // Wait for the new task to be created
        yield fromPromise(() => createNewTask(trimmedDescription));
        // Clear the description field
        yield reset(ref('description'));
      } catch(ex) {
        // Whoops, something went wrong with creating new task
        yield set('creationError', ex);
      }
    }),
    creationError: variable(undefined),
    description: variable(''),
  },
  props: {
    createTask: propTypes.caller(),
    creationError: true,
    description: true,
    setDescription: propTypes.setter('description'),
  },
});
```
Note that the file uses a `createNewTask` function, which is implemented outside this file. It doesn't matter what it does for the moment. It might be responsible for connecting with some API and asynchronously saving it there, or it might save the task in a file, or even just stick it in the memory. All we care is that the function should return a promise, which then gets consumed by the `fromPromise()` node. The best thing is to mock that `api/create-new-task` file, and assume that it works fine. That file should have its own set of unit tests, and testing if `createNewTask` works fine should not be a part of testing the `NewTaskContaine`.

### index.js
```jsx harmony
import NewTask from './new-task';
import NewTaskContainer from './new-task.container';

export default NewTaskContainer(NewTask);
```


### Creating a test file

Similarly as with the previous unit test, let's start by importing a few things needed for the test. We will extend a list of these imports as we add more unit tests, but for now we start with just a few. Also, we will need to mock the `createNewTask()` function to make sure we can control its workings. The test file should be saved as `'components/new-task/new-task.container.spec.js'`, and look like this:
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import ProfileContainer from './profile.container';
import createNewTask from '../../api/create-new-task';

// Mock the createNewTask() function
jest.mock('../../api/create-new-task', () => jest.fn());

describe('new-task', () => {
  // Test scenarios go here 
});
```

### Planning test scenarios

Before starting to write the tests it's always good to figure out what scenarios we'd like to cover. The first thing that might come to mind is testing the so-called "Happy path", meaning that everything went well. This however covers only a very narrow spectrum of possibilities. After covering the happy path it's always good to check the common errors that might occur. In our example one possibility is for the user to hit 'ENTER' when the description is empty. Ideally we don't want to create tasks with empty description. Similarly, we want to prevent the ability of creating a task with a description that consists only of white-space characters. Also, our code should be resilient to failures caused by the `createNewTask()` function.

To summarise this, here's a list of possible test cases to test:
  - The description is correct and everything worked fine (Happy path)
  - The description is empty; should not call the `createNewTask()`
  - The description consists only of white-space characters; should not call the `createNewTask()`
  - The description is correct, but the `createNewTask()` has resolved to a rejected promise

### Test "Happy Path"
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import ProfileContainer from './profile.container';
import createNewTask from '../../api/create-new-task';

// Mock the createNewTask() function
jest.mock('../../api/create-new-task', () => jest.fn());

describe('new-task', () => {
  describe('Test successful creation of new task with non-empty description', () => {
    runScenario({
      description: 'GIVEN a ProfileContainer',
      before() {
        // Make sure the `createNewTask()` function returns a promise!
        createNewTask.mockReturnValue(Promise.resolve());
      },
      graph: () => muster({}),
      container: ProfileContainer,
      expected: {
        props: {
          createTask: expect.any(Function),
          creationError: undefined,
          description: '',
          setDescription: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN the setDescription is called',
          input: (data) => data.props.setDescription('First task'),
          expected: {
            props: expect.objectContaining({
              description: 'First task',
            }),
          },
          operations: [
            operation({
              description: 'AND then the createTask is called',
              before() {
                // Good to do this before calling something that should affect our mock function
                jest.clearAllMocks();
              },
              input: (data) => data.props.createTask(),
              expected: {
                props: expect.objectContaining({
                  creationError: undefined,
                  description: '',
                }),
              },
              assert() {
                expect(createNewTask).toHaveBeenCalledTimes(1);
                expect(createNewTask).toHaveBeenCalledWith('First task');
              },
            }),
          ],
        }),
      ],
    });
  });
});
```
The test scenario we just created start with a `runScenario`, which expects the test component to be rendered with props that contain a `createTask` property which is a function (note the use of Jest's `expect.any(Function)`), `creationError` property being undefined, `description` set to empty string, and a `setDescription` function. This should cover the case of initial render of the component. Note that the `runScenario()` starts with `begin()` which sets the return value of the `createNewTask()` mock. This ensures that the function returns a resolved promise, and the code that expects it to return promise won't throw errors.

In the first child operation (`WHEN the setDescription is called`) we call the `setDescription` function that was passed as a prop to our component in the initial render with a `'First task'` string. After doing that we're expecting our component to be re-rendered with props that contain a `description` prop which is now set to `'First task'` string. To save some typing we used `expect.objectContaining()` matcher from Jest.

Following that, the next operation to do (after calling the `setDescription` function) is to call the `createTask()` function. This should cause another re-render of the component with `creationError` still set as undefined and the `description` property cleared out. One more thing that remains to be tested is to check if the `createNewTask()` mock was called with correct arguments.

This concludes the Happy Path part of our tests.  

### Test calling createTask() with empty description
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import ProfileContainer from './profile.container';
import createNewTask from '../../api/create-new-task';

// Mock the createNewTask() function
jest.mock('../../api/create-new-task', () => jest.fn());

describe('new-task', () => {
  // ...
  
  describe('Test calling `createTask()` with empty description', () => {
    runScenario({
      description: 'GIVEN a ProfileContainer',
      before() {
        // Make sure the `createNewTask()` function returns a promise!
        createNewTask.mockReturnValue(Promise.resolve());
      },
      graph: () => muster({}),
      container: ProfileContainer,
      expected: {
        props: {
          createTask: expect.any(Function),
          creationError: undefined,
          description: '',
          setDescription: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'AND then the createTask is called',
          before() {
            // Good to do this before calling something that should affect our mock function
            jest.clearAllMocks();
          },
          input: (data) => data.props.createTask(),
          expected: {
            props: expect.objectContaining({
              creationError: undefined,
              description: '',
            }),
          },
          assert() {
            expect(createNewTask).not.toHaveBeenCalled();
          },
        }),
      ],
    });
  });
});
```
This test checks what happens when the `createTask()` function is called when the description is empty. The expected behaviour is for the description to remain empty, the `creationError` to remain undefined, and for the `createNewTask` function not to be called.

### Test calling createTask() with white-space description
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import ProfileContainer from './profile.container';
import createNewTask from '../../api/create-new-task';

// Mock the createNewTask() function
jest.mock('../../api/create-new-task', () => jest.fn());

describe('new-task', () => {
  // ...
  describe('Test calling `createTask()` with white-space description', () => {
    runScenario({
      description: 'GIVEN a ProfileContainer',
      before() {
        // Make sure the `createNewTask()` function returns a promise!
        createNewTask.mockReturnValue(Promise.resolve());
      },
      graph: () => muster({}),
      container: ProfileContainer,
      expected: {
        props: {
          createTask: expect.any(Function),
          creationError: undefined,
          description: '',
          setDescription: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN the setDescription is called',
          input: (data) => data.props.setDescription('    '),
          expected: {
            props: expect.objectContaining({
              description: '    ',
            }),
          },
          operations: [
            operation({
              description: 'AND then the createTask is called',
              before() {
                // Good to do this before calling something that should affect our mock function
                jest.clearAllMocks();
              },
              input: (data) => data.props.createTask(),
              expected: {
                props: expect.objectContaining({
                  creationError: undefined,
                  description: '    ',
                }),
              },
              assert() {
                expect(createNewTask).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });
});
```
This test follows the same pattern as the **Test "Happy Path"** test but with one difference - it expects the `createNewTask()` function **not** to be called.

### Test createNewTask() error handling
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import ProfileContainer from './profile.container';
import createNewTask from '../../api/create-new-task';

// Mock the createNewTask() function
jest.mock('../../api/create-new-task', () => jest.fn());

describe('new-task', () => {
  // ...
  describe('Test handling createNewTask promise rejection', () => {
    runScenario({
      description: 'GIVEN a ProfileContainer',
      before() {
        // Make sure the `createNewTask()` function returns a promise
        createNewTask.mockReturnValue(Promise.reject('Some test error'));
      },
      graph: () => muster({}),
      container: ProfileContainer,
      expected: {
        props: {
          createTask: expect.any(Function),
          creationError: undefined,
          description: '',
          setDescription: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN the setDescription is called',
          input: (data) => data.props.setDescription('First task'),
          expected: {
            props: expect.objectContaining({
              description: 'First task',
            }),
          },
          operations: [
            operation({
              description: 'AND then the createTask is called',
              before() {
                // Good to do this before calling something that should affect our mock function
                jest.clearAllMocks();
              },
              input: (data) => data.props.createTask(),
              expected: {
                props: expect.objectContaining({
                  creationError: 'Some test error',
                  description: 'First task',
                }),
              },
              assert() {
                expect(createNewTask).toHaveBeenCalledTimes(1);
                expect(createNewTask).toHaveBeenCalledWith('First task');
              },
            }),
          ],
        }),
      ],
    });
  });
});
```
This time the mock version of the `createNewTask()` returns a promise that gets rejected with a `'Some test error'` message. In the final operation (**AND then the createTask is called**) the expected props now expect `creationError` to equal `'Some test error'`, and the `description` to remain as before calling the `createTask()` function.



## Testing components with connection to global graph

So far we've covered testing self-contained components that have no dependencies on the global graph. This chapter shows how to test components that depend on nodes from global graph.

 Let's revisit the example from the previous chapter, and instead of using an external function `createNewTask()`, let's store the tasks in a globally available `arrayList()`. This means that calling `createTask()` should now push a new item into the `tasks` node.
 
 ### new-task.js
```jsx harmony
import React from 'react';

const ENTER_KEY_CODE = 13;

export default function NewTask({ createTask, creationError, description, setDescription }) {
  return (
    <section>
      {creationError && <p>An error occurred when creating a task: {creationError.toString()}</p>}
      <input
        type="text"
        onChange={(e) => setDescription(e.currentTarget.value)}
        onKeyPress={(e) => e.keyCode === ENTER_KEY_CODE && createTask()}
        value={description}
        />
    </section>
  );
}
``` 
> This file remained unchanged compared to the one from the previous chapter.

### new-task.container.js
```js
import { action, container, global, push, propTypes, ref, reset, variable } from '@dws/muster-react';

export default container({
  graph: {
    createTask: action(function* () {
      // Get current description
      const description = yield ref('description');
      // Trim the description
      const trimmedDescription = (description || '').trim();
      // Check if the description is not empty
      if (trimmedDescription.length === 0) return;
      // Wait for the new task to be created
      yield push(ref(global('tasks')), description);
      // Clear the description field
      yield reset(ref('description'));
    }),
    description: variable(''),
  },
  props: {
    createTask: propTypes.caller(),
    description: true,
    setDescription: propTypes.setter('description'),
  },
});
```
Note that the `creationError` branch along with the accompanying prop is now gone. Also, the implementation of the `createTask` action now pushes the description directly into the `ref(global('tasks'))` node, instead of using asynchronous `createNewTask()` function.

### index.js
```jsx harmony
import NewTask from './new-task';
import NewTaskContainer from './new-task.container';

export default NewTaskContainer(NewTask);
```
> This file remained unchanged compared to the one from the previous chapter.

### Creating a test file

This part of writing Muster-React unit tests should be already familiar to you. In this chapter however, we'll be adding a few additional muster node imports as we start adding unit tests.
```js
import muster from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import NewTaskContainer from './new-task.container';

describe('new-task', () => {
  // Test scenarios go here 
});
```

### Planning test scenarios

Just like in the previous chapter, before starting the process of writing the tests let's think a moment about what we want to test in our test suite. 
Here's a list of tests that should give us a decent code coverage:
  - The description is correct; an item should be added to the list of tasks
  - The description is empty; should not add any new items to the list of tasks
  - The description consists only of white-space characters; should not add any new items to the list of tasks
  
### Test adding new task
```js
import muster, { arrayList, entries, query } from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import NewTaskContainer from './new-task.container';

describe('new-task', () => {
  describe('Test adding a new task', () => {
    runScenario({
      description: 'GIVEN a NewTaskContainer and a graph with tasks arrayList',
      graph: () => muster({
        tasks: arrayList([]),
      }),
      container: NewTaskContainer,
      expected: {
        props: {
          createTask: expect.any(Function),
          description: '',
          setDescription: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN the setDescription is called',
          input: (data) => data.props.setDescription('First task'),
          expected: {
            props: expect.objectContaining({
              description: 'First task',
            }),
          },
          operations: [
            operation({
              description: 'AND then the createTask is called', 
              input: (data) => data.props.createTask(),
              expected: {
                props: expect.objectContaining({
                  description: '',
                }),
              },
              operations: [
                operation({
                  description: 'AND then a query to get tasks is resolved',
                  input: query(ref('tasks'), entries()),
                  expected: toNode(['First task']),
                }),
              ]
            }),
          ],
        }),
      ],
    });
  });
});
```
The example above starts very similar to the tests we've done before, but with a few notable differences. The marjor difference is that now our mock Muster graph contains a `tasks` branch. This is dictated by the fact that our NewTaskContainer accesses that node inside the `createTask` action. Not declaring the `tasks` branch would result in our unit tests returning errors, which wouldn't be causes by the bad implementation of NewTaskContainer, but simply by bad unit test design. One more thing to remember is to declare the required Muster nodes with the correct type, as not doing so would also result in possible test failures. To illustrate that let's imagine if we declared the `tasks: variable([])` in our mock graph. The initial render of the component would go through without any issues. The problem would have started when we called the `createTask` action, as it expects the `task` node to support `push` operation, which `variable()` doesn't.

Next two test operations are similar to what we've done before - set description and check if the props were updated, and then call a function and see if the description was cleared.

The fun begins with the final operation - instead of declaring the `input` as a function that takes a previous result of the scenario, we declare it as a Muster node. This node is going to be resolved against the mock graph. We can use it to see if the code made in our container has made correct changes to the global graph after running a particular operation. 


### Test calling createTask() with empty description
```js
import muster, { arrayList, entries, query } from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import NewTaskContainer from './new-task.container';

describe('new-task', () => {
  // ...
  describe('Test calling createTask() with empty description', () => {
    runScenario({
      description: 'GIVEN a NewTaskContainer and a graph with tasks arrayList',
      graph: () => muster({
        tasks: arrayList([]),
      }),
      container: NewTaskContainer,
      expected: {
        props: {
          createTask: expect.any(Function),
          description: '',
          setDescription: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN then the createTask is called with empty description',
          input: (data) => data.props.createTask(),
          expected: {
            props: expect.objectContaining({
              description: '',
            }),
          },
          operations: [
            operation({
              description: 'AND then a query to get tasks is resolved',
              input: query(ref('tasks'), entries()),
              expected: toNode([]),
            }),
          ]
        }),
      ],
    });
  });
});
```
Similarly to the previous example, the final operation is to resolve a node against the global graph. However, instead of checking if an item has been added to the list of tasks, this test checks if the list of tasks remained empty.

### Test calling createTask() with white-space description
```js
import muster, { arrayList, entries, query } from '@dws/muster-react';
import { runScenario } from '@dws/muster-react/test';
import NewTaskContainer from './new-task.container';

describe('new-task', () => {
  describe('Test calling createTask() with white-space description', () => {
    runScenario({
      description: 'GIVEN a NewTaskContainer and a graph with tasks arrayList',
      graph: () => muster({
        tasks: arrayList([]),
      }),
      container: NewTaskContainer,
      expected: {
        props: {
          createTask: expect.any(Function),
          description: '',
          setDescription: expect.any(Function),
        },
      },
      operations: [
        operation({
          description: 'WHEN the setDescription is called',
          input: (data) => data.props.setDescription('    '),
          expected: {
            props: expect.objectContaining({
              description: '    ',
            }),
          },
          operations: [
            operation({
              description: 'AND then the createTask is called', 
              input: (data) => data.props.createTask(),
              expected: {
                props: expect.objectContaining({
                  description: '    ',
                }),
              },
              operations: [
                operation({
                  description: 'AND then a query to get tasks is resolved',
                  input: query(ref('tasks'), entries()),
                  expected: toNode([]),
                }),
              ]
            }),
          ],
        }),
      ],
    });
  });
});
```
The final test scenario checks what happens when a `createTask()` function is called with a description that consists only of white-space characters.


## Final words

Armed with the knowledge covered in this tutorial you should now be able to test most of Muster-React containers. The testing framework has a few more advanced features like declaring a React context values, or setting the component renderer from a basic `() => null` into a component of your choice. You can find out more about that in Muster React API docs.
