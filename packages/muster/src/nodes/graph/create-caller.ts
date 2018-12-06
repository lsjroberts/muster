import {
  ChildKey,
  DisposeCallback,
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import { Matcher } from '../../types/matchers';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as types from '../../utils/types';

/**
 * An instance of the [[createCaller]] node.
 * See the [[createCaller]] documentation to find out more.
 */
export interface CreateCallerNode
  extends StaticGraphNode<'createCaller', CreateCallerNodeProperties> {}

/**
 * A definition of the [[createCaller]] node.
 * See the [[createCaller]] documentation to find out more.
 */
export interface CreateCallerNodeDefinition
  extends StaticNodeDefinition<'createCaller', CreateCallerNodeProperties> {}

export interface CreateCallerNodeProperties {
  key: ChildKey;
  disposeEmitter?: (listener: () => void) => DisposeCallback;
  matcher: Matcher<Array<any>, any>;
}

/**
 * The implementation of the [[createCaller]].
 * See the [[createCaller]] documentation to learn more.
 */
export const CreateCallerNodeType: StaticNodeType<
  'createCaller',
  CreateCallerNodeProperties
> = createNodeType<'createCaller', CreateCallerNodeProperties>('createCaller', {
  shape: {
    key: types.saveHash(types.any),
    disposeEmitter: types.optional(types.saveHash(types.func)),
    matcher: types.saveHash(types.func),
  },
});

export interface CreateCallerOptions {
  disposeEmitter?: (listener: () => void) => DisposeCallback;
  matcher?: Matcher<Array<any>, any>;
}

/**
 * Creates a new instance of a [[createCaller]] node, which is a type of a [[NodeDefinition]] used inside
 * the [[query]] node when requesting Muster to return a function that can be used to imperatively invoke a Muster action.
 * This node is extensively used by Muster React to create callback functions for muster actions.
 * It is intended to be used by any other libraries integrating Muster.
 * The caller function automatically un-wraps the returned value with the use of the [[valueOf]] helper.
 *
 *
 * @example **Create an action caller**
 * ```ts
 * import muster, { action, createCaller, query, root } from '@dws/muster';
 *
 * const app = muster({
 *   addFive: action((number) => number + 5),
 * });
 *
 * const queryResult = await app.resolve(query(root(), {
 *   addFive: createCaller('addFive'),
 * }));
 * // queryResult === {
 * //   addFive: function(number) {...},
 * // },
 *
 * const result = await queryResult.addFive(3);
 * // result === 8
 * ```
 * This example shows how to use the [[createCaller]] to retrieve a function that can be used
 * to imperatively invoke Muster actions.
 */
export function createCaller(
  key: ChildKey,
  options: CreateCallerOptions = {},
): CreateCallerNodeDefinition {
  return createNodeDefinition(CreateCallerNodeType, {
    key,
    disposeEmitter: options.disposeEmitter,
    matcher: options.matcher || (types.any as Matcher<any, any>),
  } as CreateCallerNodeProperties);
}

export function isCreateCallerNodeDefinition(
  value: NodeDefinition,
): value is CreateCallerNodeDefinition {
  return value.type === CreateCallerNodeType;
}
