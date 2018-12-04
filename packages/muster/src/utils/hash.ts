const stringHash = require('string-hash');
import { Matcher, ShapeFields } from '../types/matchers';
import * as types from './types';

export const FACTORY = Symbol('HASH_FACTORY');

export interface HashFunction<T> {
  (value: T): string;
}

export interface ValueHasherFactoryFunction<T, P> {
  (options?: P): HashFunction<T>;
}

export interface ValueHasherFactory<T, P> extends ValueHasherFactoryFunction<T, P> {
  [FACTORY]: true;
}

export function createHasherFactory<T, P>(
  id: string,
  factory: ValueHasherFactoryFunction<T, P>,
): ValueHasherFactory<T, P> {
  return Object.assign(
    // tslint:disable-next-line:no-increment-decrement
    (options?: P): HashFunction<T> => factory(options),
    {
      [FACTORY]: true as true,
    },
  );
}

function isHasherFactory<T, P>(
  func: HashFunction<T> | ValueHasherFactory<T, P>,
): func is ValueHasherFactory<T, P> {
  return !!(func as any)[FACTORY];
}

export const unique = (<T>(): HashFunction<T> => {
  let uid = 0;
  // tslint:disable-next-line:no-increment-decrement
  return (value: T): string => `*${++uid}`;
})();

export function empty(value: undefined): string {
  return 'U';
}

export function nil(value: null): string {
  return 'N';
}

export function bool(value: boolean): string {
  return value ? 'T' : 'F';
}

export function number(value: number): string {
  return `n${value}`;
}

export function string(value: string): string {
  // FIXME: This is not a cryptographically safe hashing mechanism.
  // FIXME: There might be a collision between different nodes
  return `s:${value.length}:${stringHash(value)}`;
}

const symbol = ((): HashFunction<symbol> => {
  const symbolToIdMap = new Map<symbol, string>();
  return (value: symbol) => {
    const symbolId = symbolToIdMap.get(value);
    if (symbolId) return symbolId;
    const newSymbolId = `$${symbolToIdMap.size}`;
    symbolToIdMap.set(value, newSymbolId);
    return newSymbolId;
  };
})();

export const date = (value: Date) => `d${value.getTime()}`;

export const func = unique as HashFunction<Function>;
export const object = unique as HashFunction<object>;
export const instance = unique as HashFunction<object>;
export const array = unique as HashFunction<Array<any>>;
export const instanceOf = unique as HashFunction<object>;
export const matcher = unique as HashFunction<Matcher<any, any>>;

export const any = (value: any): string => {
  switch (typeof value) {
    case 'undefined':
      return empty(value);
    case 'object':
      if (value === null) return nil(value);
      return object(value);
    case 'boolean':
      return bool(value);
    case 'function':
      return func(value);
    case 'number':
      return number(value);
    case 'string':
      return string(value);
    case 'symbol':
      return symbol(value);
    default:
      return unique(value);
  }
};

export const oneOf = (<T>() =>
  createHasherFactory(
    'oneOf',
    (values: Array<T>): HashFunction<T> => {
      return (value: T): string => `p${values.indexOf(value)}`;
    },
  ))();

export const shape = (<T extends { [key in keyof T]: T[key] }>() =>
  createHasherFactory(
    'shape',
    (fields: ShapeFields<T>): HashFunction<T> => {
      const propHashers = Object.keys(fields).map((key) => ({
        key,
        hash: type((fields as any)[key]),
      }));
      return (value: T): string => {
        let hash = 's(';
        // tslint:disable-next-line:no-increment-decrement
        for (let i = 0; i < propHashers.length; i++) {
          const propHasher = propHashers[i];
          hash += `${propHasher.hash((value as any)[propHasher.key])}|`;
        }
        return `${hash})`;
      };
    },
  ))();

export const arrayOf = (<T>() =>
  createHasherFactory(
    'arrayOf',
    (matcher: Matcher<T, any>): HashFunction<Array<T>> => {
      const itemHasher = type(matcher);
      return (value: Array<T>): string => {
        let hash = 't(';
        // tslint:disable-next-line:no-increment-decrement
        for (let i = 0; i < value.length; i++) {
          hash += `${itemHasher(value[i])}|`;
        }
        return `${hash})`;
      };
    },
  ))();

