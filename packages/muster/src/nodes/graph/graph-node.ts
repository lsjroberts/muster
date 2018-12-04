import {
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';

/**
 * An instance of the [[graphNode]] node.
 * See the [[graphNode]] documentation to learn more.
 */
export interface GraphNodeNode extends StatelessGraphNode<'graphNode', GraphNodeNodeProperties> {}

/**
 * A definition of the [[graphNode]] node.
 * See the [[graphNode]] documentation to learn more.
 */
export interface GraphNodeNodeDefinition
  extends StatelessNodeDefinition<'graphNode', GraphNodeNodeProperties> {}

export interface GraphNodeNodeProperties {
  value: GraphNode;
}

/**
 * The implementation of the [[graphNode]].
 * See the [[graphNode]] documentation to learn more.
 */
export const GraphNodeNodeType: StatelessNodeType<
  'graphNode',
  GraphNodeNodeProperties
> = createNodeType<'graphNode', GraphNodeNodeProperties>('graphNode', {
  deserialize: false,
  serialize: false,
  shape: {
    value: graphTypes.graphNode,
  },
  operations: {
    evaluate: {
      run(node: GraphNodeNode): GraphNode {
        return node.definition.properties.value;
      },
    },
  },
});

/**
 * Creates an instance of the [[graphNode]]. This node can be used to convert a [[GraphNode]] to a
 * [[NodeDefinition]] without losing the correct scope and context.
 */
export function graphNode(value: GraphNode): GraphNodeNodeDefinition {
  return createNodeDefinition(GraphNodeNodeType, {
    value,
  });
}

export function isGraphNodeNodeDefinition(value: NodeDefinition): value is GraphNodeNodeDefinition {
  return value.type === GraphNodeNodeType;
}
