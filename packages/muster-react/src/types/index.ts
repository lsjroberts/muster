import {
  // @ts-ignore This is just to shut TypeScript up about unused parameter
  // which is actually used by export const propTypes = { ... };
  Matcher,
  types as musterTypes,
} from '@dws/muster';
import { caller, callerArguments } from './caller';
import { catchError } from './catch-error';
import { defer } from './defer';
import { getter } from './getter';
import { injected } from './injected';
import { isLoading } from './is-loading';
import { list } from './list';
import { setter, setterValue } from './setter';
import { tree } from './tree';

export const propTypes = {
  ...musterTypes,
  caller,
  callerArguments,
  catchError,
  defer,
  getter,
  injected,
  isLoading,
  list,
  setter,
  setterValue,
  tree,
};

export {
  CallerArgumentMatcher,
  CallerMatcher,
  CallerOptions,
  isCallerArgumentMatcher,
  isCallerMatcher,
} from './caller';
export { CatchErrorMatcher, CatchErrorMatcherOptions, isCatchErrorMatcher } from './catch-error';
export { DeferMatcher, isDeferMatcher } from './defer';
export { GetterMatcher, GetterOptions, isGetterMatcher } from './getter';
export { InjectedMatcher, InjectedOptions, isInjectedMatcher } from './injected';
export { IsLoadingMatcher, isIsLoadingMatcher } from './is-loading';
export { isListMatcher, ListMatcher, ListOptions } from './list';
export {
  isSetterMatcher,
  isSetterValueMatcher,
  SetterMatcher,
  SetterOptions,
  SetterValueMatcher,
} from './setter';
export { isTreeMatcher, TreeFields, TreeMatcher } from './tree';
