import {
  createCaller,
  createSetter,
  fields,
  isFieldsNodeDefinition,
  key,
  Matcher,
  NodeDefinition,
  query,
  root,
} from '@dws/muster';
import { callerArguments, isCallerMatcher } from '../types/caller';
import { isCatchErrorMatcher } from '../types/catch-error';
import { isDeferMatcher } from '../types/defer';
import { isSetterMatcher, setterValue } from '../types/setter';
import { isTreeMatcher, TreeMatcher } from '../types/tree';
import { extractKeyName } from './build-query';
import { DisposeEmitter } from './create-dispose-emitter';

export function buildSettersAndCallersQuery<T>(
  disposeEmitter: DisposeEmitter,
  treeMatcher: TreeMatcher<T>,
  queryRoot: NodeDefinition = root(),
): NodeDefinition | undefined {
  if (!treeMatcher.metadata.options || Object.keys(treeMatcher.metadata.options).length === 0) {
    return undefined;
  }
  const queryPart = matcherToQueryPart(disposeEmitter, treeMatcher);
  if (!queryPart) return undefined;
  return query(queryRoot, queryPart);
}

function matcherToQueryPart(
  disposeEmitter: DisposeEmitter,
  matcher: Matcher<any>,
  name?: string,
): NodeDefinition | undefined {
  if (isCallerMatcher(matcher)) {
    const callerArgsMatcher = callerArguments(matcher);
    return createCaller(matcher.metadata.options.name || name, {
      disposeEmitter,
      matcher: callerArgsMatcher,
    });
  }
  if (isSetterMatcher(matcher)) {
    const setterValueMatcher = setterValue(matcher);
    return createSetter(matcher.metadata.options.name || name, {
      disposeEmitter,
      matcher: setterValueMatcher,
    });
  }
  if (isTreeMatcher(matcher)) {
    const treeFields = Object.keys(matcher.metadata.options).reduce(
      (acc, fieldName) => {
        const fieldMatcher = matcher.metadata.options[fieldName];
        const keyName = extractKeyName(fieldName);
        const node = matcherToQueryPart(disposeEmitter, fieldMatcher, keyName);
        if (node) {
          acc[fieldName] = isFieldsNodeDefinition(node) ? key(keyName, node) : node;
        }
        return acc;
      },
      {} as any,
    );
    if (Object.keys(treeFields).length === 0) return undefined;
    return fields(treeFields);
  }
  if (isDeferMatcher(matcher) || isCatchErrorMatcher(matcher)) {
    return matcherToQueryPart(disposeEmitter, matcher.metadata.options.type, name);
  }
  return undefined;
}
