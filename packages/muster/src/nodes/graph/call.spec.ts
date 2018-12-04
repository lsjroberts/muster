import muster, {
  action,
  add,
  error,
  fn,
  format,
  getInvalidTypeError,
  nil,
  NodeDefinition,
  ok,
  ref,
  relative,
  root,
  series,
  set,
  toNode,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import { call } from './call';
import { computed } from './computed';
import { withErrorPath } from './error';

describe('call', () => {
  runScenario({
    description: 'GIVEN a function with a relative ref',
    graph: () =>
      muster(
        toNode({
          oneHundred: value(100),
          twoHundred: value(200),
          voidAction: action(() => value('Nothing')),
          plus104: action((x) => add(value(4), ref(relative('oneHundred')), x)),
          getTotal: call(ref(relative('plus104')), [ref(relative('twoHundred'))]),
          nested: {
            voidAction: action(() => value('Nested nothing')),
            add4: action((x) => add(value(4), x)),
          },
        }),
      ),
    operations: [
      operation({
        description: 'SHOULD resolve to the correct total when args applied',
        input: call(ref('plus104'), [value(200)]),
        expected: value(304),
      }),
      operation({
        description: 'SHOULD work with relative pathInput',
        input: ref('getTotal'),
        expected: value(304),
      }),
      operation({
        description: 'WHEN calling with a path to a void action with no args',
        input: call('voidAction'),
        expected: value('Nothing'),
      }),
      operation({
        description: 'WHEN calling with a path to a void action with empty args',
        input: call('voidAction', []),
        expected: value('Nothing'),
      }),
      operation({
        description: 'WHEN calling with a path to an action with an array of args',
        input: call('plus104', [50]),
        expected: value(154),
      }),
      operation({
        description: 'WHEN calling with a ref to a void action with no args',
        input: call(ref('voidAction')),
        expected: value('Nothing'),
      }),
      operation({
        description: 'WHEN calling with a ref to a void action with empty args',
        input: call(ref('voidAction'), []),
        expected: value('Nothing'),
      }),
      operation({
        description: 'WHEN calling with a ref to an action with args',
        input: call(ref('plus104'), [40]),
        expected: value(144),
      }),
      operation({
        description: 'WHEN calling with root, path array and empty args',
        input: call(root(), ['nested', 'voidAction'], []),
        expected: value('Nested nothing'),
      }),
      operation({
        description: 'WHEN calling with root, path array and args',
        input: call(root(), ['nested', 'add4'], [5]),
        expected: value(9),
      }),
    ],
  });

  runScenario({
    description:
      'GIVEN a muster graph containing a variable and an action setting it' + 'via a global ref',
    graph: () =>
      muster({
        nested: {
          foo: variable('foo'),
          getFoo: action(() => ref('nested', 'foo')),
          setFoo: action(() => set(['nested', 'foo'], 'bar')),
        },
      }),
    operations: [
      operation({
        description: 'WHEN the variable gets set',
        input: set(['nested', 'foo'], 'bar'),
        expected: value('bar'),
        operations: [
          operation({
            description: 'WHEN calling `getFoo`',
            input: call(['nested', 'getFoo']),
            expected: value('bar'),
          }),
        ],
      }),
      operation({
        description: 'WHEN the variable gets set',
        input: call(['nested', 'setFoo']),
        expected: value('bar'),
        operations: [
          operation({
            description: 'WHEN calling `getFoo`',
            input: ref('nested', 'foo'),
            expected: value('bar'),
          }),
          operation({
            description: 'WHEN the variable gets requested',
            input: ref('nested', 'foo'),
            expected: value('bar'),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description:
      'GIVEN a muster graph containing a variable and an action setting it ' +
      'via a relative reference',
    graph: () =>
      muster({
        nested: {
          foo: variable('foo'),
          getFoo: action(() => ref(relative('foo'))),
          setFoo: action(() => set(relative('foo'), 'bar')),
        },
      }),
    operations: [
      operation({
        description: 'WHEN the variable gets set',
        input: set(['nested', 'foo'], 'bar'),
        expected: value('bar'),
        operations: [
          operation({
            description: 'WHEN calling `getFoo`',
            input: call(['nested', 'getFoo']),
            expected: value('bar'),
          }),
        ],
      }),
      operation({
        description: 'WHEN the variable gets set',
        input: call(['nested', 'setFoo']),
        expected: value('bar'),
        operations: [
          operation({
            description: 'WHEN calling `getFoo`',
            input: ref('nested', 'foo'),
            expected: value('bar'),
          }),
          operation({
            description: 'WHEN the variable gets requested',
            input: ref('nested', 'foo'),
            expected: value('bar'),
          }),
        ],
      }),
    ],
  });

  let mockFn: jest.Mock<void>;
  runScenario({
    description: 'GIVEN a muster graph containing a mock function',
    before() {
      mockFn = jest.fn((arg) => arg + 1);
    },
    graph: () =>
      muster({
        action: action(mockFn),
      }),
    operations: [
      operation({
        description: 'WHEN the action gets called',
        before() {
          jest.clearAllMocks();
        },
        input: call(ref('action'), [5]),
        expected: value(6),
        assert() {
          expect(mockFn).toHaveBeenCalledTimes(1);
          expect(mockFn).toHaveBeenCalledWith(5);
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing two variables and an action - two yields',
    graph: () =>
      muster({
        first: variable('initial first'),
        second: variable('initial second'),
        setVariables: action(function*() {
          const first = yield set('first', 'updated first');
          const second = yield set('second', 'updated second');
          return value([first, second]);
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the action gets called',
        input: call('setVariables'),
        expected: value(['updated first', 'updated second']),
        operations: [
          operation({
            description: 'AND the first variable is retrieved',
            input: ref('first'),
            expected: value('updated first'),
            operations: [
              operation({
                description: 'AND the second variable is retrieved',
                input: ref('second'),
                expected: value('updated second'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing two variables and an action - yield array',
    graph: () =>
      muster({
        first: variable('initial first'),
        second: variable('initial second'),
        setVariables: action(function*() {
          return yield [set('first', 'updated first'), set('second', 'updated second')];
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the action gets called',
        input: call('setVariables'),
        expected: value(['updated first', 'updated second']),
        operations: [
          operation({
            description: 'AND the first variable is retrieved',
            input: ref('first'),
            expected: value('updated first'),
            operations: [
              operation({
                description: 'AND the second variable is retrieved',
                input: ref('second'),
                expected: value('updated second'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing two variables and an action - yield series',
    graph: () =>
      muster({
        first: variable('initial first'),
        second: variable('initial second'),
        setVariables: action(function*() {
          return yield series([set('first', 'updated first'), set('second', 'updated second')]);
        }),
      }),
    operations: [
      operation({
        description: 'WHEN the action gets called',
        input: call('setVariables'),
        expected: value('updated second'),
        operations: [
          operation({
            description: 'AND the first variable is retrieved',
            input: ref('first'),
            expected: value('updated first'),
            operations: [
              operation({
                description: 'AND the second variable is retrieved',
                input: ref('second'),
                expected: value('updated second'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario(() => {
    let actionFn: jest.Mock<NodeDefinition>;
    return {
      description: 'GIVEN an action that calls another action with no arguments',
      before() {
        actionFn = jest.fn(() => ok());
      },
      graph: () =>
        muster({
          action: action(() => call(ref('foo'), [])),
          foo: action(actionFn),
        }),
      operations: [
        operation({
          description: 'AND the action is called',
          input: call(ref('action'), []),
          expected: ok(),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(actionFn).toHaveBeenCalledTimes(1);
          },
          operations: [
            operation({
              description: 'AND the action is called again',
              input: call(ref('action'), []),
              expected: ok(),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(actionFn).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let actionFn: jest.Mock<NodeDefinition>;
    return {
      description: 'GIVEN an action that calls another action with arguments',
      before() {
        actionFn = jest.fn((arg1, arg2, arg3) => value(`value:${arg1}:${arg2}:${arg3}`));
      },
      graph: () =>
        muster({
          action: action((arg1, arg2, arg3) => call(ref('foo'), [arg3, arg2, arg1])),
          foo: action(actionFn),
        }),
      operations: [
        operation({
          description: 'AND the action is called',
          input: call(ref('action'), ['foo', 'bar', 'baz']),
          expected: value('value:baz:bar:foo'),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(actionFn).toHaveBeenCalledTimes(1);
            expect(actionFn).toHaveBeenCalledWith('baz', 'bar', 'foo');
          },
          operations: [
            operation({
              description: 'AND the action is called again with the same arguments',
              input: call(ref('action'), ['foo', 'bar', 'baz']),
              expected: value('value:baz:bar:foo'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(actionFn).toHaveBeenCalledTimes(1);
                expect(actionFn).toHaveBeenCalledWith('baz', 'bar', 'foo');
              },
            }),
            operation({
              description: 'AND the action is called again with different arguments',
              input: call(ref('action'), ['baz', 'bar', 'foo']),
              expected: value('value:foo:bar:baz'),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(actionFn).toHaveBeenCalledTimes(1);
                expect(actionFn).toHaveBeenCalledWith('foo', 'bar', 'baz');
              },
            }),
          ],
        }),
      ],
    };
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
        input: call('greet', { name: 'Bob' }),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'AND the function is called with additional arguments',
        input: call('greet', { name: 'Bob', lastName: 'Smith' }),
        expected: value('Hello, Bob!'),
      }),
      operation({
        description: 'AND the function is called with missing argument',
        input: call('greet', {}),
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
        input: call('greet', ['Bob']),
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

  runScenario({
    description: 'GIVEN a function with named arguments',
    graph: () =>
      muster({
        setValue: fn(['target', 'value'], ({ target, value }) =>
          series([computed([value], (resolvedValue) => set(target, resolvedValue)), nil()]),
        ),
        name: variable('Bob'),
      }),
    operations: [
      operation({
        description: 'WHEN the name is requested',
        input: ref('name'),
        expected: value('Bob'),
        operations: (subscriber) => [
          operation({
            description: 'AND the `setValue` is called',
            before() {
              jest.clearAllMocks();
            },
            input: call('setValue', {
              target: ref('name'),
              value: 'Kate',
            }),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('Kate'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an action with named argument',
    graph: () =>
      muster({
        greet: action(({ name }) => `Hello, ${name}!`),
      }),
    operations: [
      operation({
        description: 'AND the function is called',
        input: call('greet', { name: 'Bob' }),
        expected: value('Hello, Bob!'),
      }),
    ],
  });
});
