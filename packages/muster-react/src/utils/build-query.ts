import {
  catchError,
  createCaller,
  createSetter,
  defer,
  entries,
  fields,
  getInvalidTypeError,
  isDeferNodeDefinition,
  isFieldsNodeDefinition,
  isPending,
  key,
  Matcher,
  NodeDefinition,
  query,
  root,
} from '@dws/muster';
import { callerArguments, isCallerMatcher } from '../types/caller';
import { isCatchErrorMatcher } from '../types/catch-error';
import { isDeferMatcher } from '../types/defer';
import { isGetterMatcher } from '../types/getter';
import { isInjectedMatcher } from '../types/injected';
import { isIsLoadingMatcher } from '../types/is-loading';
import { isListMatcher } from '../types/list';
import { isSetterMatcher, setterValue } from '../types/setter';
import { isTreeMatcher, TreeMatcher } from '../types/tree';
import { DisposeEmitter } from './create-dispose-emitter';

export function buildQuery<T>(
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

interface MatcherToQueryPartOptions {
  name?: string;
  parentTree?: TreeMatcher<any>;
  skipIsLoading?: boolean;
}

function matcherToQueryPart(
  disposeEmitter: DisposeEmitter,
  matcher: Matcher<any>,
  options: MatcherToQueryPartOptions = {},
): NodeDefinition | undefined {
  if (isInjectedMatcher(matcher)) return undefined;
  if (isGetterMatcher(matcher)) {
    return key(matcher.metadata.options.name || options.name);
  }
  if (isCallerMatcher(matcher)) {
    const callerArgsMatcher = callerArguments(matcher);
    return createCaller(matcher.metadata.options.name || options.name, {
      disposeEmitter,
      matcher: callerArgsMatcher,
    });
  }
  if (isSetterMatcher(matcher)) {
    const setterValueMatcher = setterValue(matcher);
    return createSetter(matcher.metadata.options.name || options.name, {
      disposeEmitter,
      matcher: setterValueMatcher,
    });
  }
  if (isListMatcher(matcher)) {
    const itemMatcher = matcher.metadata.options.itemMatcher;
    if (!itemMatcher || !isTreeMatcher(itemMatcher)) {
      return key(matcher.metadata.options.name || options.name, entries());
    }
    const itemFields = matcherToQueryPart(disposeEmitter, itemMatcher);
    return key(matcher.metadata.options.name || options.name, entries(itemFields));
  }
  if (isTreeMatcher(matcher)) {
    const treeFields = Object.keys(matcher.metadata.options).reduce(
      (acc, fieldName) => {
        const fieldMatcher = matcher.metadata.options[fieldName];
        const keyName = extractKeyName(fieldName);
        const node = matcherToQueryPart(disposeEmitter, fieldMatcher, {
          name: keyName,
          parentTree: matcher,
        });
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
  if (isDeferMatcher(matcher)) {
    const deferredType = matcher.metadata.options.type;
    const fallback = matcher.metadata.options.fallback;
    const node = matcherToQueryPart(disposeEmitter, deferredType, options);
    if (!node) return undefined;
    const deferredKey = isFieldsNodeDefinition(node) ? key(options.name, node) : node;
    return defer(fallback, deferredKey);
  }
  if (isCatchErrorMatcher(matcher)) {
    const type = matcher.metadata.options.type;
    const fallback = matcher.metadata.options.fallback;
    const node = matcherToQueryPart(disposeEmitter, type, options);
    if (!node) return undefined;
    const catchedKey = isFieldsNodeDefinition(node) ? key(options.name, node) : node;
    return catchError(fallback, catchedKey);
  }
  if (isIsLoadingMatcher(matcher)) {
    if (options.skipIsLoading) return undefined;
    const relativeName = matcher.metadata.options;
    const targetMatcher = options.parentTree
      ? options.parentTree.metadata.options[relativeName]
      : undefined;
    if (!targetMatcher) {
      throw new Error(`Could not find prop targeted by isLoading(): "${relativeName}"`);
    }
    const node = matcherToQueryPart(disposeEmitter, targetMatcher, {
      name: relativeName,
      skipIsLoading: true,
    });
    if (!node) return undefined;
    return isPending(isDeferNodeDefinition(node) ? node.properties.target : node);
  }
  throw getInvalidTypeError('Invalid type of matcher encountered when building a query.', {
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
  });
}

export function extractKeyName(name: string): string {
  return name.replace(/^\$\$required\(.*\):/, '');
}
