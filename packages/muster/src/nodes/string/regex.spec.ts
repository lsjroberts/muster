import { regex } from './regex';

describe('regex', () => {
  describe('WHEN called with string expression', () => {
    it('SHOULD return correct node', () => {
      expect(regex('asdf').properties.pattern).toEqual(/asdf/);
    });
  });

  describe('WHEN called with a RegExp expression', () => {
    it('SHOULD return correct node', () => {
      const expression = /asdf/;
      expect(regex(expression).properties.pattern).toBe(expression);
    });
  });

  describe('WHEN called with an invalid value', () => {
    it('SHOULD throw an error', () => {
      expect(() => regex(1 as any)).toThrowError(
        [
          'Invalid type of pattern used to create regex node',
          ' Expected:',
          '  string',
          '  RegExp',
          ' Received:',
          '  1',
        ].join('\n'),
      );
    });
  });
});