export const objectOf = (<T>() =>
  createHasherFactory(
    'objectOf',
    (
      matcher: Matcher<T, any>,
    ): HashFunction<{
      [key: string]: T;
    }> => {
      const valueHasher = type(matcher);
      return (value: { [key: string]: T }): string => {
        let hash = 'm(';
        const symbolKeys = Object.getOwnPropertySymbols(value);
        // tslint:disable-next-line:no-increment-decrement
        for (let i = 0; i < symbolKeys.length; i++) {
          const key = symbolKeys[i];
          // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
          hash += `${symbol(key)}=${valueHasher(value[key as any])}`;
        }
        const objectKeys = Object.keys(value).filter((key) => value.hasOwnProperty(key));
        // tslint:disable-next-line:no-increment-decrement
        for (let i = 0; i < objectKeys.length; i++) {
          const key = objectKeys[i];
          hash += `${string(key)}=${valueHasher(value[key])}|`;
        }
        return `${hash})`;
      };
    },
  ))();

export const oneOfType = (<T>() =>
  createHasherFactory(
    'oneOfType',
    (matchers: Array<Matcher<T, any>>): HashFunction<T> => {
      const matcherHasherPairs = matchers.map(
        (matcher) => [matcher, type(matcher)] as [Matcher<T>, HashFunction<T>],
      );
      return (value: T): string => {
        // tslint:disable-next-line:no-increment-decrement
        for (let index = 0; index < matcherHasherPairs.length; index++) {
          const [matcher, hasher] = matcherHasherPairs[index];
          if (matcher(value)) {
            return `${index}:${hasher(value)}`;
          }
        }
        return 'u';
      };
    },
  ))();

export const optional = (<T>() =>
  createHasherFactory(
    'optional',
    (matcher: Matcher<T, any>): HashFunction<T | undefined> => {
      const typeHasher = type(matcher);
      return (value: T | undefined): string => {
        if (typeof value === 'undefined' || value === null) return 'u';
        return typeHasher(value);
      };
    },
  ))();

export const saveHash = (<T>() =>
  createHasherFactory(
    'saveHash',
    (matcher: Matcher<T, any>): HashFunction<T> => {
      const typeHasher = type(matcher);
      return (value: T): string => {
        if ((value as any)['$$hash']) return (value as any)['$$hash'];
        const hash = typeHasher(value);
        if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
          Object.defineProperty(value, '$$hash', {
            value: hash,
            enumerable: false,
            configurable: true,
          });
        }
        return hash;
      };
    },
  ))();

export function ignore(value: any): string {
  return '';
}

export function type<T, P>(matcher: Matcher<T, P>): HashFunction<T> {
  const hasher = TYPE_HASHERS.get(matcher.metadata.type);
  if (!hasher) {
    throw new Error('Unable to type create hasher: unrecognised type');
  }
  return isHasherFactory(hasher) ? hasher(matcher.metadata.options) : hasher;
}

const TYPE_HASHERS = new Map<
  Matcher<any, any> | ((options: any) => Matcher<any, any>),
  HashFunction<any> | ValueHasherFactory<any, any>
>([
  [types.empty, empty],
  [types.nil, nil],
  [types.bool, bool],
  [types.number, number],
  [types.integer, number],
  [types.string, string],
  [types.symbol, symbol],
  [types.date, date],
  [types.func, func],
  [types.object, object],
  [types.matcher, matcher],
  [types.instance, instance],
  [types.array, array],
  [types.instanceOf, instanceOf],
  [types.any, any],
  [types.oneOf, oneOf],
  [types.shape, shape],
  [types.arrayOf, arrayOf],
  [types.objectOf, objectOf],
  [types.oneOfType, oneOfType],
  [types.ignore, ignore],
  [types.optional, optional],
  [types.saveHash, saveHash],
]);

export function registerTypeHasher<T extends HashFunction<any> | ValueHasherFactory<any, any>>(
  type: Matcher<any> | ((...args: Array<any>) => Matcher<any>),
  hasher: T,
): T {
  if (TYPE_HASHERS.has(type)) {
    throw new Error('Hasher already registered for specified type');
  }
  TYPE_HASHERS.set(type, hasher);
  return hasher;
}
