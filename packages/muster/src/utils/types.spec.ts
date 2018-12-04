import { Matcher } from '..';

import * as types from './types';

const DUMMY_VALUES = [
  undefined,
  null,
  false,
  true,
  0,
  1,
  -1,
  Math.PI,
  Number.MIN_SAFE_INTEGER,
  Number.MAX_SAFE_INTEGER,
  Number.MIN_VALUE,
  Number.MAX_VALUE,
  Infinity,
  -Infinity,
  NaN,
  '',
  'foo',
  [],
  ['foo', 'bar', 'baz'],
  {},
  { foo: true, bar: true, baz: true },
  new Date(0),
  new Date(Date.now()),
  new Date(Date.now() + 86400000),
  Symbol('foo'),
  function foo() {},
  class Foo {},
];

describe('types()', () => {
  describe('types.ignore', () => {
    let matcher: Matcher<any>;
    beforeEach(() => {
      matcher = types.ignore;
    });

    it('SHOULD match all values', () => {
      expect(DUMMY_VALUES.every((value) => matcher(value))).toBe(true);
    });
  });

  describe('types.any', () => {
    let matcher: Matcher<any>;
    beforeEach(() => {
      matcher = types.any;
    });

    it('SHOULD match all values', () => {
      expect(DUMMY_VALUES.every((value) => matcher(value))).toBe(true);
    });
  });

  describe('types.empty', () => {
    let matcher: Matcher<undefined>;
    beforeEach(() => {
      matcher = types.empty;
    });

    it('SHOULD match undefined', () => {
      expect(matcher(undefined)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => value !== undefined).every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.nil', () => {
    let matcher: Matcher<null>;
    beforeEach(() => {
      matcher = types.nil;
    });

    it('SHOULD match null', () => {
      expect(matcher(null)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(DUMMY_VALUES.filter((value) => value !== null).every((value) => matcher(value))).toBe(
        false,
      );
    });
  });

  describe('types.bool', () => {
    let matcher: Matcher<boolean>;
    beforeEach(() => {
      matcher = types.bool;
    });

    it('SHOULD match true', () => {
      expect(matcher(true)).toBe(true);
    });

    it('SHOULD match false', () => {
      expect(matcher(false)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'boolean').every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.number', () => {
    let matcher: Matcher<number>;
    beforeEach(() => {
      matcher = types.number;
    });

    it('SHOULD match numbers', () => {
      expect(matcher(0)).toBe(true);
      expect(matcher(1)).toBe(true);
      expect(matcher(-1)).toBe(true);
      expect(matcher(Math.PI)).toBe(true);
      expect(matcher(Number.MIN_SAFE_INTEGER)).toBe(true);
      expect(matcher(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(matcher(Number.MIN_VALUE)).toBe(true);
      expect(matcher(Number.MAX_VALUE)).toBe(true);
      expect(matcher(Infinity)).toBe(true);
      expect(matcher(-Infinity)).toBe(true);
      expect(matcher(NaN)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'number').every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.integer', () => {
    let matcher: Matcher<number>;
    beforeEach(() => {
      matcher = types.integer;
    });

    it('SHOULD match integers', () => {
      expect(matcher(0)).toBe(true);
      expect(matcher(1)).toBe(true);
      expect(matcher(-1)).toBe(true);
      expect(matcher(Number.MIN_SAFE_INTEGER)).toBe(true);
      expect(matcher(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'number' || !Number.isInteger(value)).every(
          (value) => matcher(value),
        ),
      ).toBe(false);
    });
  });

  describe('types.string', () => {
    let matcher: Matcher<string>;
    beforeEach(() => {
      matcher = types.string;
    });

    it('SHOULD match strings', () => {
      expect(matcher('foo')).toBe(true);
      expect(matcher('')).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'string').every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.date', () => {
    let matcher: Matcher<Date>;
    beforeEach(() => {
      matcher = types.date;
    });

    it('SHOULD match dates', () => {
      expect(matcher(new Date())).toBe(true);
      expect(matcher(new Date(Date.now() + 86400000))).toBe(true);
      expect(matcher(new Date(0))).toBe(true);
      expect(matcher(new Date(-1))).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => !(value instanceof Date)).every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.func', () => {
    let matcher: Matcher<Function>;
    beforeEach(() => {
      matcher = types.func;
    });

    it('SHOULD match functions', () => {
      expect(matcher(() => {})).toBe(true);
      expect(matcher(class Foo {})).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'function').every((value) =>
          matcher(value),
        ),
      ).toBe(false);
    });
  });

  describe('types.symbol', () => {
    let matcher: Matcher<symbol>;
    beforeEach(() => {
      matcher = types.symbol;
    });

    it('SHOULD match symbols', () => {
      expect(matcher(Symbol())).toBe(true);
      expect(matcher(Symbol('foo'))).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'symbol').every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.object', () => {
    let matcher: Matcher<object>;
    beforeEach(() => {
      matcher = types.object;
    });

    it('SHOULD match plain objects', () => {
      expect(matcher({})).toBe(true);
      expect(matcher({ foo: true })).toBe(true);
      expect(matcher(Object.create(null))).toBe(true);
      expect(matcher(new Object())).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter(
          (value) =>
            typeof value !== 'object' &&
            (!value || Boolean(value.constructor && value.constructor !== Object)),
        ).every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.instance', () => {
    let matcher: Matcher<{ foo: string }>;
    class BooleanFoo {
      public foo: boolean;
      constructor() {
        this.foo = true;
      }
    }
    class StringFoo {
      public foo: string;
      constructor() {
        this.foo = 'foo';
      }
    }
    beforeEach(() => {
      matcher = types.instance({
        foo: types.string,
      });
    });

    it('SHOULD match class instances with the correct shape', () => {
      expect(matcher(new StringFoo())).toBe(true);
    });

    it('SHOULD NOT match class instances with an incorrect shape', () => {
      expect(matcher(new BooleanFoo())).toBe(false);
    });

    it('SHOULD NOT match any other values', () => {
      expect(DUMMY_VALUES.every((value) => matcher(value))).toBe(false);
    });
  });

  describe('types.instanceOf(Boolean)', () => {
    let matcher: Matcher<boolean>;
    beforeEach(() => {
      matcher = types.instanceOf(Boolean);
    });

    it('SHOULD match boolean values', () => {
      expect(matcher(true)).toBe(true);
      expect(matcher(false)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'boolean').every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.instanceOf(Number)', () => {
    let matcher: Matcher<number>;
    beforeEach(() => {
      matcher = types.instanceOf(Number);
    });

    it('SHOULD match number values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value === 'number').every((value) => matcher(value)),
      ).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'number').every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.instanceOf(String)', () => {
    let matcher: Matcher<string>;
    beforeEach(() => {
      matcher = types.instanceOf(String);
    });

    it('SHOULD match string values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value === 'string').every((value) => matcher(value)),
      ).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'string').every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.instanceOf(Function)', () => {
    let matcher: Matcher<Function>;
    beforeEach(() => {
      matcher = types.instanceOf(Function);
    });

    it('SHOULD match function values', () => {
      expect(matcher(() => {})).toBe(true);
      expect(matcher(class Foo {})).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'function').every((value) =>
          matcher(value),
        ),
      ).toBe(false);
    });
  });

  describe('types.instanceOf(Symbol)', () => {
    let matcher: Matcher<symbol>;
    beforeEach(() => {
      matcher = types.instanceOf(Symbol);
    });

    it('SHOULD match symbol values', () => {
      expect(matcher(Symbol())).toBe(true);
      expect(matcher(Symbol('foo'))).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'function').every((value) =>
          matcher(value),
        ),
      ).toBe(false);
    });
  });

  describe('types.instanceOf(Object)', () => {
    let matcher: Matcher<object>;
    beforeEach(() => {
      matcher = types.instanceOf(Object);
    });

    it('SHOULD match plain objects', () => {
      expect(matcher({})).toBe(true);
      expect(matcher({ foo: true })).toBe(true);
      expect(matcher(Object.create(null))).toBe(true);
      expect(matcher(new Object())).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter(
          (value) =>
            typeof value !== 'object' &&
            (!value || Boolean(value.constructor && value.constructor !== Object)),
        ).every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.instanceOf(Array)', () => {
    let matcher: Matcher<Array<any>>;
    beforeEach(() => {
      matcher = types.instanceOf(Array);
    });

    it('SHOULD match arrays', () => {
      expect(matcher(['foo', 'bar', 'baz'])).toBe(true);
      expect(matcher([])).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => !Array.isArray(value)).every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.instanceOf(class)', () => {
    let matcher: Matcher<Foo>;
    class Foo {}
    class Bar {}

    beforeEach(() => {
      matcher = types.instanceOf(Foo);
    });

    it('SHOULD match instances of the correct class', () => {
      expect(matcher(new Foo())).toBe(true);
    });

    it('SHOULD NOT match instances of other classes', () => {
      expect(matcher(new Bar())).toBe(false);
    });

    it('SHOULD NOT match any other values', () => {
      expect(DUMMY_VALUES.every((value) => matcher(value))).toBe(false);
    });
  });

  describe('types.oneOf', () => {
    let matcher: Matcher<symbol | Foo>;
    let unique: symbol;
    let object: {};
    let instance: Foo;
    class Foo {}
    beforeEach(() => {
      unique = Symbol('UNIQUE');
      object = {};
      instance = new Foo();
      matcher = types.oneOf(['foo', unique, object, instance]);
    });

    it('SHOULD match the provided values', () => {
      expect(matcher('foo')).toBe(true);
      expect(matcher(unique)).toBe(true);
      expect(matcher(object)).toBe(true);
      expect(matcher(instance)).toBe(true);
    });

    it('SHOULD NOT match values that were not provided', () => {
      expect(matcher('bar')).toBe(false);
      expect(matcher(Symbol('UNIQUE'))).toBe(false);
      expect(matcher({})).toBe(false);
      expect(matcher(new Foo())).toBe(false);
    });

    it('SHOULD NOT match any other values', () => {
      expect(DUMMY_VALUES.filter((value) => value !== 'foo').every((value) => matcher(value))).toBe(
        false,
      );
    });
  });

  describe('types.shape', () => {
    let matcher: Matcher<{
      foo: boolean;
      bar: string;
      baz: {
        qux: number;
      };
    }>;
    beforeEach(() => {
      matcher = types.shape({
        foo: types.bool,
        bar: types.string,
        baz: types.shape({
          qux: types.number,
        }),
      });
    });

    it('SHOULD match an object with the correct shape', () => {
      expect(
        matcher({
          foo: true,
          bar: 'foo',
          baz: {
            qux: 3,
          },
        }),
      ).toBe(true);
      expect(
        matcher({
          foo: true,
          bar: 'foo',
          baz: {
            qux: 3,
          },
          extra: 'ignored',
        }),
      ).toBe(true);
      expect(
        matcher({
          foo: true,
          bar: 'foo',
          baz: {
            qux: 3,
            extra: 'ignored',
          },
        }),
      ).toBe(true);
    });

    it('SHOULD NOT match objects with incorrect shapes', () => {
      expect(matcher({})).toBe(false);
      expect(
        matcher({
          bar: 'foo',
          baz: {
            qux: 3,
          },
        }),
      ).toBe(false);
      expect(
        matcher({
          foo: 'uh-oh',
          bar: 'foo',
          baz: {
            qux: 3,
          },
        }),
      ).toBe(false);
      expect(
        matcher({
          foo: true,
          bar: false,
          baz: {
            qux: 3,
          },
        }),
      ).toBe(false);
      expect(
        matcher({
          foo: true,
          bar: 'foo',
          baz: 'uh-oh',
        }),
      ).toBe(false);
      expect(
        matcher({
          foo: true,
          bar: 'foo',
          baz: {
            qux: 'uh-oh',
          },
        }),
      ).toBe(false);
    });

    it('SHOULD NOT match any other values', () => {
      expect(DUMMY_VALUES.filter((value) => value !== 'foo').every((value) => matcher(value))).toBe(
        false,
      );
    });
  });

  describe('types.arrayOf', () => {
    let matcher: Matcher<Array<string>>;
    beforeEach(() => {
      matcher = types.arrayOf(types.string);
    });

    it('SHOULD match arrays with the correct type', () => {
      expect(matcher(['foo', 'bar', 'baz'])).toBe(true);
      expect(matcher([])).toBe(true);
    });

    it('SHOULD NOT match arrays with the wrong type', () => {
      expect(matcher(['foo', 'bar', 'baz', undefined])).toBe(false);
      expect(matcher([1, 2, 3])).toBe(false);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter(
          (value) => !(Array.isArray(value) && value.every((item) => typeof item === 'string')),
        ).every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.objectOf', () => {
    let matcher: Matcher<{ [key: string]: string }>;
    beforeEach(() => {
      matcher = types.objectOf(types.string);
    });

    it('SHOULD match dynamic objects with the correct type', () => {
      expect(
        matcher({
          ['foo']: 'foo',
          ['bar']: 'bar',
          ['baz']: 'baz',
        }),
      ).toBe(true);
      expect(matcher({})).toBe(true);
    });

    it('SHOULD NOT match dynamic objects with the wrong type', () => {
      expect(
        matcher({
          ['foo']: 'foo',
          ['bar']: 'bar',
          ['baz']: 'baz',
          ['qux']: undefined,
        }),
      ).toBe(false);
      expect(
        matcher({
          ['foo']: 1,
          ['bar']: 2,
          ['baz']: 3,
          ['qux']: undefined,
        }),
      ).toBe(false);
    });

    it('SHOULD NOT match any other values', () => {
      expect(DUMMY_VALUES.filter((value) => value !== 'foo').every((value) => matcher(value))).toBe(
        false,
      );
    });
  });

  describe('types.oneOfType', () => {
    let matcher: Matcher<string | boolean>;
    beforeEach(() => {
      matcher = types.oneOfType([types.string, types.bool]);
    });

    it('SHOULD match values with the correct type', () => {
      expect(matcher('foo')).toBe(true);
      expect(matcher('')).toBe(true);
      expect(matcher(true)).toBe(true);
      expect(matcher(false)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter(
          (value) => typeof value !== 'boolean' && typeof value !== 'string',
        ).every((value) => matcher(value)),
      ).toBe(false);
    });
  });

  describe('types.optional', () => {
    let matcher: Matcher<string | undefined>;
    beforeEach(() => {
      matcher = types.optional(types.string);
    });

    it('SHOULD match values with the correct type', () => {
      expect(matcher('foo')).toBe(true);
      expect(matcher('')).toBe(true);
      expect(matcher(undefined)).toBe(true);
    });

    it('SHOULD NOT match any other values', () => {
      expect(
        DUMMY_VALUES.filter((value) => typeof value !== 'string' && value !== undefined).every(
          (value) => matcher(value),
        ),
      ).toBe(false);
    });
  });

  describe('types.recursive', () => {
    interface Tree {
      value: string;
      children: Array<Tree>;
    }
    let matcher: Matcher<Tree>;
    beforeEach(() => {
      matcher = types.recursive((ref) =>
        types.shape({
          value: types.string,
          children: types.arrayOf(ref),
        }),
      );
    });

    it('SHOULD match values with the correct shape', () => {
      expect(
        matcher({
          value: 'foo',
          children: [],
        }),
      ).toBe(true);
      expect(
        matcher({
          value: 'foo',
          children: [
            {
              value: 'bar',
              children: [],
            },
            {
              value: 'baz',
              children: [],
            },
            {
              value: 'qux',
              children: [],
            },
          ],
        }),
      ).toBe(true);
      expect(
        matcher({
          value: 'foo',
          children: [
            {
              value: 'bar',
              children: [
                {
                  value: 'nested',
                  children: [],
                },
              ],
            },
            {
              value: 'baz',
              children: [
                {
                  value: 'nested',
                  children: [],
                },
              ],
            },
            {
              value: 'qux',
              children: [
                {
                  value: 'nested',
                  children: [],
                },
              ],
            },
          ],
        }),
      ).toBe(true);
    });

    it('SHOULD NOT match values with incorrect shapes', () => {
      expect(
        matcher({
          value: 'foo',
          children: undefined,
        }),
      ).toBe(false);
      expect(
        matcher({
          value: 'foo',
          children: [
            {
              value: 'bar',
              children: undefined,
            },
            {
              value: 'baz',
              children: [],
            },
            {
              value: 'qux',
              children: [],
            },
          ],
        }),
      ).toBe(false);
      expect(
        matcher({
          value: 'foo',
          children: [
            {
              value: 'bar',
              children: [
                {
                  value: 'nested',
                  children: undefined,
                },
              ],
            },
          ],
        }),
      ).toBe(false);
    });

    it('SHOULD NOT match any other values', () => {
      expect(DUMMY_VALUES.every((value) => matcher(value))).toBe(false);
    });
  });
});
