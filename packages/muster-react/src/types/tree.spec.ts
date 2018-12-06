import { types } from '@dws/muster';
import { GetterMatcher, isGetterMatcher } from './getter';
import { tree, TreeMatcher } from './tree';

describe('tree()', () => {
  describe('WHEN called with empty object', () => {
    let matcher: TreeMatcher<any>;

    beforeEach(() => {
      matcher = tree({});
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('tree');
      expect(matcher.metadata.type).toBe(tree);
      expect(matcher.metadata.options).toEqual({});
    });

    describe('AND then calling matcher with no args', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)()).toBeFalsy();
      });
    });

    describe('AND then calling matcher with undefined', () => {
      it('SHOULD return false', () => {
        expect(matcher(undefined)).toBeFalsy();
      });
    });

    describe('AND then calling matcher with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test string')).toBeFalsy();
      });
    });

    describe('AND then calling matcher with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(2)).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an array', () => {
      it('SHOULD return false', () => {
        expect(matcher([])).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an empty object', () => {
      it('SHOULD return true', () => {
        expect(matcher({})).toBeTruthy();
      });
    });

    describe('AND then calling matcher with an object containing properties', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'test' })).toBeFalsy();
      });
    });
  });

  describe('WHEN called with a flat tree', () => {
    let matcher: TreeMatcher<any>;

    beforeEach(() => {
      matcher = tree({
        first: types.number,
        second: types.bool,
      });
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('tree');
      expect(matcher.metadata.type).toBe(tree);
      expect(isGetterMatcher(matcher.metadata.options.first)).toBeTruthy();

      const firstGetter = matcher.metadata.options.first as GetterMatcher<any, any, any>;
      expect(firstGetter.metadata.options.name).toBeUndefined();
      expect(firstGetter.metadata.options.type).toBe(types.number);

      const secondGetter = matcher.metadata.options.second as GetterMatcher<any, any, any>;
      expect(secondGetter.metadata.options.name).toBeUndefined();
      expect(secondGetter.metadata.options.type).toBe(types.bool);
    });

    describe('AND then calling matcher with no args', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)()).toBeFalsy();
      });
    });

    describe('AND then calling matcher with undefined', () => {
      it('SHOULD return false', () => {
        expect(matcher(undefined)).toBeFalsy();
      });
    });

    describe('AND then calling matcher with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test string')).toBeFalsy();
      });
    });

    describe('AND then calling matcher with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(2)).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an array', () => {
      it('SHOULD return false', () => {
        expect(matcher([])).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an empty object', () => {
      it('SHOULD return false', () => {
        expect(matcher({})).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an object with incorrectly named property', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'test' })).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an object with incorrectly typed properties', () => {
      it('SHOULD return false', () => {
        expect(
          matcher({
            first: true,
            second: 23,
          }),
        ).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an object with correct properties', () => {
      it('SHOULD return true', () => {
        expect(
          matcher({
            first: 123,
            second: false,
          }),
        ).toBeTruthy();
      });
    });

    describe('AND then calling matcher with an object with too many properties', () => {
      it('SHOULD return false', () => {
        expect(
          matcher({
            first: 123,
            second: true,
            third: 'asdf',
          }),
        ).toBeFalsy();
      });
    });
  });

  describe('WHEN called with a flat tree with getters defined as `true`', () => {
    let matcher: TreeMatcher<any>;

    beforeEach(() => {
      matcher = tree({
        name: true,
        lastName: true,
      });
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      const name = matcher.metadata.options.name as GetterMatcher<any, any, any>;
      expect(name).not.toBeUndefined();
      expect(isGetterMatcher(name)).toBeTruthy();
      expect(name.metadata.options.name).toBeUndefined();
      expect(name.metadata.options.type).toEqual(types.any);
      const lastName = matcher.metadata.options.lastName as GetterMatcher<any, any, any>;
      expect(lastName).not.toBeUndefined();
      expect(isGetterMatcher(lastName)).toBeTruthy();
      expect(lastName.metadata.options.name).toBeUndefined();
      expect(lastName.metadata.options.type).toEqual(types.any);
    });
  });

  describe('WHEN called with a nested tree', () => {
    let matcher: TreeMatcher<any>;
    let nestedMatcher: TreeMatcher<any>;

    beforeEach(() => {
      nestedMatcher = tree({
        third: types.string,
      });
      matcher = tree({
        first: types.number,
        second: types.bool,
        nested: nestedMatcher,
      });
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('tree');
      expect(matcher.metadata.type).toBe(tree);

      const firstGetter = matcher.metadata.options.first as GetterMatcher<any, any, any>;
      expect(firstGetter.metadata.options.name).toBeUndefined();
      expect(firstGetter.metadata.options.type).toBe(types.number);

      const secondGetter = matcher.metadata.options.second as GetterMatcher<any, any, any>;
      expect(secondGetter.metadata.options.name).toBeUndefined();
      expect(secondGetter.metadata.options.type).toBe(types.bool);

      expect(matcher.metadata.options.nested).toBe(nestedMatcher);
    });

    describe('AND then calling matcher with no args', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)()).toBeFalsy();
      });
    });

    describe('AND then calling matcher with undefined', () => {
      it('SHOULD return false', () => {
        expect(matcher(undefined)).toBeFalsy();
      });
    });

    describe('AND then calling matcher with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test string')).toBeFalsy();
      });
    });

    describe('AND then calling matcher with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(2)).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an array', () => {
      it('SHOULD return false', () => {
        expect(matcher([])).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an empty object', () => {
      it('SHOULD return false', () => {
        expect(matcher({})).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an object with incorrectly named property', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'test' })).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an object with incorrectly typed properties', () => {
      it('SHOULD return false', () => {
        expect(
          matcher({
            first: true,
            second: 23,
            nested: {
              third: 5,
            },
          }),
        ).toBeFalsy();
      });
    });

    describe('AND then calling matcher with an object with correct properties', () => {
      it('SHOULD return true', () => {
        expect(
          matcher({
            first: 123,
            second: false,
            nested: {
              third: 'third value',
            },
          }),
        ).toBeTruthy();
      });
    });

    describe('AND then calling matcher with an object with too many properties', () => {
      it('SHOULD return false', () => {
        expect(
          matcher({
            first: 123,
            second: true,
            nested: {
              third: 'third value',
            },
            third: 'asdf',
          }),
        ).toBeFalsy();
      });
    });
  });
});
