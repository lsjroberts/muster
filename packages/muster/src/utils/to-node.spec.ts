import muster, {
  array,
  error,
  isValueNodeDefinition,
  NodeDefinition,
  NOT_FOUND,
  parent,
  ref,
  tree,
  value,
  withErrorPath,
} from '..';
import { operation, runScenario } from '../test';
import { toNode } from './to-node';

function testFunction() {}

class TestClass {}

describe('graph', () => {
  describe('WHEN converting simple types', () => {
    it('SHOULD correctly convert an undefined', () => {
      expect(toNode(undefined)).toEqual(value(undefined));
    });

    it('SHOULD correctly convert a null', () => {
      expect(toNode(null)).toEqual(value(null));
    });

    it('SHOULD correctly convert a number', () => {
      expect(toNode(1.51)).toEqual(value(1.51));
    });

    it('SHOULD correctly convert a string', () => {
      expect(toNode('test string')).toEqual(value('test string'));
    });

    it('SHOULD correctly convert a Date', () => {
      const testDate = new Date();
      expect(toNode(testDate)).toEqual(value(testDate));
    });

    it('SHOULD correctly convert a function', () => {
      expect(toNode(testFunction)).toEqual(value(testFunction));
    });

    it('SHOULD correctly convert a class type', () => {
      expect(toNode(TestClass)).toEqual(value(TestClass));
    });

    it('SHOULD correctly convert a class instance', () => {
      const instance = new TestClass();
      expect(toNode(instance)).toEqual(value(instance));
    });

    it('SHOULD correctly convert a graph node', () => {
      const node = parent();
      expect(toNode(node)).toEqual(node);
    });
  });

  describe('WHEN converting arrays', () => {
    it('SHOULD correctly convert an array of primitives to a array', () => {
      const values = ['foo', 'bar', 'baz'];
      expect(toNode(values)).toEqual(array([value('foo'), value('bar'), value('baz')]));
    });

    it('SHOULD correctly convert an array of complex objects to a array', () => {
      const values = [{ id: 1, name: 'foo' }, { id: 2, name: 'bar' }, { id: 3, name: 'baz' }];
      expect(toNode(values)).toEqual(
        array([
          tree({
            id: value(1),
            name: value('foo'),
          }),
          tree({
            id: value(2),
            name: value('bar'),
          }),
          tree({
            id: value(3),
            name: value('baz'),
          }),
        ]),
      );
    });
  });

  describe('WHEN converting objects', () => {
    it('SHOULD convert object created with Object.create(null) to a branch', () => {
      expect(toNode(Object.create(null))).toEqual(tree({}));
    });

    it('SHOULD convert empty object to a branch', () => {
      expect(toNode({})).toEqual(tree({}));
    });

    it('SHOULD convert simple nested objects to nested branches', () => {
      const input = {
        name: 'test',
        items: [{ name: 'first' }, { name: 'second' }],
      };
      const output = tree({
        name: value('test'),
        items: array([tree({ name: value('first') }), tree({ name: value('second') })]),
      });
      expect(toNode(input)).toEqual(output);
    });

    it('SHOULD convert nested objects to nested branches', () => {
      const input = {
        someString: 'test string',
        someNumber: 123,
        deeply: {
          other: new Date(),
          node: parent(),
          nested: {
            value: new TestClass(),
            list: [
              {
                id: 1,
                name: 'foo',
                children: [
                  { id: 1, name: 'foo:1' },
                  { id: 2, name: 'foo:2' },
                  { id: 3, name: 'foo:3' },
                ],
              },
              {
                id: 2,
                name: 'bar',
                children: [
                  { id: 1, name: 'bar:1' },
                  { id: 2, name: 'bar:2' },
                  { id: 3, name: 'bar:3' },
                ],
              },
              {
                id: 3,
                name: 'baz',
                children: [
                  { id: 1, name: 'baz:1' },
                  { id: 2, name: 'baz:2' },
                  { id: 3, name: 'baz:3' },
                ],
              },
            ],
          },
        },
      };
      const output = tree({
        someString: value(input.someString),
        someNumber: value(input.someNumber),
        deeply: tree({
          other: value(input.deeply.other),
          node: parent(),
          nested: tree({
            value: value(input.deeply.nested.value),
            list: array([
              tree({
                id: value(1),
                name: value('foo'),
                children: array([
                  tree({
                    id: value(1),
                    name: value('foo:1'),
                  }),
                  tree({
                    id: value(2),
                    name: value('foo:2'),
                  }),
                  tree({
                    id: value(3),
                    name: value('foo:3'),
                  }),
                ]),
              }),
              tree({
                id: value(2),
                name: value('bar'),
                children: array([
                  tree({
                    id: value(1),
                    name: value('bar:1'),
                  }),
                  tree({
                    id: value(2),
                    name: value('bar:2'),
                  }),
                  tree({
                    id: value(3),
                    name: value('bar:3'),
                  }),
                ]),
              }),
              tree({
                id: value(3),
                name: value('baz'),
                children: array([
                  tree({
                    id: value(1),
                    name: value('baz:1'),
                  }),
                  tree({
                    id: value(2),
                    name: value('baz:2'),
                  }),
                  tree({
                    id: value(3),
                    name: value('baz:3'),
                  }),
                ]),
              }),
            ]),
          }),
        }),
      });
      expect(toNode(input)).toEqual(output);
    });

    it('SHOULD convert branches with symbol keys', () => {
      const FOO = Symbol('foo');
      expect(toNode({ [FOO]: value('foo') })).toEqual(tree({ [FOO]: value('foo') }));
    });
  });

  describe('GIVEN a custom replacer function', () => {
    let replacer: (value: any) => NodeDefinition | undefined;
    beforeEach(() => {
      replacer = (node: any) =>
        typeof node === 'string' && node.startsWith('b') ? value(node.toUpperCase()) : undefined;
    });

    it('SHOULD NOT replace matching nodes', () => {
      expect(toNode('foo', replacer)).toEqual(value('foo'));
      expect(toNode('foo', { transform: replacer })).toEqual(value('foo'));
    });

    it('SHOULD replace matching nodes', () => {
      expect(toNode('bar', replacer)).toEqual(value('BAR'));
      expect(toNode('bar', { transform: replacer })).toEqual(value('BAR'));
    });

    it('SHOULD replace nodes within nested objects', () => {
      expect(
        toNode(
          {
            one: 'foo',
            two: 'bar',
            three: 'baz',
          },
          replacer,
        ),
      ).toEqual(
        tree({
          one: value('foo'),
          two: value('BAR'),
          three: value('BAZ'),
        }),
      );
    });

    it('SHOULD replace nodes within nested arrays', () => {
      expect(toNode(['foo', 'bar', 'baz'], replacer)).toEqual(
        array([value('foo'), value('BAR'), value('BAZ')]),
      );
    });
  });

  runScenario({
    description: 'WHEN catchAll is set to true',
    graph: () =>
      muster(
        toNode(
          {
            foo: value('bar'),
            deeply: {
              nested: {
                bar: value('baz'),
              },
            },
          },
          { catchAll: true },
        ),
      ),
    operations: [
      operation({
        description: 'SHOULD retrieve explicitly specified nodes',
        input: ref('foo'),
        expected: value('bar'),
      }),
      operation({
        description: 'SHOULD return null for unspecified nodes',
        input: ref('bar'),
        expected: value(undefined),
      }),
      operation({
        description: 'SHOULD return null recursively for children of unspecified nodes',
        input: ref('bar', 'baz', 'qux'),
        expected: value(undefined),
      }),
      operation({
        description: 'SHOULD return null for unspecified children of nested nodes',
        input: ref('deeply', 'nested', 'baz', 'qux'),
        expected: value(undefined),
      }),
    ],
  });

  runScenario({
    description: 'WHEN catchAll is set to a factory function that returns a value node',
    graph: () =>
      muster(
        toNode(
          {
            foo: value('bar'),
            deeply: {
              nested: {
                bar: value('baz'),
              },
            },
          },
          { catchAll: (key) => value(key) },
        ),
      ),
    operations: [
      operation({
        description: 'SHOULD retrieve explicitly specified nodes',
        input: ref('foo'),
        expected: value('bar'),
      }),
      operation({
        description: 'SHOULD return a replacement value for unspecified nodes',
        input: ref('missing'),
        expected: value('missing'),
      }),
      operation({
        description: 'SHOULD NOT add a catch-all for replacements of unspecified nodes',
        input: ref('missing', 'bar'),
        expected: withErrorPath(
          error(
            ['Value node does not allow child access', ' Received:', '  value("missing")'].join(
              '\n',
            ),
          ),
          { path: ['missing'] },
        ),
      }),
      operation({
        description: 'SHOULD return a replacement value for children of unspecified nodes',
        input: ref('deeply', 'nested', 'baz'),
        expected: value('baz'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN catchAll is set to a factory function that returns a branch node',
    graph: () =>
      muster(
        toNode(
          {
            foo: value('bar'),
            deeply: {
              nested: {
                bar: value('baz'),
              },
            },
          },
          { catchAll: (key) => tree({ value: value(key) }) },
        ),
      ),
    operations: [
      operation({
        description: 'SHOULD retrieve explicitly specified nodes',
        input: ref('foo'),
        expected: value('bar'),
      }),
      operation({
        description: 'SHOULD return a replacement branch for unspecified nodes',
        input: ref('missing', 'value'),
        expected: value('missing'),
      }),
      operation({
        description: "SHOULD NOT override the replacement branch's getChild() behaviour",
        input: ref('missing', 'foo'),
        expected: withErrorPath(error('Invalid child key: "foo"', { code: NOT_FOUND }), {
          path: ['missing'],
        }),
      }),
      operation({
        description: 'SHOULD return a replacement value for children of unspecified nodes',
        input: ref('deeply', 'nested', 'baz', 'value'),
        expected: value('baz'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN both a catchAll factory function and a custom replacer are specified',
    graph: () =>
      muster(
        toNode(
          {
            foo: value('bar'),
            deeply: {
              nested: {
                bar: value('baz'),
              },
            },
            custom: Object.assign(
              tree({
                baz: value('qux'),
              }),
              { PREVENT_PROCESSING: true },
            ),
          },
          {
            catchAll: (key) => value(key),
            transform: (node) => {
              if (isValueNodeDefinition(node)) {
                return value((node.properties.value as string).toUpperCase());
              }
              if ((node as any).PREVENT_PROCESSING) {
                return node;
              }
              return undefined;
            },
          },
        ),
      ),
    operations: [
      operation({
        description: 'SHOULD transform explicitly specified nodes',
        input: ref('foo'),
        expected: value('BAR'),
      }),
      operation({
        description: 'SHOULD NOT transform replacement values for unspecified nodes',
        input: ref('missing'),
        expected: value('missing'),
      }),
      operation({
        description: 'SHOULD return a replacement value for deeply nested unspecified nodes',
        input: ref('deeply', 'nested', 'baz'),
        expected: value('baz'),
      }),
      operation({
        description: 'SHOULD NOT apply the catchAll to nodes returned from the replacer function',
        input: ref('custom', 'qux'),
        expected: withErrorPath(error('Invalid child key: "qux"', { code: NOT_FOUND }), {
          path: ['custom'],
        }),
      }),
    ],
  });
});
