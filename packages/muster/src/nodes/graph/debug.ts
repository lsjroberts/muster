import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';

/**
 * An instance of the [[debug]] node.
 * See the [[debug]] documentation to find out more.
 */
export interface DebugNode extends StatelessGraphNode<'debug', DebugNodeProperties> {}

/**
 * A definition of the [[debug]] node.
 * See the [[debug]] documentation to find out more.
 */
export interface DebugNodeDefinition
  extends StatelessNodeDefinition<'debug', DebugNodeProperties> {}

export interface DebugNodeProperties {
  target: NodeDefinition;
}

/**
 * The implementation of the [[debug]].
 * See the [[debug]] documentation to learn more.
 */
export const DebugNodeType: StatelessNodeType<'debug', DebugNodeProperties> = createNodeType<
  'debug',
  DebugNodeProperties
>('debug', {
  serialize: false,
  deserialize: false,
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: DebugNodeProperties): [NodeDependency] {
        return [
          {
            target,
            allowPending: true,
            allowErrors: true,
            acceptNil: true,
          },
        ];
      },
      run(node: DebugNode, options: never, [targetValue]: [GraphNode]): NodeDefinition {
        const { target } = node.definition.properties;
        const input = target;
        const resolved = targetValue.definition;
        window.console.log({ input, resolved });
        debugger;
        return target;
      },
    },
  },
});

/**
 * Creates a new instance of a [[debug]] node, which is a type of [[NodeDefinition]] that can be useful when debugging
 * an application. This node can be used as a wrapper for any node and will trigger the JS debugger breakpoint when the
 * wrapped node is evaluated. Additionally, the output of the node will be logged to the console.
 *
 *
 * @example **Debug a computed node**
 * ```js
 * import muster, { computed, debug } from '@dws/muster';
 *
 * const app = muster({});
 *
 * await app.resolve(debug(computed([], () => {
 *   console.log('Evaluating the computed');
 *   return 2;
 * })));
 *
 * // Console output:
 * // Evaluating the computed
 * // { input: <<computed node json>>, output: { $type: 'value', value: 2 } }
 * ```
 * Running this code will cause a JS debugger breakpoint to be triggered after evaluating the
 * [[computed]] node. Note the order of the messages in the console output.
 */
export function debug(target: NodeLike | NodeDefinition): DebugNodeDefinition {
  return createNodeDefinition(DebugNodeType, {
    target,
  });
}

export function isDebugNodeDefinition(value: NodeDefinition): value is DebugNodeDefinition {
  return value.type === DebugNodeType;
}
