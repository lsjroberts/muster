import { get, parent, ref } from '../';
import relative from './relative';

describe('relative()', () => {
  describe('GIVEN a path defined as an array', () => {
    describe('WHEN the path has no items', () => {
      it('SHOULD throw an error', () => {
        expect(() => ref(relative())).toThrow();
      });
    });

    describe('WHEN the path has only one item', () => {
      it('SHOULD return a correct get', () => {
        expect(ref(relative('foo'))).toEqual(get(parent(), 'foo'));
      });
    });

    describe('WHEN the path consists of two items', () => {
      it('SHOULD return a correct get', () => {
        expect(ref(relative('foo', 'bar'))).toEqual(get(get(parent(), 'foo'), 'bar'));
      });
    });
  });

  describe('GIVEN a path defined as a number of strings', () => {
    describe('WHEN the path has no items', () => {
      it('SHOULD throw an error', () => {
        expect(() => ref(relative())).toThrow();
      });
    });

    describe('WHEN the path has only one item', () => {
      it('SHOULD return a correct get', () => {
        expect(ref(relative('foo'))).toEqual(get(parent(), 'foo'));
      });
    });

    describe('WHEN the path consists of two items', () => {
      it('SHOULD return a correct get', () => {
        expect(ref(relative('foo', 'bar'))).toEqual(get(get(parent(), 'foo'), 'bar'));
      });
    });
  });
});
