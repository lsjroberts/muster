import muster, { error, getType, NOT_FOUND, param, ref, root, types, value } from '../..';
import { operation, runScenario } from '../../test';
import { withErrorPath } from './error';
import { match, tree } from './tree';

describe('tree()', () => {
  runScenario({
    description: 'GIVEN an empty tree node',
    graph: () => muster({}),
    operations: [
      operation({
        description: 'AND a request is made for the root node',
        input: root(),
        expected: tree({}),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN an tree node with static string keys',
    graph: () =>
      muster({
        foo: value('value:foo'),
        bar: value('value:bar'),
        baz: value('value:baz'),
      }),
    operations: [
      operation({
        description: 'AND a request is made for a child node',
        input: ref('foo'),
        expected: value('value:foo'),
      }),
      operation({
        description: 'AND a request is made for a missing child node',
        input: ref('qux'),
        expected: withErrorPath(error('Invalid child key: "qux"', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
    ],
  });

  const FOO = Symbol('foo');
  const BAR = Symbol('bar');
  const BAZ = Symbol('baz');
  const QUX = Symbol('qux');
  runScenario({
    description: 'GIVEN an tree node with static symbol keys',
    graph: () =>
      muster({
        [FOO]: value('value:foo'),
        [BAR]: value('value:bar'),
        [BAZ]: value('value:baz'),
      }),
    operations: [
      operation({
        description: 'AND a request is made for a child node',
        input: ref(FOO),
        expected: value('value:foo'),
      }),
      operation({
        description: 'AND a request is made for a missing child node',
        input: ref(QUX),
        expected: withErrorPath(error('Invalid child key: Symbol(qux)', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree node with a dynamic string matcher',
    graph: () =>
      muster({
        [match((value: any) => typeof value === 'string', 'id')]: param('id'),
      }),
    operations: [
      operation({
        description: 'AND a request is made for a matching child node',
        input: ref('foo'),
        expected: value('foo'),
      }),
      operation({
        description: 'AND a request is made for a non-matching child node',
        input: ref(3),
        expected: withErrorPath(error('Invalid child key: 3', { code: NOT_FOUND }), { path: [] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree node with a dynamic number matcher',
    graph: () =>
      muster({
        [match((value: any) => typeof value === 'number', 'index')]: param('index'),
      }),
    operations: [
      operation({
        description: 'AND a request is made for a matching child node',
        input: ref(3),
        expected: value(3),
      }),
      operation({
        description: 'AND a request is made for a non-matching child node',
        input: ref('foo'),
        expected: withErrorPath(error('Invalid child key: "foo"', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree node with a dynamic custom matcher',
    graph: () =>
      muster({
        [match((value: any) => value.startsWith('f'), 'index')]: param('index'),
      }),
    operations: [
      operation({
        description: 'AND a request is made for a matching child node',
        input: ref('foo'),
        expected: value('foo'),
      }),
      operation({
        description: 'AND a request is made for a non-matching child node',
        input: ref('bar'),
        expected: withErrorPath(error('Invalid child key: "bar"', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree node with a static matcher followed by a dynamic matcher',
    graph: () =>
      muster({
        foo: value('static:foo'),
        [match((value: any) => typeof value === 'string', 'index')]: param('index'),
      }),
    operations: [
      operation({
        description: 'SHOULD return the first matching matcher',
        input: ref('foo'),
        expected: value('static:foo'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree node with a dynamic matcher followed by a static matcher',
    graph: () =>
      muster({
        [match((value: any) => typeof value === 'string', 'index')]: param('index'),
        foo: value('static:foo'),
      }),
    operations: [
      operation({
        description: 'SHOULD return the first matcher',
        input: ref('foo'),
        expected: value('foo'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree with a string matcher',
    graph: () =>
      muster({
        brokenPathPart: error('This should throw'),
        nested: {
          [match(types.string, 'name')]: {
            value: value('nested value'),
          },
        },
      }),
    operations: [
      operation({
        description: 'SHOULD return the error from the `brokenPathPart`.',
        input: ref('nested', ref('brokenPathPart'), 'value'),
        expected: withErrorPath(error('This should throw'), { path: ['brokenPathPart'] }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree with a string matcher',
    graph: () =>
      muster({
        undefinedValue: value(undefined),
        other: {
          [match(types.string, 'name')]: {
            value: value('other value'),
          },
        },
      }),
    operations: [
      operation({
        description: 'SHOULD return the error from the `brokenPathPart`.',
        input: ref('other', ref('undefinedValue'), 'value'),
        expected: withErrorPath(error('Invalid child key: undefined', { code: NOT_FOUND }), {
          path: ['other'],
        }),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree with a number',
    graph: () =>
      muster({
        items: {
          0: value('test value'),
        },
      }),
    operations: [
      operation({
        description: 'SHOULD return value.',
        input: ref('items', 0),
        expected: value('test value'),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a tree with a shape matcher',
    graph: () =>
      muster({
        [match(types.shape({ id: types.string }), 'obj')]: param('obj'),
      }),
    operations: [
      operation({
        description: 'WHEN using a ref with an object with correct props',
        input: ref(value({ id: 'test' })),
        expected: value({ id: 'test' }),
      }),
      operation({
        description: 'WHEN using a ref with an object containing extra props',
        input: ref(value({ id: 'test', name: 'blah' })),
        expected: value({ id: 'test', name: 'blah' }),
      }),
      operation({
        description: 'WHEN using a ref with an object with incorrect type props',
        input: ref(value({ id: 123 })),
        expected: withErrorPath(error('Invalid child key: {id: 123}', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
      operation({
        description: 'WHEN using a ref with an incorrect object',
        input: ref(value({ name: 'blah' })),
        expected: withErrorPath(error('Invalid child key: {name: "blah"}', { code: NOT_FOUND }), {
          path: [],
        }),
      }),
    ],
  });
});

describe('getType(tree())', () => {
  describe('WHEN called with an empty tree', () => {
    it('SHOULD return correct string', () => {
      expect(getType(tree({}))).toEqual('tree({  })');
    });
  });

  describe('WHEN called with a tree with a single branch', () => {
    it('SHOULD return correct string', () => {
      expect(
        getType(
          tree({
            name: value('Hello world'),
          }),
        ),
      ).toEqual('tree({ name: value("Hello world") })');
    });
  });
});
