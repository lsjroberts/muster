import {
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  NodeDependency,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { pending } from './pending';
import { resolve } from './resolve';

/**
 * An instance of the [[once]] node.
 * See the [[once]] documentation to find out more.
 */
export interface OnceNode
  extends StatefulGraphNode<'once', OnceNodeProperties, OnceNodeState, OnceNodeData> {}

/**
 * A definition of the [[once]] node.
 * See the [[once]] documentation to find out more.
 */
export interface OnceNodeDefinition
  extends StatefulNodeDefinition<'once', OnceNodeProperties, OnceNodeState, OnceNodeData> {}

export interface OnceNodeProperties {
  target: NodeDefinition | GraphNode | NodeDependency;
}

export interface OnceNodeState {
  currentValue: NodeDefinition | GraphNode;
}

export interface OnceNodeData {}

/**
 * The implementation of the [[once]] node.
 * See the [[once]] documentation to learn more.
 */
export const OnceNodeType: StatefulNodeType<
  'once',
  OnceNodeProperties,
  OnceNodeState,
  OnceNodeData
> = createNodeType<'once', OnceNodeProperties, OnceNodeState, OnceNodeData>('once', {
  state: {
    currentValue: types.oneOfType<NodeDefinition | GraphNode>([
      graphTypes.nodeDefinition,
      graphTypes.graphNode,
    ]),
  },
  shape: {
    target: types.oneOfType<NodeDefinition | GraphNode | NodeDependency>([
      graphTypes.nodeDefinition,
      graphTypes.graphNode,
      graphTypes.nodeDependency,
    ]),
  },
  getInitialState(): OnceNodeState {
    return {
      currentValue: pending(),
    };
  },
  operations: {
    evaluate: {
      cacheable: false,
      run(
        node: OnceNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: OnceNodeState,
      ): NodeDefinition | GraphNode {
        const { currentValue } = state;
        return currentValue;
      },
      onSubscribe(node: OnceNode): void {
        const { target } = node.definition.properties;
        this.setState((prevState) => ({
          ...prevState,
          currentValue: resolve(
            [isGraphNode(target) || isNodeDefinition(target) ? { target } : target],
            ([result]: [GraphNode]) => {
              this.setState(
                (state: OnceNodeState): OnceNodeState => ({
                  ...state,
                  currentValue: result,
                }),
              );
              return result;
            },
          ),
        }));
      },
    },
  },
});

/**
 * Creates a new instance of a [[once]], which is a type of a [[GraphNode]] that causes a given operation to be
 * performed only once. Used by the [[call]] node to prevent action from re-triggering every time a dependency is changed.
 *
 *
 * @example **Compute the value only once**
 * ```ts
 * import muster, { computed, once, ref, set, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 *   greeting: computed([once(ref('name'))], (name) => `Hello, ${name}`),
 * });
 *
 * app.resolve(ref('greeting')).subscribe((greeting) => {
 *   console.log(greeting);
 * });
 *
 * console.log('Changing name to Jane');
 * await app.resolve(set('name', 'Jane'));
 *
 * // Console output:
 * // Hello, Bob
 * // Changing name to Jane
 * ```
 * This example shows how to use the [[once]] to ensure the value of a [[computed]] gets
 * computed only once and doesn't change when the `name` changes.
 */
export function once(target: NodeDefinition | GraphNode | NodeDependency): OnceNodeDefinition {
  return createNodeDefinition(OnceNodeType, {
    target,
  });
}

export function isOnceNodeDefinition(value: NodeDefinition): value is OnceNodeDefinition {
  return value.type === OnceNodeType;
}
