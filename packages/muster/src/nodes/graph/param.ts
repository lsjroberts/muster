import {
  ChildKey,
  ContextDependency,
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import shallow from '../../utils/shallow';
import * as types from '../../utils/types';
import { getParamContextId } from './tree';
import { ValueNode } from './value';

/**
 * An instance of the [[param]] node.
 * See the [[param]] documentation to find out more.
 */
export interface ParamNode extends StatelessGraphNode<'param', ParamNodeProperties> {}

/**
 * A definition of the [[param]] node.
 * See the [[param]] documentation to find out more.
 */
export interface ParamNodeDefinition
  extends StatelessNodeDefinition<'param', ParamNodeProperties> {}

export interface ParamNodeProperties {
  name: string;
}

/**
 * The implementation of the [[param]] node.
 * See the [[param]] documentation to learn more.
 */
export const ParamNodeType: StatelessNodeType<'param', ParamNodeProperties> = createNodeType<
  'param',
  ParamNodeProperties
>('param', {
  shape: {
    name: types.string,
  },
  operations: {
    evaluate: {
      getContextDependencies({ name }: ParamNodeProperties): [ContextDependency] {
        return [{ name: getParamContextId(name), required: true, until: shallow }];
      },
      run(
        node: ParamNode,
        options: never,
        dependencies: Array<never>,
        [paramNode]: [ValueNode<ChildKey>],
      ): GraphNode {
        return paramNode;
      },
    },
  },
});

/**
 * Creates instance of the [[param]] node, which is used for accessing the value of a parameter from the current scope.
 * Parameters are usually defined by a [[tree]] and **match** helper. See the [[tree]] documentation for more information.
 *
 * @example **Accessing parameter values**
 * ```js
 * import muster, { match, param, ref, types } from '@dws/muster';
 *
 * const app = muster({
 *   user: {
 *     [match(types.string, 'userId')]: param('userId'),
 *   },
 *   invalidParam: param('userId'),
 * });
 *
 * const userId = await app.resolve(ref('user', '123-456'));
 * // userId === '123-456'
 *
 * const invalid = await app.resolve(ref('invalidParam'));
 * // invalid === 'Invalid parameter: "userId"'
 * ```
 * This example demonstrates how to access a named parameter from the current path. Usually the
 * [[param]] resolves to a [[value]] with the value of a given parameter. See the
 * [[tree]] for more information on matchers and branches.
 */
export function param(name: string): ParamNodeDefinition {
  return createNodeDefinition(ParamNodeType, {
    name,
  });
}

export function isParamNodeDefinition(value: NodeDefinition): value is ParamNodeDefinition {
  return value.type === ParamNodeType;
}
