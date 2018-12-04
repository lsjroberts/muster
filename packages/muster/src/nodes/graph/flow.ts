import { CallArgumentArray, CallArgumentMap, CallOperation } from '../../operations/call';
import {
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { apply } from './apply';
import { nil } from './nil';

/**
 * An instance of the [[flow]] node.
 * See the [[flow]] documentation to find out more.
 */
export interface FlowNode extends StatelessGraphNode<'flow', FlowNodeProperties> {}

/**
 * A definition of the [[flow]] node.
 * See the [[flow]] documentation to find out more.
 */
export interface FlowNodeDefinition extends StatelessNodeDefinition<'flow', FlowNodeProperties> {}

export interface FlowNodeProperties {
  functions: Array<NodeDefinition>;
}

/**
 * The implementation of the [[flow]] node.
 * See the [[flow]] documentation for more information.
 */
export const FlowNodeType: StatelessNodeType<'flow', FlowNodeProperties> = createNodeType<
  'flow',
  FlowNodeProperties
>('flow', {
  shape: {
    functions: types.arrayOf(graphTypes.nodeDefinition),
  },
  operations: {
    call: {
      run(node: FlowNode, operation: CallOperation) {
        return composeApplyNodes(node.definition.properties.functions, operation.properties.args);
      },
    },
  },
});

function composeApplyNodes(
  functions: Array<NodeDefinition>,
  args: CallArgumentArray | CallArgumentMap | undefined,
): NodeDefinition {
  if (functions.length === 0) return nil();
  const func = functions[functions.length - 1];
  const rest = functions.slice(0, functions.length - 1);
  return rest.length > 0 ? apply([composeApplyNodes(rest, args)], func) : apply(args || [], func);
}

/**
 * Creates a new instance of the [[flow]] node, which works similarly to the `flow` function from
 * lodash, and can be used to chain node calls.
 *
 *
 * @example **Using the flow node**
 * ```javascript
 * import muster, { call, flow, format, fn, ref, setResult, variable } from '@dws/muster';
 *
 * const app = muster({
 *   createArticle: fn(() =>
 *     // The logic to create article goes here
 *     // And then return article id
 *     value('article-id')
 *   ),
 *   url: variable('/'),
 * });
 *
 * console.log('Get the URL');
 * app.resolve(ref('url')).subscribe((url) => console.log('URL:', url));
 *
 * console.log('Call flow node');
 * await app.resolve(call(flow(
 *   ref('createArticle'),
 *   fn((id) => setResult('url', format('/article/${id}', { id }))),
 * )));
 *
 * // Console output:
 * // Get the URL
 * // URL: /
 * // Call flow node
 * // URL: /article/article-id
 * ```
 */
export function flow(...functions: Array<NodeDefinition>): FlowNodeDefinition {
  return createNodeDefinition(FlowNodeType, {
    functions,
  });
}

export function isFlowNodeDefinition(value: NodeDefinition): value is FlowNodeDefinition {
  return value.type === FlowNodeType;
}
