import mapValues from 'lodash/mapValues';
import { createMatcher, isMatcher, SerializedMusterTypeData } from '../types/graph';
import { Matcher, ShapeFields } from '../types/matchers';
import { registerMusterType } from './types-registry';

export const any = createMatcher<any, never>('any', (value: any) => true);
registerMusterType('any', {
  deserialize: () => any,
});

export const ignore = createMatcher<any, never>('ignore', (value: any) => true);
registerMusterType('ignore', {
  deserialize: () => ignore,
});

export const empty = createMatcher<undefined, never>(
  'empty',
  (value: any) => typeof value === 'undefined',
);
registerMusterType('empty', {
  deserialize: () => empty,
});

export const nil = createMatcher<null, never>('nil', (value: any) => value === null);
registerMusterType('nil', {
  deserialize: () => nil,
});

export const bool = createMatcher<boolean, never>(
  'bool',
  (value: any) => typeof value === 'boolean',
);
registerMusterType('bool', {
  deserialize: () => bool,
});

export const number = createMatcher<number, never>(
  'number',
  (value: any) => typeof value === 'number',
);
registerMusterType('number', {
  deserialize: () => number,
});

export const integer = createMatcher<number, never>('integer', Number.isInteger);
registerMusterType('integer', {
  deserialize: () => integer,
});

export const string = createMatcher<string, never>(
  'string',
  (value: any) => typeof value === 'string',
);
registerMusterType('string', {
  deserialize: () => string,
});

export const date = createMatcher<Date, never>('date', (value: any) =>
  Boolean(value && value.constructor === Date),
);
registerMusterType('date', {
  deserialize: () => date,
});

export const func = createMatcher<Function, never>(
  'func',
  (value: any) => typeof value === 'function',
);
registerMusterType('func', {
  deserialize: () => func,
});

export const symbol = createMatcher<symbol, never>(
  'symbol',
  (value: any) => typeof value === 'symbol',
);
registerMusterType('symbol', {
  deserialize: () => symbol,
});

export const object = createMatcher<object, never>('object', (value: any) => isPlainObject(value));
registerMusterType('object', {
  deserialize: () => object,
});

export const matcher = createMatcher<Matcher<any, any>, never>('matcher', (value: any) =>
  isMatcher(value),
);
registerMusterType('matcher', {
  deserialize: () => matcher,
});

export function instance<T>(fields: ShapeFields<T>): Matcher<T, ShapeFields<T>> {
  const shapeMatcher = shape(fields);
  const matcher = createMatcher(
    'instance',
    (value: any) =>
      Boolean(
        value &&
          typeof value === 'object' &&
          (value.constructor && value.constructor !== Object) &&
          shapeMatcher(value),
      ),
    fields,
  );
  matcher.metadata.type = instance;
  return matcher;
}
registerMusterType('instance', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return instance(mapValues(value, deserialize));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    const fields = value.metadata.options as ShapeFields<any>;
    return mapValues(fields, serialize);
  },
});

export const array = createMatcher<Array<any>, never>('array', Array.isArray);
registerMusterType('array', {
  deserialize: () => array,
});

export function instanceOf<T, P extends Function>(type: P): Matcher<T, P> {
  const matcher = createMatcher<T, P>('instanceOf', getInstanceOfMatcher(type), type);
  matcher.metadata.type = instanceOf;
  return matcher;
}
registerMusterType('instanceOf', {
  deserialize(value: SerializedMusterTypeData | undefined): Matcher<any, any> {
    switch (value) {
      case 'boolean':
        return instanceOf(Boolean);
      case 'number':
        return instanceOf(Number);
      case 'string':
        return instanceOf(String);
      case 'function':
        return instanceOf(Function);
      case 'symbol':
        return instanceOf(Symbol);
      case 'object':
        return instanceOf(Object);
      case 'array':
        return instanceOf(Array);
      default:
        throw new Error('The `instanceOf` matcher cannot be de-serialized.');
    }
  },
  serialize(value: Matcher<any, any>): SerializedMusterTypeData {
    const type = value.metadata.options;
    switch (type) {
      case Boolean:
        return 'boolean';
      case Number:
        return 'number';
      case String:
        return 'string';
      case Function:
        return 'function';
      case Symbol:
        return 'symbol';
      case Object:
        return 'object';
      case Array:
        return 'array';
      default:
        throw new Error('The `instanceOf` matcher cannot be serialized.');
    }
  },
});

