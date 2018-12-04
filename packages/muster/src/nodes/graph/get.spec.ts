import muster, {
  computed,
  dispatch,
  error,
  first,
  fromPromise,
  last,
  length,
  NOT_FOUND,
  nth,
  on,
  ref,
  root,
  value,
} from '../..';
import { MockSubscriber, operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { get } from './get';

describe('get', () => {
  runScenario({
    description: 'GIVEN a graph with a value root node',
    graph: () => muster(value('foo')),
    operations: [
      operation({
        description: 'SHOULD throw an error when fetching undefined nodes',
        input: get(root(), 'bar'),
        expected: withErrorPath(
          error(
            ['Value node does not allow child access', ' Received:', '  value("foo")'].join('\n'),
          ),
          { path: [] },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a branch root node',
    graph: () =>
      muster({
        foo: value('FOO'),
      }),
    operations: [
      operation({
        description: 'SHOULD fetch defined nodes',
        input: get(root(), 'foo'),
        expected: value('FOO'),
      }),
      operation({
        description: 'SHOULD throw an error when fetching undefined nodes',
        input: get(root(), 'bar'),
        expected: withErrorPath(error('Invalid child key: "bar"', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
      operation({
        description: 'SHOULD throw an error when fetching null keys',
        input: get(root(), value(null)),
        expected: withErrorPath(error('Invalid child key: null', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a branch root node that may change',
    graph: () =>
      muster({
        foo: on((event) => (event.type === 'UPDATE' ? event.payload : undefined), value('FOO')),
      }),
    operations: [
      operation({
        description: 'SHOULD fetch defined nodes',
        input: get(root(), 'foo'),
        expected: value('FOO'),
        operations: (subscriber: () => MockSubscriber) => [
          operation({
            description: 'AND the target value is updated',
            before: () => jest.clearAllMocks(),
            input: dispatch({ type: 'UPDATE', payload: value('BAR') }),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('BAR'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a deeply nested root node',
    graph: () =>
      muster({
        foo: {
          bar: {
            baz: value('qux'),
          },
        },
      }),
    operations: [
      operation({
        description: 'SHOULD fetch deeply nested nodes',
        input: get(root(), ['foo', 'bar', 'baz']),
        expected: value('qux'),
      }),
      operation({
        description: 'SHOULD throw an error when fetching undefined nested nodes',
        input: get(root(), ['foo', 'baz']),
        expected: withErrorPath(error('Invalid child key: "baz"', { code: NOT_FOUND }), {
          path: ['foo'],
        }),
      }),
      operation({
        description: 'SHOULD throw an error when fetching undefined deeply nested nodes',
        input: get(root(), ['foo', 'bar', 'qux']),
        expected: withErrorPath(error('Invalid child key: "qux"', { code: NOT_FOUND }), {
          path: ['foo', 'bar'],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a computed node that returns an error',
    graph: () =>
      muster({
        willError: computed([], () => error('Whoops')),
      }),
    operations: [
      operation({
        description: 'WHEN requesting a path that should exist under that computed',
        input: ref('willError', 'nested', 'name'),
        expected: withErrorPath(error('Whoops'), { path: ['willError'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a from promise that returns error',
    graph: () =>
      muster({
        willError: fromPromise(() => Promise.reject(error('Whoops'))),
      }),
    operations: [
      operation({
        description: 'WHEN requesting a path that should exist under that fromPromise',
        input: ref('willError', 'nested', 'name'),
        expected: withErrorPath(error('Whoops'), { path: ['willError'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a collection',
    graph: () =>
      muster({
        items: [{ name: 'Bob' }, { name: 'Alice' }],
      }),
    operations: [
      operation({
        description: 'WHEN requesting the length of the collection',
        input: ref('items', length()),
        expected: value(2),
      }),
      operation({
        description: 'WHEN requesting the name from the first item',
        input: ref('items', first(), 'name'),
        expected: value('Bob'),
      }),
      operation({
        description: 'WHEN requesting the name from the last item',
        input: ref('items', last(), 'name'),
        expected: value('Alice'),
      }),
      operation({
        description: 'WHEN requesting the name from the 2nd item',
        input: ref('items', nth(1), 'name'),
        expected: value('Alice'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph with a string in it',
    graph: () =>
      muster({
        greeting: 'Hello, world!',
      }),
    operations: [
      operation({
        description: 'WHEN requesting a length of that string',
        input: ref('greeting', length()),
        expected: value(13),
      }),
    ],
  });
});
