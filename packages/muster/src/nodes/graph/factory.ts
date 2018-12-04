import flow from 'lodash/flow';
import {
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import { pending } from './pending';

/**
 * An instance of the [[factory]] node.
 * See the [[factory]] documentation to find out more.
 */
export interface FactoryNode extends StatefulGraphNode<'factory', FactoryNodeProperties> {}

/**
 * A definition of the [[factory]] node.
 * See the [[factory]] documentation to find out more.
 */
export interface FactoryNodeDefinition
  extends StatefulNodeDefinition<'factory', FactoryNodeProperties> {}

export interface FactoryNodeProperties {
  factory: () => NodeDefinition;
}

export interface FactoryNodeState {
  instance: NodeDefinition;
}

export interface FactoryNodeData {}

/**
 * The implementation of the [[factory]].
 * See the [[factory]] documentation to learn more.
 */
export const FactoryNodeType: StatefulNodeType<
  'factory',
  FactoryNodeProperties,
  FactoryNodeState,
  FactoryNodeData
> = createNodeType<'factory', FactoryNodeProperties, FactoryNodeState, FactoryNodeData>('factory', {
  state: {
    instance: graphTypes.nodeDefinition,
  },
  serialize: false,
  deserialize: false,
  shape: {
    factory: types.saveHash(types.func),
  },
  getInitialState(): FactoryNodeState {
    return {
      instance: pending(),
    };
  },
  operations: {
    evaluate: {
      run(
        node: FactoryNode,
        options: never,
        dependencies: Array<never>,
        contextDependencies: Array<never>,
        state: FactoryNodeState,
      ): NodeDefinition {
        const { instance } = state;
        return instance;
      },
      onSubscribe(
        this: NodeExecutionContext<FactoryNodeState, FactoryNodeData>,
        node: FactoryNode,
      ): void {
        const { factory } = node.definition.properties;
        this.setState({
          instance: factory(),
        });
      },
      onInvalidate(
        this: NodeExecutionContext<FactoryNodeState, FactoryNodeData>,
        node: FactoryNode,
      ): void {
        const { factory } = node.definition.properties;
        this.setState({
          instance: factory(),
        });
      },
      onUnsubscribe(
        this: NodeExecutionContext<FactoryNodeState, FactoryNodeData>,
        node: FactoryNode,
      ): void {
        this.setState({
          instance: pending(),
        });
      },
    },
  },
});

/**
 * Creates a new instance of a [[factory]] node, which is a A type of [[NodeDefinition]] used when there's a need
 * to delay the creation of a node. The [[factory]] creates the instance of the node only when the application tries
 * resolving the [[factory]].
 *
 *
 * @example **Using factory node**
 * ```js
 * import muster, { factory, ref, value } from '@dws/muster';
 *
 * const app = muster({
 *   name: factory(() => {
 *     console.log('Returning name');
 *     return value('Bob');
 *   }),
 * });
 *
 * console.log('Retrieving name');
 * const result = await app.resolve(ref('name'));
 * // result === 'Bob'
 *
 * // Console output:
 * // Retrieving name
 * // Returning name
 * ```
 * This example shows how to use the [[factory]] to delay the time of the creation of a
 * particular node/branch.
 */
export function factory(factory: () => NodeLike | NodeDefinition): FactoryNodeDefinition {
  return createNodeDefinition(FactoryNodeType, {
    factory: flow(
      factory,
      toNode,
    ),
  });
}

export function isFactoryNodeDefinition(value: NodeDefinition): value is FactoryNodeDefinition {
  return value.type === FactoryNodeType;
}
