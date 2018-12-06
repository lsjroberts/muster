import isPlainObject from 'lodash/isPlainObject';
import map from 'lodash/map';
import {
  isContext,
  isGraphAction,
  isGraphNode,
  isGraphOperation,
  isMatcher,
  isNodeDefinition,
  isNodeType,
  isScope,
} from '../types/graph';
import getContextValues from './get-context-values';
import * as types from './types';

/**
 * Get a string representation of a value's type, as used in error messages.
 * @param {any} value Value to inspect
 * @return {string} String representation of the value's type
 */
export default function getType(value: any): string {
  return getTypeRecursive(value, []);
}

// eslint-disable-next-line complexity
function getTypeRecursive(value: any, visited: Array<any>): string {
  switch (typeof value) {
    case 'undefined':
      return 'undefined';
    case 'boolean':
      return String(value);
    case 'string':
      return JSON.stringify(value);
    case 'number':
      return String(value);
    case 'function': {
      if (isMatcher(value)) {
        return `matcher::${getMatcherName(value)}`;
      }
      return value.name ? `function::${value.name}` : 'function';
    }
    case 'symbol':
      return value.toString();
    case 'object': {
      if (value === null) {
        return 'null';
      }
      if (value instanceof Date) {
        return 'Date';
      }
      if (value instanceof RegExp) {
        return 'RegExp';
      }
      if (value instanceof Map) {
        return 'Map';
      }
      if (value instanceof Set) {
        return 'Set';
      }
      if (value instanceof Error) {
        return `Error(${value.message})`;
      }
      if (isPromise(value)) {
        return 'Promise';
      }
      if (visited.includes(value)) {
        return '[Circular]';
      }
      if (isNodeDefinition(value)) {
        if (value.type.getType) {
          return value.type.getType(value.properties, (nextValue: any) =>
            getTypeRecursive(nextValue, [...visited, value]),
          );
        }
        return `${value.type.name}(${getTypeRecursive(
          value.type.name === 'value' ? value.properties.value : value.properties,
          [...visited, value],
        )})`;
      }
      if (isGraphNode(value)) {
        return `GraphNode(${getTypeRecursive(
          {
            definition: value.definition,
            context: value.context,
          },
          [...visited, value],
        )})`;
      }
      if (isGraphOperation(value)) {
        return `${value.type.name}(${getTypeRecursive(value.properties, [...visited, value])})`;
      }
      if (isGraphAction(value)) {
        return `${value.operation.type.name}(${getTypeRecursive(value.node.definition, [
          ...visited,
          value,
        ])})${
          Object.keys(value.operation.properties).length > 0
            ? `<${getTypeRecursive(value.operation.properties, [...visited, value])}>`
            : ''
        }`;
      }
      if (isScope(value)) {
        return 'Scope';
      }
      if (isContext(value)) {
        return `Context(${getTypeRecursive(getContextValues(value), [...visited, value])})`;
      }
      if (isNodeType(value)) {
        return `${value.name}()`;
      }
      if (Array.isArray(value)) {
        const valueTypes = value.map((item) => getTypeRecursive(item, [...visited, value]));
        return `[${valueTypes.join(', ')}]`;
      }
      if (isPlainObject(value) || value.constructor === Object) {
        const propertyTypes = map(
          [...Object.getOwnPropertySymbols(value), ...Object.keys(value)],
          (key) => [key, getTypeRecursive(value[key], [...visited, value])],
        );
        return `{${map(
          propertyTypes,
          ([key, type]) => `${typeof key === 'symbol' ? String(key) : key}: ${type.toString()}`,
        ).join(', ')}}`;
      }
      return value.constructor.name || value.toString();
    }
    default:
      return value.toString();
  }
}

function getMatcherName(value: any): string {
  for (const name of Object.keys(types)) {
    if ((types as any)[name] === value.metadata.type) {
      return name;
    }
  }
  return value.metadata.type.name || 'unnamed type';
}

function isPromise<T>(object?: any | PromiseLike<T>): object is PromiseLike<T> {
  return Boolean(object) && typeof object.then === 'function';
}
