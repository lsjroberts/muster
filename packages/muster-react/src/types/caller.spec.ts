import { Matcher, types } from '@dws/muster';
import { caller, CallerArgumentMatcher, callerArguments, CallerMatcher } from './caller';

describe('caller()', () => {
  describe('WHEN called with no parameters', () => {
    let matcher: CallerMatcher<undefined, undefined>;

    beforeEach(() => {
      matcher = caller();
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toEqual('caller');
      expect(matcher.metadata.type).toEqual(caller);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.args).toBeUndefined();
    });

    describe('AND called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a caller arguments matcher is created', () => {
      let argsMatcher: CallerArgumentMatcher<undefined, undefined>;

      beforeEach(() => {
        argsMatcher = callerArguments(matcher);
      });

      describe('AND the args matcher is called with no args', () => {
        it('SHOULD return true', () => {
          expect((argsMatcher as any)()).toBeTruthy();
        });
      });

      describe('AND the args matcher is called with one arg', () => {
        it('SHOULD return true', () => {
          expect(argsMatcher([1])).toBeTruthy();
        });
      });
    });
  });

  describe('WHEN called with arg types', () => {
    let matcher: CallerMatcher<undefined, Array<Matcher<string, never> | Matcher<number, never>>>;

    beforeEach(() => {
      matcher = caller([types.string, types.number]);
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toEqual('caller');
      expect(matcher.metadata.type).toEqual(caller);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.args).toEqual([types.string, types.number]);
    });

    describe('AND called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a caller arguments matcher is created', () => {
      let argsMatcher: CallerArgumentMatcher<
        undefined,
        Array<Matcher<string, never> | Matcher<number, never>>
      >;

      beforeEach(() => {
        argsMatcher = callerArguments(matcher);
      });

      describe('AND the args matcher is called with no args', () => {
        it('SHOULD return false', () => {
          expect((argsMatcher as any)()).toBeFalsy();
        });
      });

      describe('AND the args matcher is called with one arg', () => {
        it('SHOULD return false', () => {
          expect(argsMatcher(['first'])).toBeFalsy();
        });
      });

      describe('AND the args matcher is called with two args but of an incorrect type', () => {
        it('SHOULD return false', () => {
          expect(argsMatcher([1, 'second'])).toBeFalsy();
        });
      });

      describe('AND the args matcher is called with two correct args', () => {
        it('SHOULD return true', () => {
          expect(argsMatcher(['first', 2])).toBeTruthy();
        });
      });

      describe('AND the args matcher is called with three arguments', () => {
        it('SHOULD return false', () => {
          expect(argsMatcher(['first', 2, 3])).toBeFalsy();
        });
      });
    });
  });

  describe('WHEN called with name', () => {
    let matcher: CallerMatcher<string, undefined>;

    beforeEach(() => {
      matcher = caller('test-caller');
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toEqual('caller');
      expect(matcher.metadata.type).toEqual(caller);
      expect(matcher.metadata.options.name).toEqual('test-caller');
      expect(matcher.metadata.options.args).toBeUndefined();
    });

    describe('AND called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a caller arguments matcher is created', () => {
      let argsMatcher: CallerArgumentMatcher<string, undefined>;

      beforeEach(() => {
        argsMatcher = callerArguments(matcher);
      });

      describe('AND the args matcher is called with no args', () => {
        it('SHOULD return true', () => {
          expect((argsMatcher as any)()).toBeTruthy();
        });
      });

      describe('AND the args matcher is called with one arg', () => {
        it('SHOULD return true', () => {
          expect(argsMatcher([1])).toBeTruthy();
        });
      });
    });
  });

  describe('WHEN called with name and arg types', () => {
    let matcher: CallerMatcher<string, Array<Matcher<string, never> | Matcher<number, never>>>;

    beforeEach(() => {
      matcher = caller('test-name', [types.string, types.number]);
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toEqual('caller');
      expect(matcher.metadata.type).toEqual(caller);
      expect(matcher.metadata.options.name).toEqual('test-name');
      expect(matcher.metadata.options.args).toEqual([types.string, types.number]);
    });

    describe('AND called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a caller arguments matcher is created', () => {
      let argsMatcher: CallerArgumentMatcher<
        string,
        Array<Matcher<string, never> | Matcher<number, never>>
      >;

      beforeEach(() => {
        argsMatcher = callerArguments(matcher);
      });

      describe('AND the args matcher is called with no args', () => {
        it('SHOULD return false', () => {
          expect((argsMatcher as any)()).toBeFalsy();
        });
      });

      describe('AND the args matcher is called with one arg', () => {
        it('SHOULD return false', () => {
          expect(argsMatcher(['first'])).toBeFalsy();
        });
      });

      describe('AND the args matcher is called with two args but of an incorrect type', () => {
        it('SHOULD return false', () => {
          expect(argsMatcher([1, 'second'])).toBeFalsy();
        });
      });

      describe('AND the args matcher is called with two correct args', () => {
        it('SHOULD return true', () => {
          expect(argsMatcher(['first', 2])).toBeTruthy();
        });
      });

      describe('AND the args matcher is called with three arguments', () => {
        it('SHOULD return false', () => {
          expect(argsMatcher(['first', 2, 3])).toBeFalsy();
        });
      });
    });
  });
});