function getInstanceOfMatcher(type: Function): ((value: any) => boolean) {
  switch (type) {
    case Boolean:
      return (value: any) => typeof value === 'boolean';
    case Number:
      return (value: any) => typeof value === 'number';
    case String:
      return (value: any) => typeof value === 'string';
    case Function:
      return (value: any) => typeof value === 'function';
    case Symbol:
      return (value: any) => typeof value === 'symbol';
    case Object:
      return (value: any) => isPlainObject(value);
    case Array:
      return (value: any) => Array.isArray(value);
    default:
      return (value: any) => Boolean(value && value instanceof type);
  }
}

export function oneOf<T, P extends Array<T>>(values: P): Matcher<T, P> {
  const matcher = createMatcher('oneOf', (value: any) => values.includes(value), values);
  matcher.metadata.type = oneOf;
  return matcher;
}
registerMusterType('oneOf', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return oneOf((value as Array<any>).map(deserialize));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    return (value.metadata.options as Array<any>).map(serialize);
  },
});

export function shape<T>(fields: ShapeFields<T>): Matcher<T, ShapeFields<T>> {
  const fieldsKeys = Object.keys(fields);
  const matcher = createMatcher(
    'shape',
    (value: any) =>
      Boolean(
        value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          fieldsKeys.every((key: string) => (fields as any)[key](value[key])),
      ),
    fields,
  );
  matcher.metadata.type = shape;
  return matcher;
}
registerMusterType('shape', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return shape(mapValues(value, deserialize));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    const fields = value.metadata.options as ShapeFields<any>;
    return mapValues(fields, serialize);
  },
});

export function arrayOf<T>(type: Matcher<T, any>): Matcher<Array<T>, Matcher<T, any>> {
  const matcher = createMatcher(
    'arrayOf',
    (value: any) => Array.isArray(value) && value.every((item) => type(item)),
    type,
  );
  matcher.metadata.type = arrayOf;
  return matcher;
}
registerMusterType('arrayOf', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return arrayOf(deserialize(value));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    return serialize(value.metadata.options);
  },
});

export function objectOf<T>(type: Matcher<T, any>): Matcher<{ [key: string]: T }, Matcher<T, any>> {
  const matcher = createMatcher(
    'objectOf',
    (value: any) =>
      Boolean(
        value &&
          typeof value === 'object' &&
          (!value.constructor || value.constructor === Object) &&
          Object.keys(value).every((key) => type(value[key])),
      ),
    type,
  );
  matcher.metadata.type = objectOf;
  return matcher;
}
registerMusterType('objectOf', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return objectOf(deserialize(value));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    return serialize(value.metadata.options);
  },
});

export function oneOfType<T>(matchers: Array<Matcher<T, any>>): Matcher<T, Array<Matcher<T, any>>> {
  const matcher = createMatcher<T, Array<Matcher<T, any>>>(
    'oneOfType',
    (value: any) => matchers.some((matcher) => matcher(value)),
    matchers,
  );
  matcher.metadata.type = oneOfType;
  return matcher;
}
registerMusterType('oneOfType', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return oneOfType((value as Array<any>).map(deserialize));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    return (value.metadata.options as Array<any>).map(serialize);
  },
});

export function optional<T>(match: Matcher<T, any>): Matcher<T | undefined, Matcher<T, any>> {
  const matcher = createMatcher<T | undefined, Matcher<T, any>>(
    'optional',
    (value: any) => typeof value === 'undefined' || value === null || match(value),
    match,
  );
  matcher.metadata.type = optional;
  return matcher;
}
registerMusterType('optional', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return optional(deserialize(value));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    return serialize(value.metadata.options);
  },
});

export function recursive<
  T,
  V extends ((ref: Matcher<T, V>) => Matcher<T, V>) = ((ref: Matcher<T, V>) => Matcher<T, V>)
>(factory: (ref: Matcher<T, V>) => Matcher<T, V>): Matcher<T, V> {
  const matcher = createMatcher<T, V>('recursive', (value: any) => match(value), factory as V);
  const match = factory(matcher);
  matcher.metadata.type = recursive;
  return matcher;
}

export function saveHash<T>(match: Matcher<T, any>): Matcher<T | undefined, Matcher<T, any>> {
  const matcher = createMatcher<T | undefined, Matcher<T, any>>(
    'saveHash',
    (value: any) => match(value),
    match,
  );
  matcher.metadata.type = saveHash;
  return matcher;
}
registerMusterType('saveHash', {
  deserialize(
    value: SerializedMusterTypeData | undefined,
    deserialize: (value: any) => any,
  ): Matcher<any, any> {
    return saveHash(deserialize(value));
  },
  serialize(value: Matcher<any, any>, serialize: (value: any) => any): SerializedMusterTypeData {
    return serialize(value.metadata.options);
  },
});

function isPlainObject(value: any): value is object {
  return Boolean(
    value && typeof value === 'object' && (!value.constructor || value.constructor === Object),
  );
}
