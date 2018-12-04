import { Subject } from '@dws/muster-observable';
import muster, {
  action,
  array,
  computed,
  error,
  evaluateOperation,
  fromPromise,
  fromStream,
  NodeDefinition,
  ok,
  querySetCallOperation,
  querySetGetChildOperation,
  querySetGetItemsOperation,
  querySetOperation,
  querySetSetOperation,
  ref,
  resolveOperation,
  root,
  set,
  toNode,
  value,
  variable,
  withErrorPath,
} from '../..';
import { operation, runScenario } from '../../test';
import { querySet } from './query-set';

describe('querySet()', () => {
  runScenario({
    description: 'GIVEN a graph containing a value as a root',
    graph: () => muster('Hello world'),
    operations: [
      operation({
        description: 'WHEN resolving a query set that resolves the root',
        input: querySet(root(), [querySetOperation(resolveOperation())]),
        expected: array([value('Hello world')]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a variable as a root',
    graph: () => muster(variable('Hello world')),
    operations: [
      operation({
        description: 'WHEN resolving a query set that resolves the root',
        input: querySet(root(), [querySetOperation(resolveOperation())]),
        expected: toNode(['Hello world']),
        operations: (subscriber) => [
          operation({
            description: 'AND the variable changes',
            before() {
              jest.clearAllMocks();
            },
            input: set(root(), 'Goodbye world'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(array([value('Goodbye world')]));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a computed as a root',
    graph: () => muster(computed([value('world')], (name) => `Hello ${name}`)),
    operations: [
      operation({
        description: 'WHEN resolving a query set that resolves the root',
        input: querySet(root(), [querySetOperation(resolveOperation())]),
        expected: toNode(['Hello world']),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a nested computed as a root',
    graph: () =>
      muster(
        computed([value('Hello')], (greeting) =>
          computed([value('world')], (name) => `${greeting} ${name}`),
        ),
      ),
    operations: [
      operation({
        description: 'WHEN resolving a query set that resolves the root',
        input: querySet(root(), [querySetOperation(resolveOperation())]),
        expected: toNode(['Hello world']),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a tree with some branches',
    graph: () =>
      muster({
        user: {
          name: 'Bob Jonson',
          age: computed([value('something')], () => variable(29)),
        },
      }),
    operations: [
      operation({
        description: 'WHEN resolving a query set that gets user',
        input: querySet(root(), [
          querySetGetChildOperation('user', [
            querySetGetChildOperation('name', [querySetOperation(resolveOperation())]),
            querySetGetChildOperation('age', [
              querySetOperation(resolveOperation()),
              querySetOperation(evaluateOperation()),
            ]),
          ]),
        ]),
        expected: array([array([array([value('Bob Jonson')]), array([value(29), variable(29)])])]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a tree with variable',
    graph: () =>
      muster({
        name: variable('initial value'),
      }),
    operations: [
      operation({
        description: 'WHEN resolving a querySet against that graph',
        input: querySet(root(), [
          querySetGetChildOperation('name', [querySetOperation(resolveOperation())]),
        ]),
        expected: array([array([value('initial value')])]),
        operations: (subscriber) => [
          operation({
            description: 'AND the variable changes',
            before() {
              jest.clearAllMocks();
            },
            input: set('name', 'updated value'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                array([array([value('updated value')])]),
              );
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a nested tree with variable',
    graph: () =>
      muster({
        nested: {
          name: variable('initial value'),
        },
      }),
    operations: [
      operation({
        description: 'WHEN resolving a querySet against that graph',
        input: querySet(root(), [
          querySetGetChildOperation('nested', [
            querySetGetChildOperation('name', [querySetOperation(resolveOperation())]),
          ]),
        ]),
        expected: array([
          array([
            // nested branch
            array([value('initial value')]), // name branch
          ]),
        ]),
        operations: (subscriber) => [
          operation({
            description: 'AND the variable changes',
            before() {
              jest.clearAllMocks();
            },
            input: set(ref('nested', 'name'), 'updated value'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                array([
                  array([
                    // nested branch
                    array([value('updated value')]), // name branch
                  ]),
                ]),
              );
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection of numbers',
    graph: () => muster([1, 2, 3]),
    operations: [
      operation({
        description: 'WHEN resolving a query set that gets the list of items',
        input: querySet(root(), [
          querySetGetItemsOperation({
            children: [querySetOperation(resolveOperation())],
          }),
        ]),
        expected: array([
          // Items array
          array([
            array([1]), // Item 1
            array([2]), // Item 2
            array([3]), // Item 3
          ]),
        ]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection of numbers (inside variables)',
    graph: () => muster([variable(1), variable(2), variable(3)]),
    operations: [
      operation({
        description: 'WHEN resolving a query set that gets the list of items',
        input: querySet(root(), [
          querySetGetItemsOperation({
            children: [querySetOperation(resolveOperation())],
          }),
        ]),
        expected: array([
          // Items array
          array([
            array([1]), // Item 1
            array([2]), // Item 2
            array([3]), // Item 3
          ]),
        ]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a collection of branches',
    graph: () =>
      muster([
        { name: 'first', description: 'first description' },
        { name: 'second', description: 'second description' },
        { name: 'third', description: 'third description' },
      ]),
    operations: [
      operation({
        description: 'WHEN resolving a query set that gets the list of items',
        input: querySet(root(), [
          querySetGetItemsOperation({
            children: [querySetGetChildOperation('name', [querySetOperation(resolveOperation())])],
          }),
        ]),
        expected: array([
          // Items array
          array([
            array([
              // Item 1
              array([value('first')]),
            ]),
            array([
              // Item 2
              array([value('second')]),
            ]),
            array([
              // Item 3
              array([value('third')]),
            ]),
          ]),
        ]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a variable in the root of the graph',
    graph: () => muster(variable('initial')),
    operations: [
      operation({
        description: 'WHEN resolving a query set that updates the variable',
        input: querySet(root(), [querySetSetOperation(value('updated'))]),
        expected: array([ok()]),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: root(),
            expected: value('updated'),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing an action in the root of the graph',
    graph: () => muster(action((a, b) => a + b)),
    operations: [
      operation({
        description: 'WHEN resolving a query set that calls the action',
        input: querySet(root(), [querySetCallOperation([value(1), value(2)])]),
        expected: array([value(3)]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing an action',
    graph: () =>
      muster({
        addNumbers: action((a, b) => a + b),
      }),
    operations: [
      operation({
        description: 'WHEN resolving a query set that calls the action',
        input: querySet(root(), [
          querySetGetChildOperation('addNumbers', [querySetCallOperation([value(1), value(2)])]),
        ]),
        expected: array([array([value(3)])]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a root error',
    graph: () => muster(error('Root error')),
    operations: [
      operation({
        description: 'WHEN resolving querySet->resolve',
        input: querySet(root(), [querySetOperation(resolveOperation())]),
        expected: array([withErrorPath(error('Root error'), { path: [] })]),
      }),
      operation({
        description: 'WHEN resolving querySet->getChild(`name`)->resolve',
        input: querySet(root(), [
          querySetGetChildOperation('name', [querySetOperation(resolveOperation())]),
        ]),
        expected: array([array([withErrorPath(error('Root error'), { path: [] })])]),
      }),
      operation({
        description: 'WHEN resolving querySet->call',
        input: querySet(root(), [querySetCallOperation([])]),
        expected: array([withErrorPath(error('Root error'), { path: [] })]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing an error at path',
    graph: () =>
      muster({
        user: error('User does not exist'),
      }),
    operations: [
      operation({
        description: 'WHEN resolving querySet->getChild(`user`)',
        input: querySet(root(), [querySetGetChildOperation('user')]),
        expected: array([withErrorPath(error('User does not exist'), { path: ['user'] })]),
      }),
      operation({
        description: 'WHEN resolving querySet->getChild(`user`)->resolve',
        input: querySet(root(), [
          querySetGetChildOperation('user', [querySetOperation(resolveOperation())]),
        ]),
        expected: array([array([withErrorPath(error('User does not exist'), { path: ['user'] })])]),
      }),
      operation({
        description: 'WHEN resolving querySet->getChild(`user`)->getChild(`firstName`)',
        input: querySet(root(), [
          querySetGetChildOperation('user', [querySetGetChildOperation('firstName')]),
        ]),
        expected: array([array([withErrorPath(error('User does not exist'), { path: ['user'] })])]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing an action returning an error',
    graph: () =>
      muster({
        addNumbers: action((a, b) => error('Something went wrong')),
      }),
    operations: [
      operation({
        description: 'WHEN resolving querySet->getChild(`addNumbers`)->call',
        input: querySet(root(), [
          querySetGetChildOperation('addNumbers', [querySetCallOperation([value(1), value(2)])]),
        ]),
        expected: array([
          array([withErrorPath(error('Something went wrong'), { path: ['addNumbers'] })]),
        ]),
      }),
    ],
  });

  runScenario(() => {
    let stream: Subject<string>;
    return {
      description: 'GIVEN a graph containing a slow loading fromStream node',
      before() {
        stream = new Subject();
      },
      graph: () => muster(fromStream(stream)),
      operations: [
        operation({
          description: 'WHEN the query is made',
          input: querySet(root(), [querySetOperation(resolveOperation())]),
          operations: (subscriber) => [
            operation({
              description: 'Make sure the query set is pending',
              assert() {
                // Check if the querySet emitted a value - it should have not!
                expect(subscriber().next).not.toHaveBeenCalled();
              },
              operations: [
                operation({
                  description: 'AND the stream finally resolves',
                  before() {
                    jest.clearAllMocks();
                    stream.next('some value');
                  },
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(array([value('some value')]));
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let promiseFactory: jest.Mock<Promise<NodeDefinition>>;

    return {
      description: 'GIVEN a graph containing a fromPromise node',
      before() {
        promiseFactory = jest.fn(() => Promise.resolve(value('result')));
      },
      graph: () => muster(fromPromise(promiseFactory)),
      operations: [
        operation({
          description: 'WHEN resolving a query set against the root of the graph',
          before() {
            jest.clearAllMocks();
          },
          input: querySet(root(), [querySetOperation(resolveOperation())]),
          expected: array([value('result')]),
          assert() {
            expect(promiseFactory).toHaveBeenCalledTimes(1);
          },
        }),
      ],
    };
  });
});
