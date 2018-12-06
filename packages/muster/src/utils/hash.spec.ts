import * as hash from './hash';
// tslint:disable-next-line:no-duplicate-imports
import * as types from './types';

describe('hash()', () => {
  describe('GIVEN an undefined hasher', () => {
    let hasher: hash.HashFunction<undefined>;
    beforeEach(() => {
      hasher = hash.type(types.empty);
    });

    it('SHOULD hash undefined values correctly', () => {
      expect(hasher(undefined)).toBe(hasher(undefined));
    });
  });

  describe('GIVEN a null hasher', () => {
    let hasher: hash.HashFunction<null>;
    beforeEach(() => {
      hasher = hash.type(types.nil);
    });

    it('SHOULD hash null values correctly', () => {
      expect(hasher(null)).toBe(hasher(null));
    });
  });

  describe('GIVEN a boolean hasher', () => {
    let hasher: hash.HashFunction<boolean>;
    beforeEach(() => {
      hasher = hash.type(types.bool);
    });

    it('SHOULD hash false values correctly', () => {
      expect(hasher(false)).toBe(hasher(false));
      expect(hasher(false)).not.toBe(hasher(true));
    });

    it('SHOULD hash true values correctly', () => {
      expect(hasher(true)).toBe(hasher(true));
      expect(hasher(true)).not.toBe(hasher(false));
    });
  });

  describe('GIVEN a number hasher', () => {
    let hasher: hash.HashFunction<number>;
    beforeEach(() => {
      hasher = hash.type(types.number);
    });

    it('SHOULD hash number values correctly', () => {
      expect(hasher(1)).toBe(hasher(1));
      expect(hasher(1)).not.toBe(hasher(0));
      expect(hasher(-0)).toBe(hasher(0));
      expect(hasher(Infinity)).toBe(hasher(Infinity));
      expect(hasher(Infinity)).not.toBe(hasher(-Infinity));
    });

    it('SHOULD hash NaN values correctly', () => {
      expect(hasher(NaN)).toBe(hasher(NaN));
      expect(hasher(NaN)).not.toBe(hasher(1));
    });
  });

  describe('GIVEN a string hasher', () => {
    let hasher: hash.HashFunction<string>;
    beforeEach(() => {
      hasher = hash.type(types.string);
    });

    it('SHOULD hash string values correctly', () => {
      expect(hasher('foo')).toBe(hasher('foo'));
      expect(hasher('foo')).not.toBe(hasher('bar'));
    });
  });

  describe('GIVEN a symbol hasher', () => {
    let hasher: hash.HashFunction<symbol>;
    let foo: symbol;
    let bar: symbol;
    beforeEach(() => {
      hasher = hash.type(types.symbol);
      foo = Symbol('foo');
      bar = Symbol('bar');
    });

    it('SHOULD hash symbol values correctly', () => {
      expect(hasher(foo)).toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  describe('GIVEN a date hasher', () => {
    let hasher: hash.HashFunction<Date>;
    beforeEach(() => {
      hasher = hash.type(types.date);
    });

    it('SHOULD hash date values correctly', () => {
      expect(hasher(new Date('1 Jan 2000'))).toBe(hasher(new Date('1 Jan 2000')));
      expect(hasher(new Date('1 Jan 2000'))).not.toBe(hasher(new Date('2 Jan 2000')));
    });
  });

  describe('GIVEN a function hasher', () => {
    let hasher: hash.HashFunction<Function>;
    let foo: () => void;
    let bar: () => void;
    beforeEach(() => {
      hasher = hash.type(types.func);
      foo = () => {};
      bar = () => {};
    });

    it('SHOULD hash function values correctly', () => {
      expect(hasher(foo)).not.toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  describe('GIVEN a function hasher with save', () => {
    let hasher: hash.HashFunction<Function>;
    let foo: () => void;
    let bar: () => void;
    beforeEach(() => {
      hasher = hash.type(types.saveHash(types.func));
      foo = () => {};
      bar = () => {};
    });

    it('SHOULD hash function values correctly', () => {
      expect(hasher(foo)).toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  describe('GIVEN an object hasher', () => {
    let hasher: hash.HashFunction<object>;
    let foo: object;
    let bar: object;
    beforeEach(() => {
      hasher = hash.type(types.object);
      foo = {};
      bar = {};
    });

    it('SHOULD hash object values correctly', () => {
      expect(hasher(foo)).not.toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  describe('GIVEN an object hasher with save', () => {
    let hasher: hash.HashFunction<object>;
    let foo: object;
    let bar: object;
    beforeEach(() => {
      hasher = hash.type(types.saveHash(types.object));
      foo = {};
      bar = {};
    });

    it('SHOULD hash object values correctly', () => {
      expect(hasher(foo)).toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  describe('GIVEN an array hasher', () => {
    let hasher: hash.HashFunction<Array<any>>;
    let foo: Array<any>;
    let bar: Array<any>;
    beforeEach(() => {
      hasher = hash.type(types.array);
      foo = [];
      bar = [];
    });

    it('SHOULD hash array values correctly', () => {
      expect(hasher(foo)).not.toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  describe('GIVEN an array hasher with save', () => {
    let hasher: hash.HashFunction<Array<any>>;
    let foo: Array<any>;
    let bar: Array<any>;
    beforeEach(() => {
      hasher = hash.type(types.saveHash(types.array));
      foo = [];
      bar = [];
    });

    it('SHOULD hash array values correctly', () => {
      expect(hasher(foo)).toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  describe('GIVEN a oneOf hasher', () => {
    let hasher: hash.HashFunction<'foo' | 'bar'>;
    beforeEach(() => {
      hasher = hash.type(types.oneOf(['foo', 'bar']));
    });

    it('SHOULD hash enum values correctly', () => {
      expect(hasher('foo')).toBe(hasher('foo'));
      expect(hasher('foo')).not.toBe(hasher('bar'));
    });
  });

  describe('GIVEN a shape hasher', () => {
    let hasher: hash.HashFunction<{
      foo: {
        bar: boolean;
      };
    }>;
    beforeEach(() => {
      hasher = hash.type(
        types.shape({
          foo: types.shape({
            bar: types.bool,
          }),
        }),
      );
    });

    it('SHOULD hash object values correctly', () => {
      expect(hasher({ foo: { bar: true } })).toBe(hasher({ foo: { bar: true } }));
      expect(hasher({ foo: { bar: true } })).not.toBe(hasher({ foo: { bar: false } }));
    });
  });

  describe('GIVEN an arrayOf hasher', () => {
    let hasher: hash.HashFunction<Array<{ foo: number }>>;
    beforeEach(() => {
      hasher = hash.type(
        types.arrayOf(
          types.shape({
            foo: types.number,
          }),
        ),
      );
    });

    it('SHOULD hash array values correctly', () => {
      expect(hasher([{ foo: 1 }, { foo: 2 }, { foo: 3 }])).toBe(
        hasher([{ foo: 1 }, { foo: 2 }, { foo: 3 }]),
      );
      expect(hasher([{ foo: 1 }, { foo: 2 }, { foo: 3 }])).not.toBe(
        hasher([{ foo: 1 }, { foo: 2 }, { foo: 4 }]),
      );
    });
  });

  describe('GIVEN an objectOf hasher', () => {
    let hasher: hash.HashFunction<{ [key: string]: { foo: number } }>;
    beforeEach(() => {
      hasher = hash.type(
        types.objectOf(
          types.shape({
            foo: types.number,
          }),
        ),
      );
    });

    it('SHOULD hash map values correctly', () => {
      expect(
        hasher({
          a: { foo: 1 },
          b: { foo: 2 },
          c: { foo: 3 },
        }),
      ).toBe(
        hasher({
          a: { foo: 1 },
          b: { foo: 2 },
          c: { foo: 3 },
        }),
      );
      expect(
        hasher({
          a: { foo: 1 },
          b: { foo: 2 },
          c: { foo: 3 },
        }),
      ).not.toBe(
        hasher({
          a: { foo: 1 },
          b: { foo: 2 },
          c: { foo: 4 },
        }),
      );
    });
  });

  describe('GIVEN a oneOfType hasher', () => {
    let hasher: hash.HashFunction<{ foo: boolean } | { bar: boolean }>;
    beforeEach(() => {
      hasher = hash.type(
        types.oneOfType([types.shape({ foo: types.bool }), types.shape({ bar: types.bool })]),
      );
    });

    it('SHOULD hash map values correctly', () => {
      expect(hasher({ foo: true })).toBe(hasher({ foo: true }));
      expect(hasher({ bar: true })).toBe(hasher({ bar: true }));
      expect(hasher({ foo: true })).not.toBe(hasher({ bar: true }));
    });
  });

  describe('GIVEN an optional hasher', () => {
    let hasher: hash.HashFunction<string | undefined>;
    beforeEach(() => {
      hasher = hash.type(types.optional(types.string));
    });

    it('SHOULD hash map values correctly', () => {
      expect(hasher('foo')).toBe(hasher('foo'));
      expect(hasher('foo')).not.toBe(hasher('bar'));
      expect(hasher(undefined)).toBe(hasher(undefined));
      expect(hasher(undefined)).not.toBe(hasher(''));
    });
  });

  describe('GIVEN a dynamic hasher', () => {
    let hasher: hash.HashFunction<any>;
    let foo: object;
    let bar: object;
    beforeEach(() => {
      hasher = hash.type(types.optional(types.saveHash(types.any)));
      foo = {};
      bar = {};
    });

    it('SHOULD hash mixed values correctly', () => {
      expect(hasher(undefined)).toBe(hasher(undefined));
      expect(hasher(undefined)).toBe(hasher(null));
      expect(hasher(null)).toBe(hasher(null));
      expect(hasher(null)).not.toBe(hasher(false));
      expect(hasher(true)).toBe(hasher(true));
      expect(hasher(true)).not.toBe(hasher(false));
      expect(hasher(true)).not.toBe(hasher('true'));
      expect(hasher(false)).toBe(hasher(false));
      expect(hasher(false)).not.toBe(hasher(''));
      expect(hasher(1)).toBe(hasher(1));
      expect(hasher(1)).not.toBe(hasher(2));
      expect(hasher(1)).not.toBe(hasher('1'));
      expect(hasher('foo')).toBe(hasher('foo'));
      expect(hasher('foo')).not.toBe(hasher('bar'));
      expect(hasher(foo)).toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  // TODO: Fix recursive functions, which aren't used at the moment
  xdescribe('GIVEN a recursive hash function', () => {
    interface RecursiveArray extends Array<never | RecursiveArray> {}
    let hasher: hash.HashFunction<RecursiveArray>;
    let foo: RecursiveArray;
    let bar: RecursiveArray;
    beforeEach(() => {
      hasher = (value: RecursiveArray) => `(${value.map(hasher).join('|')})`;
      foo = [[], [], []];
      foo.push(foo);
      bar = [[], [], []];
      bar.push(bar);
    });

    it('SHOULD hash circular objects correctly', () => {
      expect(hasher(foo)).toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher([[]]));
      // Ideally foo and bar would hash to the same value, but this isn't possible as it stands.
      // It's probably safest to assert the current behavior to avoid potential regressions.
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });

  // TODO: Fix recursive functions, which aren't used at the moment
  xdescribe('GIVEN mutually-recursive hash functions', () => {
    let hasher: hash.HashFunction<Array<string | Array<string>>>;
    let innerHasher: hash.HashFunction<string | Array<string>>;
    let foo: Array<string | Array<string>>;
    let bar: Array<string | Array<string>>;
    beforeEach(() => {
      hasher = (value: Array<string>) => value.map(innerHasher).join('|');
      innerHasher = (value: string | Array<string>) =>
        Array.isArray(value) ? hasher(value) : value;
      foo = ['foo', 'bar', 'baz'];
      foo.push(foo as Array<string>);
      bar = ['foo', 'bar', 'baz'];
      bar.push(bar as Array<string>);
    });

    it('SHOULD hash circular objects correctly', () => {
      expect(hasher(foo)).toBe(hasher(foo));
      expect(hasher(foo)).not.toBe(hasher(['foo', 'bar', 'baz', []]));
      // Ideally foo and bar would hash to the same value, but this isn't possible as it stands.
      // It's probably safest to assert the current behavior to avoid potential regressions.
      expect(hasher(foo)).not.toBe(hasher(bar));
    });
  });
});
