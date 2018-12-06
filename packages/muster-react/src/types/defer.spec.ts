import { types, value } from '@dws/muster';
import { defer } from './defer';
import { GetterMatcher, isGetterMatcher } from './getter';
import { isTreeMatcher, TreeMatcher } from './tree';

describe('defer()', () => {
  describe('WHEN called with `true`', () => {
    it('SHOULD return correct matcher', () => {
      const matcher = defer(true);
      expect(matcher).not.toBeUndefined();
      const getter = matcher.metadata.options.type as GetterMatcher<any, any, any>;
      expect(getter).not.toBeUndefined();
      expect(isGetterMatcher(getter)).toBeTruthy();
      expect(getter.metadata.options.type).toEqual(types.any);
    });
  });

  describe('WHEN called with fallback and `true`', () => {
    it('SHOULD return correct matcher', () => {
      const fallbackGenerator = () => value('fallback');
      const matcher = defer(fallbackGenerator, true);
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.options.fallback).toBe(fallbackGenerator);
      const getter = matcher.metadata.options.type as GetterMatcher<any, any, any>;
      expect(getter).not.toBeUndefined();
      expect(isGetterMatcher(getter)).toBeTruthy();
      expect(getter.metadata.options.type).toEqual(types.any);
    });
  });

  describe('WHEN called with an object', () => {
    it('SHOULD return correct matcher', () => {
      const matcher = defer({
        name: true,
      });
      expect(matcher).not.toBeUndefined();
      const tree = matcher.metadata.options.type as TreeMatcher<any>;
      expect(tree).not.toBeUndefined();
      expect(isTreeMatcher(tree)).toBeTruthy();
      const name = tree.metadata.options.name;
      expect(name).not.toBeUndefined();
      expect(isGetterMatcher(name)).toBeTruthy();
    });
  });

  describe('WHEN called with a matcher', () => {
    it('SHOULD return correct matcher', () => {
      const matcher = defer(types.string);
      expect(matcher).not.toBeUndefined();
      const getter = matcher.metadata.options.type as GetterMatcher<any, any, any>;
      expect(getter).not.toBeUndefined();
      expect(isGetterMatcher(getter)).toBeTruthy();
      expect(getter.metadata.options.type).toEqual(types.string);
    });
  });
});
