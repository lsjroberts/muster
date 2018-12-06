import { Matcher } from '@dws/muster';
import { isCallerMatcher } from '../types/caller';
import { isCatchErrorMatcher } from '../types/catch-error';
import { isDeferMatcher } from '../types/defer';
import { getter, GetterMatcher, isGetterMatcher } from '../types/getter';
import { isInjectedMatcher } from '../types/injected';
import { isIsLoadingMatcher } from '../types/is-loading';
import { isListMatcher } from '../types/list';
import { isSetterMatcher } from '../types/setter';
import { isTreeMatcher } from '../types/tree';

export function sanitizeMatcher<T, O, M extends Matcher<T, O>>(
  matcher: M,
): M | GetterMatcher<undefined, T, M> {
  if (
    isCallerMatcher(matcher) ||
    isGetterMatcher(matcher) ||
    isListMatcher(matcher) ||
    isSetterMatcher(matcher) ||
    isTreeMatcher(matcher) ||
    isInjectedMatcher(matcher) ||
    isDeferMatcher(matcher) ||
    isIsLoadingMatcher(matcher) ||
    isCatchErrorMatcher(matcher)
  ) {
    return matcher;
  }
  return getter(matcher);
}
