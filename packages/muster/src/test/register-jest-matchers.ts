import isPlainObject from 'is-plain-object';
import once from 'lodash/once';
import {
  isGraphNode,
  isGraphOperation,
  isNodeDefinition,
  setUnitTestMatcher,
} from '../types/graph';
import { isSerializedGraphOperation } from '../utils/serialize';

function isJestAsymetricMatcher(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.$$typeof === Symbol.for('jest.asymmetricMatcher')
  );
}

declare const global: Window & { expect: jest.Expect };

function mapValues(object: any, iteratee: (val: any, key: any, obj: any) => any) {
  const props = Object.keys(object);
  const symbols = Object.getOwnPropertySymbols(object);
  const result: any = {};
  props.forEach((key) => {
    result[key] = iteratee(object[key], key, object);
  });
  symbols.forEach((symbol) => {
    result[symbol] = iteratee(object[symbol], symbol, object);
  });
  return result;
}

function processObject(obj: any, visited: Set<any>): any {
  if (visited.has(obj)) {
    return obj;
  }
  const combinedVisited = new Set(visited).add(obj);
  if (
    isGraphOperation(obj) ||
    isSerializedGraphOperation(obj) ||
    isGraphNode(obj) ||
    isNodeDefinition(obj)
  ) {
    return mapValues(obj, (val, key) => {
      if (key === 'id') return expect.any(String);
      return processObject(val, visited);
    });
  }

  if (Array.isArray(obj)) {
    return obj.map((val) => processObject(val, combinedVisited));
  }
  if (isPlainObject(obj)) {
    return mapValues(obj, (val) => processObject(val, combinedVisited));
  }
  return obj;
}

function decorateMatcher(func: any): (...expected: Array<any>) => any {
  return (...expected: Array<any>) => {
    const processedExpected = expected.map((arg) => processObject(arg, new Set()));
    return func(...processedExpected);
  };
}

export const registerJestMatchers = once(() => {
  const jestExpect = global.expect;
  global.expect = Object.assign((received: any) => {
    const matchers = jestExpect(received);
    matchers.toEqual = decorateMatcher(matchers.toEqual);
    matchers.toHaveBeenCalledWith = decorateMatcher(matchers.toHaveBeenCalledWith);
    matchers.toHaveBeenLastCalledWith = decorateMatcher(matchers.toHaveBeenLastCalledWith);
    return matchers;
  }, jestExpect);
  setUnitTestMatcher(isJestAsymetricMatcher);
});
