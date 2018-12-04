import {
  ChildKey,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as types from '../../utils/types';

export class MusterError extends Error {
  public static is(value: any): value is MusterError {
    return typeof value === 'object' && value !== null && value.name === MusterError.name;
  }

  public error: Error | { message: string; stack?: string };
  public message: string;
  public stack: string | undefined;
  public code: string | undefined;
  public data: any | undefined;
  public path: Array<ChildKey> | undefined;
  public remotePath: Array<ChildKey> | undefined;

  constructor(
    error: Error | { message: string; stack?: string },
    options: {
      code: string | undefined;
      data: any | undefined;
      path: Array<ChildKey> | undefined;
      remotePath: Array<ChildKey> | undefined;
    },
  ) {
    const { code, data, path, remotePath } = options;
    super(error.message);
    this.name = this.constructor.name;
    this.error = error;
    this.message = error.message;
    this.stack = error.stack;
    this.code = code;
    this.data = data;
    this.path = path;
    this.remotePath = remotePath;
  }
}

/**
 * An instance of the [[error]] node.
 * See the [[error]] documentation to find out more.
 */
export interface ErrorNode
  extends StaticGraphNode<'error', ErrorNodeProperties, SerializedErrorNodeProperties> {}

/**
 * A definition of the [[error]] node.
 * See the [[error]] documentation to find out more.
 */
export interface ErrorNodeDefinition
  extends StaticNodeDefinition<'error', ErrorNodeProperties, SerializedErrorNodeProperties> {}

export interface ErrorNodeProperties {
  error: Error | { message: string; stack?: string };
  code: string | undefined;
  data: any | undefined;
  path: Array<ChildKey> | undefined;
  remotePath: Array<ChildKey> | undefined;
}

export interface SerializedErrorNodeProperties {
  error: { message: string; stack?: string };
  code: string | undefined;
  data: any | undefined;
  path: Array<ChildKey> | undefined;
  remotePath: Array<ChildKey> | undefined;
}

/**
 * The implementation of the [[error]] node.
 * See the [[error]] documentation to learn more.
 */
export const ErrorNodeType: StaticNodeType<
  'error',
  ErrorNodeProperties,
  SerializedErrorNodeProperties
> = createNodeType<'error', ErrorNodeProperties, SerializedErrorNodeProperties>('error', {
  shape: {
    error: types.shape({
      message: types.string,
      stack: types.ignore,
    }),
    code: types.optional(types.string),
    data: types.optional(types.saveHash(types.any)),
    path: types.optional(types.saveHash(types.arrayOf(types.any))),
    remotePath: types.optional(types.saveHash(types.arrayOf(types.any))),
  },
  serialize(properties: ErrorNodeProperties): SerializedErrorNodeProperties {
    const { error, code, data, path, remotePath } = properties;
    return {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      code,
      data,
      path,
      remotePath,
    };
  },
  deserialize(data: SerializedErrorNodeProperties): ErrorNodeProperties {
    const safeData = data || {};
    const error = safeData.error || new Error('Unknown error');
    return {
      error,
      code: safeData.code,
      data: safeData.data,
      path: safeData.path,
      remotePath: safeData.remotePath,
    };
  },
});

export interface ErrorNodeOptions {
  data?: any;
  code?: string;
}

/**
 * Creates a new instance of an [[error]] node, which is a type of [[NodeDefinition]] used by Muster when an error has occurred.
 * This node contains following information:
 * - error - the instance of the caught exception
 * - data - additional data provided at the time of error's creation
 * - path - path in the graph that caused this error
 * - remotePath - path in the remote graph that caused this error
 *
 * Every exception raised in Muster is caught and converted to this [[NodeDefinition]]. It allows for
 * more fine-grained control of what to do when an error has occurred. Like the
 * [[pending]], the [[error]] is usually short-circuited and returned to the subscriber.
 *
 * Muster also comes with a helper node that allows catching errors and replacing them with a
 * fallback value. See the [[ifError]] documentation to learn more.
 *
 *
 * @example **Error short-circuiting**
 * ```js
 * import muster, { computed, ref } from '@dws/muster';
 *
 * const app = muster({
 *   throwError: computed([], () => {
 *     console.log('Throwing an error');
 *     throw new Error('Boom!');
 *   }),
 *   computeSomething: computed([ref('throwError')], (val) => {
 *     console.log('Computing something');
 *     return val + 1;
 *   }),
 * });
 *
 * const result = await app.resolve(ref('computeSomething'));
 * // result === new Error('Boom!')
 * // result.path === ['throwError']
 * console.log('End');
 *
 * // Console output:
 * // Throwing an error
 * // End
 * ```
 * This example shows how the short-circuiting mechanism works. Note that `computeSomething`
 * does not log anything, as the content of the node is never run. This prevents the application
 * from getting into an inconsistent state.
 *
 *
 * @example **Returning a custom error**
 * ```js
 * import muster, { computed, error, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   age: variable(25),
 *   spirits: computed([ref('age')], (age) => {
 *     if (age < 18) {
 *       return error('Alcohol cannot be sold to people under 18!');
 *     }
 *     return ['Beer', 'Gin', 'Whisky', 'Wine'];
 *   }),
 * });
 *
 * console.log('Subscribing to spirits');
 * app.resolve(ref('spirits')).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Changing age to 17')
 * await app.resolve(set('age', 17));
 *
 * // Console output:
 * // Subscribing to spirits
 * // ['Beer', 'Gin', 'Whisky', 'Wine']
 * // Changing age to 17
 * // new Error('Alcohol cannot be sold to people under 18!')
 * ```
 * This example shows how to report custom errors from muster. They obey the same rules as
 * internally reported errors. The console output misses one fact that the error in an actual
 * Error object, which contains a stack trace.
 */
export function error(
  err: string | Error | { message: string; stack?: string } | ErrorNodeDefinition,
  options?: ErrorNodeOptions,
): ErrorNodeDefinition {
  if (isNodeDefinition(err) && isErrorNodeDefinition(err)) {
    if (!options) {
      return err;
    }
    return createNodeDefinition(ErrorNodeType, {
      error: err.properties.error,
      code: options.code !== undefined ? options.code : err.properties.code,
      data: options.data !== undefined ? options.data : err.properties.data,
      path: err.properties.path,
      remotePath: err.properties.remotePath,
    });
  }
  if (MusterError.is(err)) {
    return createNodeDefinition(ErrorNodeType, {
      error: err.error,
      code: options && options.code !== undefined ? options.code : err.code,
      data: options && options.data !== undefined ? options.data : err.data,
      path: err.path,
      remotePath: err.remotePath,
    } as ErrorNodeProperties);
  }
  return createNodeDefinition(ErrorNodeType, {
    error: typeof err === 'string' ? new Error(err) : err,
    code: options && options.code !== undefined ? options.code : undefined,
    data: options && options.data !== undefined ? options.data : undefined,
    path: undefined,
    remotePath: undefined,
  } as ErrorNodeProperties);
}

export interface ErrorPathOptions {
  path?: Array<ChildKey>;
  remotePath?: Array<ChildKey>;
}

/* tslint:disable:max-line-length */
export function withErrorPath(
  error: ErrorNodeDefinition,
  options: ErrorPathOptions,
): ErrorNodeDefinition;
export function withErrorPath(error: ErrorNode, options: ErrorPathOptions): ErrorNode;
export function withErrorPath(
  error: ErrorNodeDefinition | ErrorNode,
  options: ErrorPathOptions,
): ErrorNodeDefinition | ErrorNode;
/* tslint:enable:max-line-length */
export function withErrorPath(
  error: ErrorNodeDefinition | ErrorNode,
  options: ErrorPathOptions,
): ErrorNodeDefinition | ErrorNode {
  if (isGraphNode(error)) {
    return createGraphNode(error.scope, error.context, withErrorPath(error.definition, options));
  }
  return {
    ...error,
    properties: {
      ...error.properties,
      ...(options.path && { path: options.path }),
      ...(options.remotePath && { remotePath: options.remotePath }),
    },
  };
}

export function isErrorNodeDefinition(value: NodeDefinition): value is ErrorNodeDefinition {
  return value.type === ErrorNodeType;
}
