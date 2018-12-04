import {
  GraphAction,
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../../types/graph';
import createGraphAction from '../../../utils/create-graph-action';
import createNodeDefinition from '../../../utils/create-node-definition';
import { createNodeType } from '../../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../../utils/get-invalid-type-error';
import * as graphTypes from '../../../utils/graph-types';
import { lengthOperation, supportsLengthOperation } from '../operations/length';

/**
 * An instance of the [[length]] node used as part of a [[ref]] node.
 * See the [[length]] documentation to find out more.
 */
export interface LengthNode extends StaticGraphNode<'length'> {}

/**
 * A definition of the [[length]] node used as part of a [[ref]] node.
 * See the [[length]] documentation to find out more.
 */
export interface LengthNodeDefinition extends StaticNodeDefinition<'length'> {}

/**
 * An implementation of the [[length]] node used as part of a [[ref]] node.
 * See the [[length]] documentation to find out more.
 */
export const LengthNodeType: StaticNodeType<'length'> = createNodeType<'length'>('length');

/**
 * An instance of the [[length]] node used to compute a length of a target node.
 * See the [[length]] documentation to find out more.
 */
export interface GetLengthNode extends StatelessGraphNode<'get-length', GetLengthNodeProperties> {}

/**
 * A definition of the [[length]] node used to compute a length of a target node.
 * See the [[length]] documentation to find out more.
 */
export interface GetLengthNodeDefinition
  extends StatelessNodeDefinition<'get-length', GetLengthNodeProperties> {}

export interface GetLengthNodeProperties {
  target: NodeDefinition;
}

/**
 * An implementation of the [[length]] node used to compute a length of a target node.
 * See the [[length]] documentation to find out more.
 */
export const GetLengthNodeType: StatelessNodeType<
  'get-length',
  GetLengthNodeProperties
> = createNodeType<'get-length', GetLengthNodeProperties>('get-length', {
  shape: {
    target: graphTypes.nodeDefinition,
  },
  operations: {
    evaluate: {
      getDependencies({ target }: GetLengthNodeProperties) {
        return [
          {
            target,
            until: {
              predicate: supportsLengthOperation,
              errorMessage(node: GraphNode) {
                return getInvalidTypeErrorMessage('Target node does not support length operation', {
                  received: node.definition,
                });
              },
            },
          },
        ];
      },
      run(node: GetLengthNode, operation: never, [target]: [GraphNode]): GraphAction {
        return createGraphAction(target, lengthOperation());
      },
    },
  },
});

const INSTANCE = createNodeDefinition(LengthNodeType, {});

/**
 * Creates a new instance of the [[length]] node. This node can be used as part of a [[ref]] node to get a length of a
 * collection, or as a standalone node which computes a length of a target collection
 *
 * @example **Get a length of a collection as part of a ref**
 * ```js
 * import muster, { length, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3],
 * });
 *
 * await app.resolve(ref('numbers', length())); // === 3
 * ```
 * This example shows how to use [[length]] node as part of a [[ref]] to get a length of a collection.
 *
 *
 * @example **Get a length of a target collection**
 * ```js
 * import muster, { length, ref } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3],
 * });
 *
 * await app.resolve(length(ref('numbers'))); // === 3
 * ```
 * This example shows how to get a length of a target collection by specifying a target of the `length()` node.
 */
export function length(): LengthNodeDefinition;
export function length(target: NodeDefinition): GetLengthNodeDefinition;
export function length(target?: NodeDefinition): LengthNodeDefinition | GetLengthNodeDefinition {
  if (!target) return INSTANCE;
  return createNodeDefinition(GetLengthNodeType, { target });
}

export function isLengthNodeDefinition(value: NodeDefinition): value is LengthNodeDefinition {
  return value.type === LengthNodeType;
}

export function isGetLengthNodeDefinition(value: NodeDefinition): value is GetLengthNodeDefinition {
  return value.type === GetLengthNodeType;
}
