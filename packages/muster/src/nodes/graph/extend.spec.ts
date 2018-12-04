import muster, {
  action,
  call,
  computed,
  context,
  error,
  factory,
  fromPromise,
  getInvalidTypeError,
  match,
  NodeDefinition,
  NOT_FOUND,
  param,
  ref,
  relative,
  scope,
  series,
  set,
  toNode,
  tree,
  types,
  value,
  variable,
} from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { extend } from './extend';

describe('extend', () => {
  runScenario({
    description: 'GIVEN a graph containing a branch that extends two child branches',
    graph: () =>
      muster(
        toNode({
          combined: extend(
            tree({
              one: value('1'),
              three: value('value three'),
              [match(types.integer, 'blah')]: value('and here is constant'),
            }),
            tree({
              two: value('2 two'),
              [match(types.integer, 'blah')]: param('blah'),
            }),
          ),
        }),
      ),
    operations: [
      operation({
        description: 'WHEN requesting `first` out of combined node',
        input: ref('combined', 'one'),
        expected: value('1'),
      }),
      operation({
        description: 'WHEN requesting `two` out of combined node',
        input: ref('combined', 'two'),
        expected: value('2 two'),
      }),
      operation({
        description: 'WHEN requesting `three` out of combined node',
        input: ref('combined', 'three'),
        expected: value('value three'),
      }),
      operation({
        description: 'WHEN requesting `12345` out of combined node',
        input: ref('combined', 12345),
        expected: value(12345),
      }),
      operation({
        description: 'WHEN requesting a non-existent node',
        input: ref('combined', 'missing'),
        expected: withErrorPath(error('Invalid child key: "missing"', { code: NOT_FOUND }), {
          path: ['combined'],
        }),
      }),
    ],
  });

  let factory1: jest.Mock<NodeDefinition>;
  let factory2: jest.Mock<NodeDefinition>;
  runScenario({
    description: 'GIVEN a graph containing asynchronous overlapping branches',
    before: () => {
      factory1 = jest.fn(() => tree({ foo: value('bar') }));
      factory2 = jest.fn(() => tree({ foo: value('baz') }));
    },
    graph: () =>
      muster(
        toNode({
          combined: extend(factory(factory1), factory(factory2)),
        }),
      ),
    operations: [
      operation({
        description: 'WHEN requesting one of the overlapping branches',
        input: ref('combined', 'foo'),
        expected: value('baz'),
        assert: () => {
          expect(factory1).toHaveBeenCalledTimes(0);
          expect(factory2).toHaveBeenCalledTimes(1);
        },
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing an extend branch that wraps a non-parent node',
    graph: () =>
      muster(
        toNode({
          combined: extend(
            value('bar'),
            tree({
              foo: value('foo'),
            }),
          ),
        }),
      ),
    operations: [
      operation({
        description: 'WHEN requesting a branch',
        input: ref('combined', 'bar'),
        expected: withErrorPath(
          error(
            getInvalidTypeError('Node does not support getChild operation', {
              expected: 'Node supporting getChild operation',
              received: value('bar'),
            }),
          ),
          { path: ['combined'] },
        ),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a scoped branch node that accesses an injected variable',
    graph: () =>
      muster(
        toNode({
          foo: variable('test value'),
          combined: extend(scope({ fooInScope: context('foo') }, { foo: ref('foo') })),
        }),
      ),
    operations: [
      operation({
        description: 'WHEN requesting the parent branch name out of the extended branch',
        input: ref('combined', 'fooInScope'),
        expected: value('test value'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with multiple variables',
    graph: () =>
      muster(
        extend(
          toNode({
            foo: variable(''),
            bar: variable(''),
            setVariables: action(() => series([set(ref('foo'), 'foo'), set(ref('bar'), 'bar')])),
          }),
        ),
      ),
    operations: [
      operation({
        description: 'WHEN setting foo',
        input: call(ref('setVariables'), []),
        expected: value('bar'),
        operations: [
          operation({
            description: 'foo SHOULD be set correctly',
            input: ref('foo'),
            expected: value('foo'),
          }),
          operation({
            description: 'bar SHOULD be set correctly',
            input: ref('bar'),
            expected: value('bar'),
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with an extended branch',
    graph: () =>
      muster({
        users: scope({
          test: {
            firstName: 'Bob',
            lastName: 'Smith',
            fullName: computed(
              [ref(relative('firstName')), ref(relative('lastName'))],
              (firstName: string, lastName: string) => `${firstName} ${lastName}`,
            ),
          },
        }),
        currentUser: extend(ref('users', 'test'), tree({ name: value('test') })),
      }),
    operations: [
      operation({
        description: 'AND the first name is requested',
        input: ref('currentUser', 'fullName'),
        expected: value('Bob Smith'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with a scope containing an extend node',
    graph: () =>
      muster({
        navigation: extend(
          scope({
            state: variable('initial'),
            updateState: action(function*(val) {
              yield set('state', val);
              return val;
            }),
          }),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the variable form the extended scope',
        input: ref('navigation', 'state'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            before() {
              jest.clearAllMocks();
            },
            description: 'AND the state gets updated from the action',
            input: call(ref('navigation', 'updateState'), ['updated']),
            expected: value('updated'),
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph with an extend node containing an error',
    graph: () =>
      muster({
        session: variable('asdf'),
        nested: extend(
          computed([ref('session')], () => fromPromise(() => Promise.reject(error('Whoops')))),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN requesting name out of the extended node',
        input: ref('nested', 'name', 'asdf'),
        expected: withErrorPath(error('Whoops'), { path: ['nested'] }),
      }),
    ],
  });
});
