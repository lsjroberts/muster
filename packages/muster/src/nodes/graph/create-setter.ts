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
 * An instance of the [[createSetter]] node.
 * See the [[createSetter]] documentation to find out more.
 */
export interface CreateSetterNode
  extends StaticGraphNode<'createSetter', CreateSetterNodeProperties> {}

/**
 * A definition of the [[createSetter]] node.
 * See the [[createSetter]] documentation to find out more.
 */
export interface CreateSetterNodeDefinition
  extends StaticNodeDefinition<'createSetter', CreateSetterNodeProperties> {}

export interface CreateSetterNodeProperties {
  key: ChildKey;
  disposeEmitter?: (listener: () => void) => DisposeCallback;
  matcher: Matcher<any, any>;
}

/**
 * The implementation of the [[createSetter]] node.
 * See the [[createSetter]] documentation to learn more.
 */
export const CreateSetterNodeType: StaticNodeType<
  'createSetter',
  CreateSetterNodeProperties
> = createNodeType<'createSetter', CreateSetterNodeProperties>('createSetter', {
  shape: {
    key: types.saveHash(types.any),
    disposeEmitter: types.optional(types.saveHash(types.func)),
    matcher: types.saveHash(types.func),
  },
});

export interface CreateSetterOptions {
  matcher?: Matcher<any, any>;
  disposeEmitter?: (listener: () => void) => DisposeCallback;
}

/**
 * Creates a new instance of a [[createSetter]] node, which is a type of a [[NodeDefinition]] used inside
 * the [[query]] when requesting Muster to return a function that can be used to imperatively set a Muster variable.
 * This node is extensively used by Muster React to create setter functions.
 * It is intended to be used by any other libraries integrating Muster.
 * The setter function automatically un-wraps a returned value with the use of the [[valueOf]] helper.
 *
 *
 * @example **Create a setter**
 * ```js
 * import muster, { createSetter, query, ref, root, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 * });
 *
 * const queryResult = await app.resolve(query(root(), {
 *   setName: createSetter('name'),
 * }));
 * // queryResult === {
 * //   setName: function(val) {...},
 * // },
 *
 * const result = await queryResult.setName('Jane');
 * // result === 'Jane'
 *
 * const name = await app.resolve(ref('name'));
 * // name === 'Jane'
 * ```
 * This example shows how to use the [[createSetter]] to retrieve a function that can be used
 * to imperatively set Muster variables.
 */
export function createSetter(
  key: ChildKey,
  options: CreateSetterOptions = {},
): CreateSetterNodeDefinition {
  return createNodeDefinition(CreateSetterNodeType, {
    key,
    disposeEmitter: options.disposeEmitter,
    matcher: options.matcher || (types.any as Matcher<any, any>),
  } as CreateSetterNodeProperties);
}

export function isCreateSetterNodeDefinition(
  value: NodeDefinition,
): value is CreateSetterNodeDefinition {
  return value.type === CreateSetterNodeType;
}
