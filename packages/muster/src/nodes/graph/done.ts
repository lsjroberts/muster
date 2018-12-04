import {
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { value } from './value';

/**
 * An instance of the [[done]] node.
 * See the [[done]] documentation to find out more.
 */
export interface DoneNode extends StaticGraphNode<'done', DoneNodeProperties> {}

/**
 * A definition of the [[done]] node.
 * See the [[done]] documentation to find out more.
 */
export interface DoneNodeDefinition extends StaticNodeDefinition<'done', DoneNodeProperties> {}

export interface DoneNodeProperties {
  value: NodeDefinition | GraphNode | undefined;
}

/**
 * An implementation of the [[done]] node.
 * See the [[done]] documentation to find out more.
 */
export const DoneNodeType: StaticNodeType<'done', DoneNodeProperties> = createNodeType<
  'done',
  DoneNodeProperties
>('done', {
  shape: {
    value: types.optional(
      types.oneOfType<NodeDefinition | GraphNode>([
        graphTypes.nodeDefinition,
        graphTypes.graphNode,
      ]),
    ),
  },
});

/**
 * Creates a new instance of the [[done]] node. This node is used by the reducer-based implementation of array transforms
 * to indicate that a given transform has finished emitting nodes, and that no more nodes will be emitted from it.
 */
export function done(finalValue: NodeDefinition | GraphNode): DoneNodeDefinition {
  return createNodeDefinition(DoneNodeType, {
    value:
      finalValue === undefined
        ? undefined
        : isNodeDefinition(finalValue) || isGraphNode(finalValue)
          ? finalValue
          : value(finalValue),
  });
}

export function isDoneNodeDefinition(value: NodeDefinition): value is DoneNodeDefinition {
  return value.type === DoneNodeType;
}
