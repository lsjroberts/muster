import muster, {
  add,
  dispatch,
  error,
  match,
  NOT_FOUND,
  on,
  param,
  relative,
  types,
  value,
} from '../';
import { ErrorNodeDefinition, withErrorPath } from '../nodes/graph/error';
import { MockSubscriber, operation, runScenario } from '../test';
import { ref } from './ref';

describe('ref()', () => {
  describe('integration', () => {
    runScenario({
      description: 'GIVEN a graph containing a value root node',
      graph: () => muster(value('value:foo')),
      operations: [
        operation({
          description: 'AND a reference to the root node is retrieved',
          input: ref(),
          expected: value('value:foo'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a nested value',
      graph: () =>
        muster({
          foo: value('value:foo'),
        }),
      operations: [
        operation({
          description: 'AND a reference to the value is retrieved',
          input: ref('foo'),
          expected: value('value:foo'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a relative sibling reference',
      graph: () =>
        muster({
          foo: ref(relative('bar')),
          bar: value('value:bar'),
        }),
      operations: [
        operation({
          description: 'SHOULD return the sibling value',
          input: ref('foo'),
          expected: value('value:bar'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a relative sibling reference that may change',
      graph: () =>
        muster({
          foo: ref(relative('bar')),
          bar: on(
            (event) => (event.type === 'UPDATE' ? event.payload : undefined),
            value('value:bar'),
          ),
        }),
      operations: [
        operation({
          description: 'SHOULD return the sibling value',
          input: ref('foo'),
          expected: value('value:bar'),
          operations: (subscriber: () => MockSubscriber) => [
            {
              description: 'AND the target value is updated',
              before: () => jest.clearAllMocks(),
              input: dispatch({ type: 'UPDATE', payload: value('value:baz') }),
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value:baz'));
              },
            },
          ],
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a deeply nested relative sibling reference',
      graph: () =>
        muster({
          deeply: {
            nested: {
              foo: ref(relative('bar', 'baz', 'qux')),
              bar: {
                baz: {
                  qux: value('value:qux'),
                },
              },
            },
          },
        }),
      operations: [
        operation({
          description: 'SHOULD return the sibling value',
          input: ref('deeply', 'nested', 'foo'),
          expected: value('value:qux'),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing an invalid relative reference',
      graph: () =>
        muster({
          foo: ref(relative('baz')),
          bar: value('value:bar'),
        }),
      operations: [
        operation({
          description: 'SHOULD return an error',
          input: ref('foo'),
          expected: withErrorPath(error('Invalid child key: "baz"', { code: NOT_FOUND }), {
            path: [],
          }),
        }),
      ],
    });

    runScenario({
      description: 'GIVEN a graph containing a deeply nested invalid relative reference',
      graph: () =>
        muster({
          deeply: {
            nested: {
              foo: ref(relative('bar', 'asdf', 'jkl')),
              bar: {
                baz: {
                  qux: value('value:qux'),
                },
              },
            },
          },
        }),
      operations: [
        operation({
          description: 'SHOULD return the sibling value',
          input: ref('deeply', 'nested', 'foo'),
          expected: withErrorPath(error('Invalid child key: "asdf"', { code: NOT_FOUND }), {
            path: ['deeply', 'nested', 'bar'],
          }),
        }),
      ],
    });
  });

  runScenario({
    description: 'GIVEN a graph containing a value that returns an error',
    graph: () =>
      muster({
        willReturnError: error('My error message'),
        nested: {
          value: value('my value'),
        },
      }),
    operations: [
      operation({
        description: 'SHOULD return the error message',
        input: ref('nested', ref('willReturnError')),
        expected: withErrorPath(error('My error message'), { path: ['willReturnError'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a reference to itself (debug mode)',
    graph: () =>
      muster({
        foo: ref('foo'),
      }),
    operations: [
      operation({
        description: 'SHOULD return the error message',
        input: ref('foo'),
        expected: withStackTrace(
          withErrorPath(
            error(
              ['Circular reference encountered', ' Visited paths:', '  []', '  ["foo"]'].join('\n'),
            ),
            { path: ['foo'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a reference to itself (production mode)',
    graph: () =>
      muster(
        {
          foo: ref('foo'),
        },
        { debug: false },
      ),
    operations: [
      operation({
        description: 'SHOULD return the error message',
        input: ref('foo'),
        expected: withStackTrace(
          withErrorPath(
            error(['Maximum depth exceeded', ' Visited paths:', '  ["foo"]'].join('\n')),
            { path: ['foo'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing circular references (debug mode)',
    graph: () =>
      muster({
        foo: ref('bar'),
        bar: ref(relative('baz')),
        baz: ref('foo'),
      }),
    operations: [
      operation({
        description: 'SHOULD return the error message',
        input: ref('foo'),
        expected: withStackTrace(
          withErrorPath(
            error(
              [
                'Circular reference encountered',
                ' Visited paths:',
                '  []',
                '  ["foo"]',
                '  ["bar"]',
                '  ["baz"]',
                '  ["foo"]',
              ].join('\n'),
            ),
            { path: ['foo'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing circular references (production mode)',
    graph: () =>
      muster(
        {
          foo: ref('bar'),
          bar: ref(relative('baz')),
          baz: ref('foo'),
        },
        { debug: false },
      ),
    operations: [
      operation({
        description: 'SHOULD return the error message',
        input: ref('foo'),
        expected: withStackTrace(
          withErrorPath(
            error(['Maximum depth exceeded', ' Visited paths:', '  ["bar"]'].join('\n')),
            { path: ['bar'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing deeply nested circular references (debug mode)',
    graph: () =>
      muster({
        deeply: {
          nested: {
            foo: ref('deeply', 'nested', 'bar'),
            bar: ref(relative('baz')),
            baz: ref('deeply', 'nested', 'foo'),
          },
        },
      }),
    operations: [
      operation({
        description: 'SHOULD return the error message',
        input: ref('deeply', 'nested', 'foo'),
        expected: withStackTrace(
          withErrorPath(
            error(
              [
                'Circular reference encountered',
                ' Visited paths:',
                '  []',
                '  ["deeply","nested","foo"]',
                '  ["deeply","nested","bar"]',
                '  ["deeply","nested","baz"]',
                '  ["deeply","nested","foo"]',
              ].join('\n'),
            ),
            { path: ['deeply', 'nested', 'foo'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing deeply nested circular references (production mode)',
    graph: () =>
      muster(
        {
          deeply: {
            nested: {
              foo: ref('deeply', 'nested', 'bar'),
              bar: ref(relative('baz')),
              baz: ref('deeply', 'nested', 'foo'),
            },
          },
        },
        { debug: false },
      ),
    operations: [
      operation({
        description: 'SHOULD return the error message',
        input: ref('deeply', 'nested', 'foo'),
        expected: withStackTrace(
          withErrorPath(
            error(
              ['Maximum depth exceeded', ' Visited paths:', '  ["deeply","nested","bar"]'].join(
                '\n',
              ),
            ),
            { path: ['deeply', 'nested', 'bar'] },
          ),
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a top-level value node',
    graph: () => muster(value('Hello world')),
    operations: [
      operation({
        description: 'WHEN resolving ref(undefined)',
        input: ref(undefined),
        expected: value('Hello world'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a branch matcher expecting a number, and an add node that refers to it',
    graph: () =>
      muster({
        zeroPlusThree: add(ref(0), ref(3)),
        [match(types.number, 'num')]: param('num'),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the `zeroPlusThree`',
        input: ref('zeroPlusThree'),
        expected: value(3),
      }),
    ],
  });
});

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
