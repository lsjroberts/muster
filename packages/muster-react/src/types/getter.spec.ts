import { Matcher, types } from '@dws/muster';
import { getter, GetterMatcher } from './getter';

describe('getter()', () => {
  describe('WHEN called with no parameters', () => {
    let matcher: GetterMatcher<undefined, any, Matcher<any, never>>;

    beforeEach(() => {
      matcher = getter();
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('getter');
      expect(matcher.metadata.type).toBe(getter);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.type).toBe(types.any);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return true', () => {
        expect(matcher(undefined)).toBeTruthy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return true', () => {
        expect(matcher('test string')).toBeTruthy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return true', () => {
        expect(matcher({ name: 'Bob' })).toBeTruthy();
      });
    });
  });

  describe('WHEN called with a name', () => {
    let matcher: GetterMatcher<string, any, Matcher<any, never>>;

    beforeEach(() => {
      matcher = getter('test-name');
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('getter');
      expect(matcher.metadata.type).toBe(getter);
      expect(matcher.metadata.options.name).toBe('test-name');
      expect(matcher.metadata.options.type).toBe(types.any);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return true', () => {
        expect(matcher(undefined)).toBeTruthy();
      });
    });

    describe('AND then called with a string', () => {
      it('SHOULD return true', () => {
        expect(matcher('test string')).toBeTruthy();
      });
    });

    describe('AND then called with an object', () => {
      it('SHOULD return true', () => {
        expect(matcher({ name: 'Bob' })).toBeTruthy();
      });
    });
  });

  describe('WHEN called with a type matcher', () => {
    let matcher: GetterMatcher<undefined, string, Matcher<string, never>>;

    beforeEach(() => {
      matcher = getter(types.string);
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('getter');
      expect(matcher.metadata.type).toBe(getter);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.type).toBe(types.string);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect(matcher(undefined)).toBeFalsy();
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

    describe('AND then called with a string', () => {
      it('SHOULD return true', () => {
        expect(matcher('test string')).toBeTruthy();
      });
    });
  });

  describe('WHEN called with a name and a type matcher', () => {
    let matcher: GetterMatcher<string, string, Matcher<string, never>>;

    beforeEach(() => {
      matcher = getter('test-name', types.string);
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('getter');
      expect(matcher.metadata.type).toBe(getter);
      expect(matcher.metadata.options.name).toBe('test-name');
      expect(matcher.metadata.options.type).toBe(types.string);
    });

    describe('AND then called with an undefined', () => {
      it('SHOULD return false', () => {
        expect(matcher(undefined)).toBeFalsy();
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

    describe('AND then called with a string', () => {
      it('SHOULD return true', () => {
        expect(matcher('test string')).toBeTruthy();
      });
    });
  });
});
