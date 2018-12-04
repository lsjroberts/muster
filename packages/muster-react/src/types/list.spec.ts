import { Matcher, types } from '@dws/muster';
import { GetterMatcher, isGetterMatcher } from './getter';
import { list, ListMatcher } from './list';
import { isTreeMatcher, TreeMatcher } from './tree';

describe('list()', () => {
  describe('WHEN called with no parameters', () => {
    let matcher: ListMatcher<any, undefined, undefined>;

    beforeEach(() => {
      matcher = list();
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('list');
      expect(matcher.metadata.type).toBe(list);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.itemMatcher).toBeUndefined();
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)(undefined)).toBeFalsy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test')).toBeFalsy();
      });
    });

    describe('AND then called with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(1)).toBeFalsy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'Bob' })).toBeFalsy();
      });
    });

    describe('AND then called with an empty array', () => {
      it('SHOULD return true', () => {
        expect(matcher([])).toBeTruthy();
      });
    });

    describe('AND then called with an array of numbers', () => {
      it('SHOULD return true', () => {
        expect(matcher([1, 2, 3])).toBeTruthy();
      });
    });

    describe('AND then called with an array of strings', () => {
      it('SHOULD return true', () => {
        expect(matcher(['first', 'second', 'third'])).toBeTruthy();
      });
    });

    describe('AND then called with an array of objects', () => {
      it('SHOULD return true', () => {
        expect(matcher([{ name: 'Jane' }, { name: 'Kate' }, { name: 'Charlotte' }])).toBeTruthy();
      });
    });

    describe('AND then called with an array of mixed type items', () => {
      it('SHOULD return true', () => {
        expect(matcher([1, 'two', true, { name: 'four' }, [5]])).toBeTruthy();
      });
    });
  });

  describe('WHEN called with name', () => {
    let matcher: ListMatcher<any, string, undefined>;

    beforeEach(() => {
      matcher = list('test-name');
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('list');
      expect(matcher.metadata.type).toBe(list);
      expect(matcher.metadata.options.name).toBe('test-name');
      expect(matcher.metadata.options.itemMatcher).toBeUndefined();
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)(undefined)).toBeFalsy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test')).toBeFalsy();
      });
    });

    describe('AND then called with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(1)).toBeFalsy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'Bob' })).toBeFalsy();
      });
    });

    describe('AND then called with an empty array', () => {
      it('SHOULD return true', () => {
        expect(matcher([])).toBeTruthy();
      });
    });

    describe('AND then called with an array of numbers', () => {
      it('SHOULD return true', () => {
        expect(matcher([1, 2, 3])).toBeTruthy();
      });
    });

    describe('AND then called with an array of strings', () => {
      it('SHOULD return true', () => {
        expect(matcher(['first', 'second', 'third'])).toBeTruthy();
      });
    });

    describe('AND then called with an array of objects', () => {
      it('SHOULD return true', () => {
        expect(matcher([{ name: 'Jane' }, { name: 'Kate' }, { name: 'Charlotte' }])).toBeTruthy();
      });
    });

    describe('AND then called with an array of mixed type items', () => {
      it('SHOULD return true', () => {
        expect(matcher([1, 'two', true, { name: 'four' }, [5]])).toBeTruthy();
      });
    });
  });

  describe('WHEN called with a primitive item type matcher', () => {
    let matcher: ListMatcher<any, undefined, Matcher<string, never>>;

    beforeEach(() => {
      matcher = list(types.string);
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('list');
      expect(matcher.metadata.type).toBe(list);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.itemMatcher).not.toBeUndefined();
      expect(matcher.metadata.options.itemMatcher.metadata.type).toBe(types.string);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)(undefined)).toBeFalsy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test')).toBeFalsy();
      });
    });

    describe('AND then called with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(1)).toBeFalsy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'Bob' })).toBeFalsy();
      });
    });

    describe('AND then called with an empty array', () => {
      it('SHOULD return true', () => {
        expect(matcher([])).toBeTruthy();
      });
    });

    describe('AND then called with an array of numbers', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 2, 3])).toBeFalsy();
      });
    });

    describe('AND then called with an array of strings', () => {
      it('SHOULD return true', () => {
        expect(matcher(['first', 'second', 'third'])).toBeTruthy();
      });
    });

    describe('AND then called with an array of objects', () => {
      it('SHOULD return false', () => {
        expect(matcher([{ name: 'Jane' }, { name: 'Kate' }, { name: 'Charlotte' }])).toBeFalsy();
      });
    });

    describe('AND then called with an array of mixed type items', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 'two', true, { name: 'four' }, [5]])).toBeFalsy();
      });
    });
  });

  describe('WHEN called with a name and a primitive item type matcher', () => {
    let matcher: ListMatcher<any, string, Matcher<string, never>>;

    beforeEach(() => {
      matcher = list('test-name', types.string);
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('list');
      expect(matcher.metadata.type).toBe(list);
      expect(matcher.metadata.options.name).toBe('test-name');
      expect(matcher.metadata.options.itemMatcher).not.toBeUndefined();
      expect(matcher.metadata.options.itemMatcher.metadata.type).toBe(types.string);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)(undefined)).toBeFalsy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test')).toBeFalsy();
      });
    });

    describe('AND then called with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(1)).toBeFalsy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'Bob' })).toBeFalsy();
      });
    });

    describe('AND then called with an empty array', () => {
      it('SHOULD return true', () => {
        expect(matcher([])).toBeTruthy();
      });
    });

    describe('AND then called with an array of numbers', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 2, 3])).toBeFalsy();
      });
    });

    describe('AND then called with an array of strings', () => {
      it('SHOULD return true', () => {
        expect(matcher(['first', 'second', 'third'])).toBeTruthy();
      });
    });

    describe('AND then called with an array of objects', () => {
      it('SHOULD return false', () => {
        expect(matcher([{ name: 'Jane' }, { name: 'Kate' }, { name: 'Charlotte' }])).toBeFalsy();
      });
    });

    describe('AND then called with an array of mixed type items', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 'two', true, { name: 'four' }, [5]])).toBeFalsy();
      });
    });
  });

  describe('WHEN called with a fields matcher', () => {
    let matcher: ListMatcher<any, undefined, TreeMatcher<{ name: Matcher<string, never> }>>;

    beforeEach(() => {
      matcher = list({
        name: types.string,
      });
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('list');
      expect(matcher.metadata.type).toBe(list);
      expect(matcher.metadata.options.name).toBeUndefined();

      const itemMatcher = matcher.metadata.options.itemMatcher as TreeMatcher<any>;
      expect(itemMatcher).not.toBeUndefined();
      expect(isTreeMatcher(itemMatcher)).toBeTruthy();

      const nameGetter = itemMatcher.metadata.options.name as GetterMatcher<any, any, any>;
      expect(nameGetter).not.toBeUndefined();
      expect(isGetterMatcher(nameGetter)).toBeTruthy();
      expect(nameGetter.metadata.options.name).toBeUndefined();
      expect(nameGetter.metadata.options.type).toBe(types.string);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)(undefined)).toBeFalsy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test')).toBeFalsy();
      });
    });

    describe('AND then called with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(1)).toBeFalsy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'Bob' })).toBeFalsy();
      });
    });

    describe('AND then called with an empty array', () => {
      it('SHOULD return true', () => {
        expect(matcher([])).toBeTruthy();
      });
    });

    describe('AND then called with an array of numbers', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 2, 3])).toBeFalsy();
      });
    });

    describe('AND then called with an array of strings', () => {
      it('SHOULD return false', () => {
        expect(matcher(['first', 'second', 'third'])).toBeFalsy();
      });
    });

    describe('AND then called with an array of objects of a correct type', () => {
      it('SHOULD return true', () => {
        expect(matcher([{ name: 'Jane' }, { name: 'Kate' }, { name: 'Charlotte' }])).toBeTruthy();
      });
    });

    describe('AND then called with an array of object with a name being numbers', () => {
      it('SHOULD return false', () => {
        expect(matcher([{ name: 1 }, { name: 2 }, { name: 3 }])).toBeFalsy();
      });
    });

    describe('AND then called with an array of mixed type items', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 'two', true, { name: 'four' }, [5]])).toBeFalsy();
      });
    });
  });

  describe('WHEN called with a name and a fields matcher', () => {
    let matcher: ListMatcher<any, string, TreeMatcher<{ name: Matcher<string, never> }>>;

    beforeEach(() => {
      matcher = list('test-name', {
        name: types.string,
      });
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('list');
      expect(matcher.metadata.type).toBe(list);
      expect(matcher.metadata.options.name).toBe('test-name');

      const itemMatcher = matcher.metadata.options.itemMatcher as TreeMatcher<any>;
      expect(itemMatcher).not.toBeUndefined();
      expect(isTreeMatcher(itemMatcher)).toBeTruthy();

      const nameMatcher = itemMatcher.metadata.options.name as GetterMatcher<any, any, any>;
      expect(nameMatcher).not.toBeUndefined();
      expect(isGetterMatcher(nameMatcher)).toBeTruthy();
      expect(nameMatcher.metadata.options.name).toBeUndefined();
      expect(nameMatcher.metadata.options.type).toBe(types.string);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect((matcher as any)(undefined)).toBeFalsy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return false', () => {
        expect(matcher('test')).toBeFalsy();
      });
    });

    describe('AND then called with a number', () => {
      it('SHOULD return false', () => {
        expect(matcher(1)).toBeFalsy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return false', () => {
        expect(matcher({ name: 'Bob' })).toBeFalsy();
      });
    });

    describe('AND then called with an empty array', () => {
      it('SHOULD return true', () => {
        expect(matcher([])).toBeTruthy();
      });
    });

    describe('AND then called with an array of numbers', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 2, 3])).toBeFalsy();
      });
    });

    describe('AND then called with an array of strings', () => {
      it('SHOULD return false', () => {
        expect(matcher(['first', 'second', 'third'])).toBeFalsy();
      });
    });

    describe('AND then called with an array of objects of a correct type', () => {
      it('SHOULD return true', () => {
        expect(matcher([{ name: 'Jane' }, { name: 'Kate' }, { name: 'Charlotte' }])).toBeTruthy();
      });
    });

    describe('AND then called with an array of object with a name being numbers', () => {
      it('SHOULD return false', () => {
        expect(matcher([{ name: 1 }, { name: 2 }, { name: 3 }])).toBeFalsy();
      });
    });

    describe('AND then called with an array of mixed type items', () => {
      it('SHOULD return false', () => {
        expect(matcher([1, 'two', true, { name: 'four' }, [5]])).toBeFalsy();
      });
    });
  });

  describe('WHEN called with fields defined as `true`', () => {
    let matcher: ListMatcher<any, undefined, TreeMatcher<any>>;

    beforeEach(() => {
      matcher = list({
        name: true,
        lastName: true,
      });
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      const name = matcher.metadata.options.itemMatcher.metadata.options.name as GetterMatcher<
        any,
        any,
        any
      >;
      expect(name).not.toBeUndefined();
      expect(isGetterMatcher(name)).toBeTruthy();
      expect(name.metadata.options.name).toBeUndefined();
      expect(name.metadata.options.type).toEqual(types.any);
      const lastName = matcher.metadata.options.itemMatcher.metadata.options
        .lastName as GetterMatcher<any, any, any>;
      expect(lastName).not.toBeUndefined();
      expect(isGetterMatcher(lastName)).toBeTruthy();
      expect(lastName.metadata.options.name).toBeUndefined();
      expect(lastName.metadata.options.type).toEqual(types.any);
    });
  });
});
