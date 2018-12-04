import { getInvalidTypeError, Matcher } from '@dws/muster';
import get from 'lodash/get';
import { isCallerMatcher } from '../types/caller';
import { isCatchErrorMatcher } from '../types/catch-error';
import { isDeferMatcher } from '../types/defer';
import { isGetterMatcher } from '../types/getter';
import { isInjectedMatcher } from '../types/injected';
import { isIsLoadingMatcher } from '../types/is-loading';
import { isListMatcher } from '../types/list';
import { isSetterMatcher } from '../types/setter';
import { isTreeMatcher, TreeMatcher } from '../types/tree';

export type TreeValidator = (props: any) => Array<Error>;

export function buildTreeValidator<T>(treeMatcher: TreeMatcher<T>): TreeValidator {
  if (!treeMatcher.metadata.options || Object.keys(treeMatcher.metadata.options).length === 0) {
    return () => [];
  }
  return buildMatcherValidator(treeMatcher, []);
}

function buildMatcherValidator(matcher: Matcher<any>, path: Array<string>): TreeValidator {
  if (isInjectedMatcher(matcher)) return () => [];
  if (isCallerMatcher(matcher) || isSetterMatcher(matcher)) {
    return (value: any) => {
      if (typeof value === 'function') return [];
      return [new Error(`Property ${formatPath(path)} - Invalid value: ${value}`)];
    };
  }
  if (isGetterMatcher(matcher)) {
    return (value: any) => {
      if (matcher.metadata.options.type(value)) return [];
      return [new Error(`Property ${formatPath(path)} - Invalid value: ${value}`)];
    };
  }
  if (isTreeMatcher(matcher)) {
    const validators = Object.keys(matcher.metadata.options).map((name) => {
      const validator = buildMatcherValidator(matcher.metadata.options[name], [...path, name]);
      return (value: any) => validator(get(value, name));
    });
    return (value: any) =>
      validators.reduce((errors, validator) => {
        const newErrors = validator(value);
        return newErrors.length > 0 ? [...errors, ...newErrors] : errors;
      }, []);
  }
  if (isListMatcher(matcher)) {
    const { itemMatcher } = matcher.metadata.options;
    if (!itemMatcher || !isTreeMatcher(itemMatcher)) {
      return (value: any) => {
        if (!Array.isArray(value)) {
          return [new Error(`Property ${formatPath(path)} - Invalid value:${value}`)];
        }
        if (itemMatcher) {
          return value.reduce((errors, item, index) => {
            if (!itemMatcher(item)) {
              errors.push(
                new Error(`Property ${formatPath(path)}[${index}] - Invalid value:${value}`),
              );
            }
            return errors;
          }, []);
        }
        return [];
      };
    }
    const itemValidator = buildMatcherValidator(itemMatcher, []);
    return (value: any) => {
      if (!Array.isArray(value)) {
        return [new Error(`Property ${formatPath(path)} - Invalid value:${value}`)];
      }
      return value.reduce(
        (errors, item, index) => [
          ...errors,
          ...itemValidator(item).map(
            (error) =>
              new Error(`Property ${formatPath(path)}[${index}] - Item error:${error.message}`),
          ),
        ],
        [],
      );
    };
  }
  if (isDeferMatcher(matcher) || isCatchErrorMatcher(matcher)) {
    // const validator = buildMatcherValidator(matcher.metadata.options.type, path);
    return (value: any) => {
      return [];
      // TODO: Find some way to reliably validate values passed into a deferred matcher
      // TODO: The problem is with checking if the value is a resolved value from Muster, or a fallback
      // if (value === undefined || value === null) return [];
      // return validator(value);
    };
  }
  if (isIsLoadingMatcher(matcher)) {
    return () => [];
  }
  throw getInvalidTypeError(
    'Invalid type of matcher encountered when building a props validator.',
    {
      expected: [
        'getter()',
        'setter()',
        'caller()',
        'list()',
        'tree()',
        'injected()',
        'defer()',
        'isLoading()',
        'catchError()',
      ],
      received: matcher,
    },
  );
}

function formatPath(path: Array<string>): string {
  return `'${path.join('.')}'`;
}
