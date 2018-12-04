import { Matcher, types } from '@dws/muster';
import { setter, SetterMatcher, setterValue, SetterValueMatcher } from './setter';

describe('setter()', () => {
  describe('WHEN called with no parameters', () => {
    let matcher: SetterMatcher<undefined, undefined>;

    beforeEach(() => {
      matcher = setter();
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toEqual('setter');
      expect(matcher.metadata.type).toBe(setter);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.type).toBeUndefined();
    });

    describe('AND then called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a value matcher is created', () => {
      let valueMatcher: SetterValueMatcher<undefined, undefined>;

      beforeEach(() => {
        valueMatcher = setterValue(matcher);
      });

      describe('AND then the value matcher is called with no parameters', () => {
        it('SHOULD return true', () => {
          expect((valueMatcher as any)()).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with a string', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher('test')).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with a number', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher(1)).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with an object', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher({ name: 'bob' })).toBeTruthy();
        });
      });
    });
  });

  describe('WHEN called with a type matcher', () => {
    let matcher: SetterMatcher<undefined, Matcher<string, never>>;

    beforeEach(() => {
      matcher = setter(types.string);
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('setter');
      expect(matcher.metadata.type).toBe(setter);
      expect(matcher.metadata.options.name).toBeUndefined();
      expect(matcher.metadata.options.type).toEqual(types.string);
    });

    describe('AND then called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a value matcher is created', () => {
      let valueMatcher: SetterValueMatcher<undefined, Matcher<string, never>>;

      beforeEach(() => {
        valueMatcher = setterValue(matcher);
      });

      describe('AND then the value matcher is called with no arguments', () => {
        it('SHOULD return false', () => {
          expect((valueMatcher as any)()).toBeFalsy();
        });
      });

      describe('AND then the value matcher is called with a string', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher('test')).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with a number', () => {
        it('SHOULD return false', () => {
          expect(valueMatcher(1)).toBeFalsy();
        });
      });

      describe('AND then the value matcher is called with an object', () => {
        it('SHOULD return false', () => {
          expect(valueMatcher({ name: 'test' })).toBeFalsy();
        });
      });
    });
  });

  describe('WHEN called with name', () => {
    let matcher: SetterMatcher<string, undefined>;

    beforeEach(() => {
      matcher = setter('test-name');
    });

    it('SHOULD return a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toEqual('setter');
      expect(matcher.metadata.type).toBe(setter);
      expect(matcher.metadata.options.name).toBe('test-name');
      expect(matcher.metadata.options.type).toBeUndefined();
    });

    describe('AND then called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a value matcher is created', () => {
      let valueMatcher: SetterValueMatcher<string, undefined>;

      beforeEach(() => {
        valueMatcher = setterValue(matcher);
      });

      describe('AND then the value matcher is called with no parameters', () => {
        it('SHOULD return true', () => {
          expect((valueMatcher as any)()).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with a string', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher('test')).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with a number', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher(1)).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with an object', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher({ name: 'bob' })).toBeTruthy();
        });
      });
    });
  });

  describe('WHEN called with a name and a type matcher', () => {
    let matcher: SetterMatcher<string, Matcher<string, never>>;

    beforeEach(() => {
      matcher = setter('test-name', types.string);
    });

    it('SHOULD create a correct matcher', () => {
      expect(matcher).not.toBeUndefined();
      expect(matcher.metadata.name).toBe('setter');
      expect(matcher.metadata.type).toBe(setter);
      expect(matcher.metadata.options.name).toBe('test-name');
      expect(matcher.metadata.options.type).toEqual(types.string);
    });

    describe('AND then called with a function', () => {
      it('SHOULD return true', () => {
        expect(matcher(() => {})).toBeTruthy();
      });
    });

    describe('AND then a value matcher is created', () => {
      let valueMatcher: SetterValueMatcher<string, Matcher<string, never>>;

      beforeEach(() => {
        valueMatcher = setterValue(matcher);
      });

      describe('AND then the value matcher is called with no arguments', () => {
        it('SHOULD return false', () => {
          expect((valueMatcher as any)()).toBeFalsy();
        });
      });

      describe('AND then the value matcher is called with a string', () => {
        it('SHOULD return true', () => {
          expect(valueMatcher('test')).toBeTruthy();
        });
      });

      describe('AND then the value matcher is called with a number', () => {
        it('SHOULD return false', () => {
          expect(valueMatcher(1)).toBeFalsy();
        });
      });

      describe('AND then the value matcher is called with an object', () => {
        it('SHOULD return false', () => {
          expect(valueMatcher({ name: 'test' })).toBeFalsy();
        });
      });
    });
  });
});
