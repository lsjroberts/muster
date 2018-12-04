import muster, {
  action,
  call,
  context,
  error,
  fields,
  fn,
  get,
  key,
  NodeDefinition,
  query,
  ref,
  root,
  scope,
  set,
  tree,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import { ifError } from './if-error';

describe('ifError', () => {
  runScenario({
    description: 'GIVEN a branch hidden behind an `ifError` node with a static fallback value',
    graph: () =>
      muster({
        nested: ifError(
          tree({
            item: value('foo'),
          }),
          error('ERROR'),
        ),
      }),
    operations: [
      operation({
        description: 'SHOULD resolve to the fallback value',
        input: query(
          root(),
          fields({
            nestedResult: key(value('nested'), {
              itemResult: key(value('item')),
            }),
          }),
        ),
        expected: value({
          nestedResult: {
            itemResult: 'foo',
          },
        }),
      }),
    ],
  });

  runScenario(() => {
    let callback: jest.Mock<NodeDefinition>;
    return {
      description: 'GIVEN a branch hidden behind an `ifError` node with a dynamic fallback value',
      before: () => {
        callback = jest.fn(() => tree({ item: value('foo') }));
      },
      graph: () =>
        muster({
          nested: ifError(callback, error('ERROR')),
        }),
      operations: [
        operation({
          description: 'SHOULD resolve to the fallback value',
          input: query(
            root(),
            fields({
              nestedResult: key(value('nested'), {
                itemResult: key(value('item')),
              }),
            }),
          ),
          expected: value({
            nestedResult: {
              itemResult: 'foo',
            },
          }),
          assert: () => {
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(error('ERROR'), undefined);
          },
        }),
      ],
    };
  });

  runScenario({
    description: 'GIVEN an `ifError` node that wraps a node whose value sometimes errors',
    graph: () =>
      muster({
        foo: variable(value('foo')),
        bar: ifError('FALLBACK', ref('foo')),
      }),
    operations: [
      operation({
        description: 'AND the node is retrieved',
        input: ref('bar'),
        expected: value('foo'),
        operations: (subscriber) => [
          operation({
            description: 'AND the source value is updated to an error value',
            before: () => {
              jest.clearAllMocks();
            },
            input: set(ref('foo'), error('ERROR')),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('FALLBACK'));
            },
            operations: [
              operation({
                description: 'AND the source value is updated to a non-error value',
                before: () => {
                  jest.clearAllMocks();
                },
                input: set(ref('foo'), value('bar')),
                assert: () => {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value('bar'));
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an action with no arguments wrapped in an `ifError` node',
    graph: () =>
      muster({
        doSomething: ifError('FALLBACK', action(() => error('ERROR'))),
      }),
    operations: [
      operation({
        description: 'WHEN the action gets called',
        input: call('doSomething'),
        expected: value('FALLBACK'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an action with a single argument wrapped in an `ifError` node',
    graph: () =>
      muster({
        doSomething: ifError(
          'FALLBACK',
          action((name) => {
            if (name === 'invalid') {
              return error('ERROR');
            }
            return `Hello, ${name}`;
          }),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the action gets called with some name',
        input: call('doSomething', ['Bob']),
        expected: value('Hello, Bob'),
      }),
      operation({
        description: 'WHEN the action gets called with invalid name',
        input: call('doSomething', ['invalid']),
        expected: value('FALLBACK'),
      }),
    ],
  });

  runScenario({
    description:
      'GIVEN a scoped `ifError` node with a static fallback value that depends on scoped context values',
    graph: () => muster(scope(ifError(context('foo'), error('ERROR')), { foo: value('bar') })),
    operations: [
      operation({
        description: 'SHOULD resolve to the fallback value',
        input: root(),
        expected: value('bar'),
      }),
    ],
  });

  runScenario({
    description:
      'GIVEN a scoped `ifError` node' +
      'that wraps an expression that resolves to a globally-scoped error node' +
      'with a dynamic fallback value that depends on scoped context values',
    graph: () =>
      muster({
        foo: error('ERROR'),
        scoped: scope(ifError(() => context('foo'), get(context('global'), 'foo')), {
          global: root(),
          foo: value('bar'),
        }),
      }),
    operations: [
      operation({
        description: 'SHOULD resolve to the fallback value',
        input: ref('scoped'),
        expected: value('bar'),
      }),
    ],
  });

  runScenario({
    description:
      'GIVEN a scoped callable `ifError` node' +
      'that returns an expression that resolves to a globally-scoped error node' +
      'with a dynamic fallback value that depends on scoped context values',
    graph: () =>
      muster({
        foo: fn(() => error('ERROR')),
        scoped: scope(ifError(() => context('foo'), get(context('global'), 'foo')), {
          global: root(),
          foo: value('bar'),
        }),
      }),
    operations: [
      operation({
        description: 'SHOULD resolve to the fallback value',
        input: call('scoped'),
        expected: value('bar'),
      }),
    ],
  });
});
