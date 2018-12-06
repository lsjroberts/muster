import muster, {
  computed,
  context,
  error,
  get,
  nil,
  ok,
  parent,
  reset,
  root,
  set,
  toNode,
  tree,
  types,
  value,
  variable,
  withContext,
} from '..';
import { withErrorPath } from '../nodes/graph/error';
import { match } from '../nodes/graph/tree';
import { ref } from '../utils/ref';
import runScenario, { operation } from './run-scenario';

describe('MusterGraph™', () => {
  runScenario({
    description: 'GIVEN a Muster graph',
    operations: [
      operation({
        description: 'SHOULD evaluate value nodes',
        input: value('foo'),
        expected: value('foo'),
      }),
      operation({
        description: 'SHOULD evaluate error nodes',
        input: error('foo'),
        expected: withErrorPath(error('foo'), { path: [] }),
      }),
      operation({
        description: 'SHOULD evaluate nil nodes',
        input: nil(),
        expected: value(undefined),
      }),
      operation({
        description: 'SHOULD evaluate computed nodes',
        input: computed([value(1), value(2), value(3)], (...values: Array<number>) =>
          value(values.reduce((acc, x) => acc + x, 0)),
        ),
        expected: value(6),
      }),
      operation({
        description: 'SHOULD evaluate computed nodes with errors in the dependencies',
        input: computed([error('foo'), value(2), value(3)], (...values: Array<number>) =>
          value(values.reduce((acc, x) => acc + x, 0)),
        ),
        expected: withErrorPath(error('foo'), { path: [] }),
      }),
      operation({
        description: 'SHOULD allow node traversal',
        input: get(
          tree({
            one: value('foo'),
            two: value('two'),
            three: value('three'),
          }),
          value('one'),
        ),
        expected: value('foo'),
      }),
      operation({
        description: 'SHOULD allow relative references',
        input: get(
          get(
            toNode({
              foo: {
                bar: get(parent(), value('baz')),
                baz: value('baz'),
              },
            }),
            value('foo'),
          ),
          value('bar'),
        ),
        expected: value('baz'),
      }),
      operation({
        description: 'SHOULD report nested graph errors at correct path',
        input: get(
          get(
            toNode({
              nested: {
                one: error('foo'),
                two: value('two'),
                three: value('three'),
              },
            }),
            value('nested'),
          ),
          value('one'),
        ),
        expected: withErrorPath(error('foo'), { path: ['nested', 'one'] }),
      }),
      operation({
        description: 'SHOULD report named dynamic graph errors at correct path',
        input: get(
          toNode({
            [match(types.string, 'id')]: error('ERROR!'),
          }),
          value('foo'),
        ),
        expected: withErrorPath(error('ERROR!'), { path: ['foo'] }),
      }),
      operation({
        description: 'SHOULD report unnamed dynamic graph errors at correct path',
        input: get(
          toNode({
            [match(types.string)]: error('ERROR!'),
          }),
          value('foo'),
        ),
        expected: withErrorPath(error('ERROR!'), {
          path: ['foo'],
        }),
      }),
      operation({
        description: 'SHOULD report nested tree errors at correct path',
        input: get(
          tree({
            one: error('foo'),
            two: value('two'),
            three: value('three'),
          }),
          value('one'),
        ),
        expected: withErrorPath(error('foo'), { path: ['one'] }),
      }),
      operation({
        description: 'SHOULD NOT leak context values between relative references',
        input: get(
          get(
            toNode({
              foo: {
                bar: withContext({ secret: value('uh-oh') }, get(parent(), value('baz'))),
                baz: context('secret'),
              },
            }),
            value('foo'),
          ),
          value('bar'),
        ),
        expected: withErrorPath(error(`Missing context dependency: "secret"`), {
          path: ['foo', 'baz'],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a withContext node',
    graph: () =>
      muster({
        foo: {
          bar: withContext({ secret: value('uh-oh') }, get(parent(), value('baz'))),
          baz: context('secret'),
        },
      }),
    operations: [
      operation({
        description: 'WHEN requesting foo->bar it should give an error',
        input: ref('foo', 'bar'),
        expected: withErrorPath(error(`Missing context dependency: "secret"`), {
          path: ['foo', 'baz'],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a root node',
    graph: () => muster(value('foo')),
    operations: [
      operation({
        description: 'SHOULD allow querying the root node',
        input: root(),
        expected: value('foo'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a settable node',
    graph: () => muster(variable(value('foo'))),
    operations: [
      operation({
        description: 'AND the settable node is retrieved',
        input: root(),
        expected: value('foo'),
        operations: (subscriber) => [
          operation({
            description: 'AND the value is reset',
            input: reset(root()),
            expected: ok(),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(subscriber().next).not.toHaveBeenCalled();
            },
            operations: [
              operation({
                description: 'AND the value is retrieved',
                input: root(),
                expected: value('foo'),
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'AND the settable node is updated',
        input: set(root(), value('bar')),
        expected: value('bar'),
        operations: [
          operation({
            description: 'AND the value is retrieved',
            input: root(),
            expected: value('bar'),
          }),
          operation({
            description: 'AND the value is reset',
            input: reset(root()),
            expected: ok(),
            operations: [
              operation({
                description: 'AND the value is retrieved',
                input: root(),
                expected: value('foo'),
              }),
            ],
          }),
        ],
      }),
      operation({
        description: 'AND a subscription is created to the settable node',
        input: root(),
        expected: value('foo'),
        operations: (subscriber) => [
          operation({
            description: 'AND the settable node is updated',
            input: set(root(), value('bar')),
            expected: value('bar'),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('bar'));
            },
            operations: [
              operation({
                description: 'AND the value is reset',
                input: reset(root()),
                expected: ok(),
                before() {
                  jest.clearAllMocks();
                },
                assert() {
                  expect(subscriber().next).toHaveBeenCalledTimes(1);
                  expect(subscriber().next).toHaveBeenCalledWith(value('foo'));
                },
                operations: [
                  operation({
                    description: 'AND the value is retrieved',
                    input: root(),
                    expected: value('foo'),
                  }),
                ],
              }),
              operation({
                description: 'AND the subscription is unsubscribed',
                before() {
                  subscriber().subscription.unsubscribe();
                },
                operations: [
                  operation({
                    description: 'AND the settable node is retrieved',
                    input: root(),
                    expected: value('bar'),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
