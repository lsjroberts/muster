import muster, {
  DoneNodeType,
  fields,
  fromPromise,
  getInvalidTypeError,
  invalidate,
  key,
  match,
  nil,
  NodeDefinition,
  ok,
  OkNodeType,
  param,
  query,
  ref,
  root,
  set,
  toNode,
  types,
  value,
  ValueNodeType,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import relative from '../../utils/relative';
import { add } from '../arithmetic/add';
import { computed } from './computed';
import { error, ErrorNodeDefinition, withErrorPath } from './error';
import { factory } from './factory';

function getCallStackSize(): number {
  try {
    return 1 + getCallStackSize();
  } catch (e) {
    return 1;
  }
}

const MAX_CALL_STACK_SIZE = getCallStackSize();

describe('computed', () => {
  runScenario({
    description: 'GIVEN a basic computed node with static dependencies',
    operations: [
      operation({
        description: 'AND the value is retrieved',
        input: computed([value(1), value(2)], (first: number, second: number) =>
          value(first + second),
        ),
        expected: value(3),
      }),
    ],
  });

  runScenario({
    description: 'WHEN the graph contains a computed node behind a matcher',
    graph: () =>
      muster({
        [match(types.string, 'propName')]: {
          something: computed([param('propName')], (propName) => `Got prop: ${propName}`),
        },
      }),
    operations: [
      operation({
        description: 'AND using a ref to access the value',
        input: ref('testprop', 'something'),
        expected: value('Got prop: testprop'),
      }),
      operation({
        description: 'AND using a query to access the value',
        input: query(
          root(),
          fields({
            testpropResult: key('testprop', {
              somethingResult: key('something'),
            }),
          }),
        ),
        expected: value({ testpropResult: { somethingResult: 'Got prop: testprop' } }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a variable',
    graph: () =>
      muster({
        variable: variable('one'),
        value: value('test: '),
      }),
    operations: [
      operation({
        description: 'WHEN the computed uses both values from the graph',
        input: computed(
          [ref('value'), ref('variable')],
          (first: string, second: string) => `${first}${second}`,
        ),
        expected: value('test: one'),
        operations: (subscriber) => [
          operation({
            description: 'AND then the variable changes to `two`',
            before() {
              jest.clearAllMocks();
            },
            input: set('variable', 'two'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('test: two'));
            },
            operations: [
              operation({
                description: 'AND then the variable goes back to `one`',
                before() {
                  jest.clearAllMocks();
                },
                input: set('variable', 'one'),
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value('test: one'));
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing computed node with relative refs',
    graph: () =>
      muster({
        first: 'Bob',
        last: 'Müler',
        full: computed(
          [ref(relative('first')), ref(relative('last'))],
          (first: string, last: string) => `${first} ${last}`,
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the full name is requested',
        input: ref('full'),
        expected: value('Bob Müler'),
      }),
    ],
  });

  runScenario(() => {
    let currentValue: any;
    let callback: jest.Mock<Promise<NodeDefinition>>;
    return {
      description: 'GIVEN a muster graph containing computed node that returns a fromPromise',
      before() {
        currentValue = undefined;
        callback = jest.fn(() => Promise.resolve(value(currentValue)));
      },
      graph: () =>
        muster({
          foo: value('foo'),
          bar: value('bar'),
          result: computed([ref('foo'), ref('bar')], () => fromPromise(callback)),
        }),
      operations: [
        operation({
          before() {
            currentValue = 'initial';
          },
          description: 'AND the result is retrieved',
          input: ref('result'),
          expected: value('initial'),
          operations: (subscriber) => [
            operation({
              description: 'AND the result is updated and the fromPromise invalidated',
              before() {
                currentValue = 'updated';
                jest.clearAllMocks();
              },
              input: invalidate('result'),
              expected: ok(),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
              },
            }),
          ],
        }),
      ],
    };
  });

  // TODO: Handle massively deep dependencies
  runScenario.skip({
    description: 'GIVEN a computed node with massively deep dependencies',
    operations: [
      operation({
        description: 'SHOULD return a value',
        input: createComputedNodeWithDepth(MAX_CALL_STACK_SIZE + 1),
        expected: value(expect.any(Number)),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a computed node that never resolves (debug mode)',
    graph: () => muster(nil(), { debug: true }),
    operations: [
      operation({
        description: 'AND the node is retrieved',
        input: createRecursiveComputedNode(),
        expected: withStackTrace(
          withErrorPath(error(['Maximum depth exceeded', ' Visited paths:', '  []'].join('\n')), {
            path: [],
          }),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a computed node that never resolves (production mode)',
    graph: () => muster(nil(), { debug: false }),
    operations: [
      operation({
        description: 'AND the node is retrieved',
        input: createRecursiveComputedNode(),
        expected: withStackTrace(
          withErrorPath(error(['Maximum depth exceeded', ' Visited paths:', '  []'].join('\n')), {
            path: [],
          }),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested computed node that never resolves (debug mode)',
    graph: () =>
      muster({
        nested: {
          foo: createRecursiveComputedNode(),
          bar: ref(relative('baz')),
          baz: ref(relative('foo')),
        },
      }),
    operations: [
      operation({
        description: 'AND the node is retrieved directly',
        input: ref('nested', 'foo'),
        expected: withStackTrace(
          withErrorPath(
            error(
              ['Maximum depth exceeded', ' Visited paths:', '  []', '  ["nested","foo"]'].join(
                '\n',
              ),
            ),
            { path: ['nested', 'foo'] },
          ),
        ),
      }),
      operation({
        description: 'AND the node is retrieved via chained references',
        input: ref('nested', 'bar'),
        expected: withStackTrace(
          withErrorPath(
            error(
              [
                'Maximum depth exceeded',
                ' Visited paths:',
                '  []',
                '  ["nested","bar"]',
                '  ["nested","baz"]',
                '  ["nested","foo"]',
              ].join('\n'),
            ),
            { path: ['nested', 'foo'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nested computed node that never resolves (production mode)',
    graph: () =>
      muster(
        {
          nested: {
            foo: createRecursiveComputedNode(),
            bar: ref(relative('baz')),
            baz: ref(relative('foo')),
          },
        },
        { debug: false },
      ),
    operations: [
      operation({
        description: 'AND the node is retrieved directly',
        input: ref('nested', 'foo'),
        expected: withStackTrace(
          withErrorPath(
            error(['Maximum depth exceeded', ' Visited paths:', '  ["nested","foo"]'].join('\n')),
            { path: ['nested', 'foo'] },
          ),
        ),
      }),
      operation({
        description: 'AND the node is retrieved via chained references',
        input: ref('nested', 'bar'),
        expected: withStackTrace(
          withErrorPath(
            error(['Maximum depth exceeded', ' Visited paths:', '  ["nested","foo"]'].join('\n')),
            { path: ['nested', 'foo'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a computed node that depends on a tree() node',
    graph: () =>
      muster({
        user: {
          firstName: 'Bob',
          lastName: 'Smith',
        },
        fullName: computed([ref('user')], (user) => `${user.firstName} ${user.lastName}`),
      }),
    operations: [
      operation({
        description: 'WHEN the computed is resolved',
        input: ref('fullName'),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Invalid computed node dependencies', {
              expected: [ValueNodeType, OkNodeType, DoneNodeType],
              received: toNode({
                firstName: 'Bob',
                lastName: 'Smith',
              }),
            }),
          ),
          { path: ['user'] },
        ),
      }),
    ],
  });
});

function createRecursiveComputedNode(): NodeDefinition {
  return computed([value('foo')], () => createRecursiveComputedNode());
}

function createComputedNodeWithDepth(depth: number): NodeDefinition {
  return depth === 0
    ? value(1)
    : computed([factory(() => createComputedNodeWithDepth(depth - 1))], (x) => add(x, 1));
}

function withStackTrace(error: ErrorNodeDefinition): ErrorNodeDefinition {
  return Object.assign({}, error, {
    properties: Object.assign({}, error.properties, {
      error: expect.objectContaining(
        Object.assign({}, error.properties.error, {
          message: expect.stringContaining(error.properties.error.message),
        }),
      ),
    }),
  });
}
