import muster, {
  action,
  add,
  call,
  eq,
  error,
  fn,
  format,
  get,
  getInvalidTypeError,
  ref,
  set,
  strlen,
  subtract,
  value,
  variable,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { apply } from './apply';
import { withErrorPath } from './error';

describe('apply', () => {
  runScenario({
    description: 'GIVEN an empty muster graph',
    graph: () => muster(value('foo')),
    operations: [
      operation({
        description: 'AND an attempt to apply a non-callable node',
        input: apply([], value('foo')),
        expected: withErrorPath(
          error(['Target node is not callable', ' Received:', '  value("foo")'].join('\n')),
          {
            path: [],
          },
        ),
      }),
      operation({
        description: 'AND an attempt to apply a non-callable dynamic node',
        input: apply([], strlen(value('foo'))),
        expected: withErrorPath(
          error(['Target node is not callable', ' Received:', '  value(3)'].join('\n')),
          {
            path: [],
          },
        ),
      }),
      operation({
        description: 'AND an attempt to apply a non-callable stateful node',
        input: apply([], variable(value('foo'))),
        expected: withErrorPath(
          error(['Target node is not callable', ' Received:', '  value("foo")'].join('\n')),
          {
            path: [],
          },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a unary function in the graph',
    graph: () =>
      muster({
        foo: value(123),
        plusFour: fn((x) => add(value(4), x)),
      }),
    operations: [
      operation({
        description: 'SHOULD resolve to the correct total when args applied',
        input: apply([ref('foo')], ref('plusFour')),
        expected: value(123 + 4),
      }),
      operation({
        description: 'SHOULD error with too few args',
        input: apply([], ref('plusFour')),
        expected: withErrorPath(
          error(
            ['Too few arguments applied to fn.', ' Expected:', '  1', ' Received:', '  0'].join(
              '\n',
            ),
          ),
          { path: ['plusFour'] },
        ),
      }),
      operation({
        description: 'SHOULD error with too many args',
        input: apply([value(1), value(2)], ref('plusFour')),
        expected: value(5),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a binary function in the graph',
    graph: () =>
      muster({
        foo: value(123),
        subtract: fn((a, b) => subtract(a, b)),
        subtractSwapped: fn((a, b) => subtract(b, a)),
      }),
    operations: [
      operation({
        description: 'SHOULD resolve to the correct total when args applied',
        input: apply([ref('foo'), value(23)], ref('subtract')),
        expected: value(100),
      }),
      operation({
        description: 'SHOULD resolve to the correct total when subtract swapped',
        input: apply([ref('foo'), value(23)], ref('subtractSwapped')),
        expected: value(-100),
      }),
      operation({
        description: 'SHOULD error with too few args',
        input: apply([value(1)], ref('subtract')),
        expected: withErrorPath(
          error(
            ['Too few arguments applied to fn.', ' Expected:', '  2', ' Received:', '  1'].join(
              '\n',
            ),
          ),
          { path: ['subtract'] },
        ),
      }),
      operation({
        description: 'SHOULD error with too many args',
        input: apply([value(1), value(2), value(3)], ref('subtract')),
        expected: value(-1),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN two functions and ref pointing to one',
    graph: () =>
      muster({
        identity: fn((x) => x),
        nullary: fn(() => value(123)),
        nullary2: fn(() => value(456)),
        unary: fn((x) => add(value(4), x)),
        notAFunction: value('foo'),
        fn: variable(ref('identity')),
      }),
    operations: [
      operation({
        description: 'AND a subscription to the result of applying the fn with one arg',
        input: apply([value(123)], ref('fn')),
        expected: value(123),
        operations: (topSub: () => MockSubscriber) => [
          operation({
            description: 'WHEN changing the ref to a nullary function with the same return value',
            input: set(ref('fn'), ref('nullary')),
            before() {
              jest.clearAllMocks();
            },
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(0);
            },
          }),
          operation({
            description: 'WHEN changing the ref to a nullary function with a new return value',
            input: set(ref('fn'), ref('nullary2')),
            before() {
              jest.clearAllMocks();
            },
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value(456));
            },
          }),
          operation({
            description: 'WHEN changing the ref to the unary function',
            input: set(ref('fn'), ref('unary')),
            before() {
              jest.clearAllMocks();
            },
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenLastCalledWith(value(123 + 4));
            },
          }),
          operation({
            description: 'WHEN changing the ref to a value node',
            input: set(ref('fn'), ref('notAFunction')),
            before() {
              jest.clearAllMocks();
            },
            assert: () => {
              expect(topSub().next).toHaveBeenCalledTimes(1);
              expect(topSub().next).toHaveBeenCalledWith(
                withErrorPath(
                  error(['Target node is not callable', ' Received:', '  value("foo")'].join('\n')),
                  { path: ['notAFunction'] },
                ),
              );
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an apply node referencing an item from the graph',
    graph: () =>
      muster({
        item: variable(false),
        fn: fn((item) => eq(item, true)),
      }),
    operations: [
      operation({
        description: 'AND the apply node is called',
        input: apply([ref('item')], ref('fn')),
        expected: value(false),
        operations: (subscriber) => [
          operation({
            description: 'AND the value is set to `true`',
            input: set(ref('item'), true),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value(true));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an apply node referencing a nested item from the graph',
    graph: () =>
      muster({
        item: {
          value: variable(false),
        },
        fn: fn((item) => eq(get(item, 'value'), true)),
      }),
    operations: [
      operation({
        description: 'AND the apply node is called',
        input: apply([ref('item')], ref('fn')),
        expected: value(false),
        operations: (subscriber) => [
          operation({
            description: 'AND the value is set to `true`',
            input: set(ref('item', 'value'), true),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value(true));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a function in the graph',
    graph: () =>
      muster({
        emptyAction: action(() => value('test empty')),
        unaryAction: action((a: any) => value(a)),
        binaryAction: action((a: number, b: number) => value(a + b)),
        returnsUndefined: action(() => {}),
      }),
    operations: [
      operation({
        description: 'WHEN applying `emptyAction` with no args',
        input: apply([], ref('emptyAction')),
        expected: value('test empty'),
      }),
      operation({
        description: 'WHEN applying `emptyAction` with more args',
        input: apply([value(1)], ref('emptyAction')),
        // expected: errorAtPath(['emptyAction'], [
        //   'Too many arguments applied to fn.',
        //   ' Expected:',
        //   '  0',
        //   ' Received:',
        //   '  1',
        // ].join('\n')),
        expected: value('test empty'),
      }),
      operation({
        description: 'WHEN applying `unaryAction` with no args',
        input: apply([], ref('unaryAction')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN applying `unaryAction` with correct amount of args',
        input: apply([value(1)], ref('unaryAction')),
        expected: value(1),
      }),
      operation({
        description: 'WHEN applying `unaryAction` with more args',
        input: apply([value(1), value(2)], ref('unaryAction')),
        // expected: errorAtPath(['unaryAction'], [
        //   'Too many arguments applied to fn.',
        //   ' Expected:',
        //   '  1',
        //   ' Received:',
        //   '  2',
        // ].join('\n')),
        expected: value(1),
      }),
      operation({
        description: 'WHEN applying `binaryAction` with too few arguments',
        input: apply([], ref('binaryAction')),
        expected: value(NaN),
      }),
      operation({
        description: 'WHEN applying `binaryAction` with explicit value nodes',
        input: apply([value(1), value(5)], ref('binaryAction')),
        expected: value(6),
      }),
      operation({
        description: 'WHEN applying `binaryAction` with too many args',
        input: apply([value(1), value(5), value('unused')], ref('binaryAction')),
        // expected: errorAtPath(['binaryAction'], [
        //   'Too many arguments applied to fn.',
        //   ' Expected:',
        //   '  2',
        //   ' Received:',
        //   '  3',
        // ].join('\n')),
        expected: value(6),
      }),
      operation({
        description: 'WHEN applying `returnsUndefined` action',
        input: apply([], ref('returnsUndefined')),
        expected: value(undefined),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing an fn node with refs to the variable',
    graph: () =>
      muster({
        number: variable(0),
        add: fn((num) => add(num, ref('number'))),
      }),
    operations: [
      operation({
        description: 'WHEN the add action gets called',
        input: apply([2], ref('add')),
        expected: value(2),
        operations: (subscriber) => [
          operation({
            description: 'AND the variable gets changed',
            before() {
              jest.clearAllMocks();
            },
            input: set('number', 2),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value(4));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing an fn node which concatenates arg with a variable',
    graph: () =>
      muster({
        greeting: variable('Hello'),
        getGreeting: fn((name) =>
          format('${greeting}, ${name}', {
            greeting: ref('greeting'),
            name,
          }),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the getGreeting gets applied',
        input: apply(['Bob'], ref('getGreeting')),
        expected: value('Hello, Bob'),
        operations: (subscriber) => [
          operation({
            description: 'AND the greeting changes',
            before() {
              jest.clearAllMocks();
            },
            input: set('greeting', 'Goodbye'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('Goodbye, Bob'));
            },
          }),
        ],
      }),
    ],
  });

  describe('Test consecutive calls with return value', () => {
    let callCounter = 0;
    runScenario({
      before: () => {
        callCounter = 0;
      },
      description: 'GIVEN a graph containing an action node',
      graph: () =>
        muster({
          incrementCounter: action(() => {
            callCounter++; // tslint:disable-line no-increment-decrement
            return value(callCounter);
          }),
        }),
      operations: [
        operation({
          description: 'WHEN calling the action via an apply node for the first time',
          input: apply(ref('incrementCounter')),
          expected: value(1),
          assert: () => {
            expect(callCounter).toEqual(1);
          },
          operations: [
            operation({
              description: 'WHEN calling the action via an apply node for the second time',
              input: apply(ref('incrementCounter')),
              expected: value(1),
              assert: () => {
                expect(callCounter).toEqual(1);
              },
              operations: [
                operation({
                  description: 'WHEN calling the action via an apply node for the third time',
                  input: apply(ref('incrementCounter')),
                  expected: value(1),
                  assert: () => {
                    expect(callCounter).toEqual(1);
                  },
                }),
              ],
            }),
          ],
        }),
        operation({
          description: 'WHEN calling the action via a call node for the first time',
          input: call(ref('incrementCounter')),
          expected: value(1),
          operations: [
            operation({
              description: 'WHEN calling the action via a call node for the second time',
              input: call(ref('incrementCounter')),
              expected: value(2),
              assert: () => {
                expect(callCounter).toEqual(2);
              },
              operations: [
                operation({
                  description: 'WHEN calling the action via a call node for the third time',
                  input: call(ref('incrementCounter')),
                  expected: value(3),
                  assert: () => {
                    expect(callCounter).toEqual(3);
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });
});

describe('Test consecutive calls without return value', () => {
  let callCounter = 0;
  runScenario({
    before: () => {
      callCounter = 0;
    },
    description: 'GIVEN a graph containing an action node',
    graph: () =>
      muster({
        incrementCounter: action(() => {
          callCounter++; // tslint:disable-line no-increment-decrement
          return value(undefined);
        }),
      }),
    operations: [
      operation({
        description: 'WHEN calling the action via an apply node for the first time',
        input: apply(ref('incrementCounter')),
        assert: () => {
          expect(callCounter).toEqual(1);
        },
        operations: [
          operation({
            description: 'WHEN calling the action via an apply node for the second time',
            input: apply(ref('incrementCounter')),
            expected: value(undefined),
            assert: () => {
              expect(callCounter).toEqual(1);
            },
            operations: [
              operation({
                description: 'WHEN calling the action via an apply node for the third time',
                input: apply(ref('incrementCounter')),
                expected: value(undefined),
                assert: () => {
                  expect(callCounter).toEqual(1);
                },
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'WHEN calling the action via a call node for the first time',
        input: call(ref('incrementCounter')),
        assert: () => {
          expect(callCounter).toEqual(1);
        },
        operations: [
          operation({
            description: 'WHEN calling the action via a call node for the second time',
            input: call(ref('incrementCounter')),
            expected: value(undefined),
            assert: () => {
              expect(callCounter).toEqual(2);
            },
            operations: [
              operation({
                description: 'WHEN calling the action via a call node for the third time',
                input: call(ref('incrementCounter')),
                expected: value(undefined),
                assert: () => {
                  expect(callCounter).toEqual(3);
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a function with one named arguments',
    graph: () =>
      muster({
        greet: fn(['name'], ({ name }) => format('Hello, ${name}!', { name })),
      }),
    operations: [
      operation({
        description: 'AND the function is called',
        input: apply({ name: 'Bob' }, ref('greet')),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'AND the function is called with additional arguments',
        input: apply({ name: 'Bob', lastName: 'Smith' }, ref('greet')),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'AND the function is called with missing argument',
        input: apply({}, ref('greet')),
        expected: withErrorPath(
          error(
            getInvalidTypeError('An fn() was called with unexpected number of arguments.', {
              expected: ['name'],
              received: [],
            }),
          ),
          { path: ['greet'] },
        ),
      }),
      operation({
        description: 'AND the function is called with an array of arguments',
        input: apply(['Bob'], ref('greet')),
        expected: withErrorPath(
          error(
            'An fn() expected to have been called with named arguments, ' +
              'but was called with an array of arguments.',
          ),
          { path: ['greet'] },
        ),
      }),
    ],
  });
});
