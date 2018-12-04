import constant from 'lodash/constant';
import {
  Dependency,
  GraphNode,
  GraphOperation,
  isGraphNode,
  NODE_TYPE,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import * as graphTypes from '../../utils/graph-types';
import * as hash from '../../utils/hash';
import * as types from '../../utils/types';

export interface TraverseNode extends StatelessGraphNode<'traverse', TraverseNodeProperties> {}

export interface TraverseNodeDefinition
  extends StatelessNodeDefinition<'traverse', TraverseNodeProperties> {}

export interface TraverseNodeProperties {
  root: NodeDefinition | GraphNode;
  operation: GraphOperation;
}

const TRAVERSE_NODE_SHAPE = {
  root: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
  operation: graphTypes.graphOperation,
};

export const TraverseNodeType: StatelessNodeType<'traverse', TraverseNodeProperties> = {
  [NODE_TYPE]: true,
  name: 'traverse',
  shape: types.shape(TRAVERSE_NODE_SHAPE),
  is(value: GraphNode): value is TraverseNode {
    return isGraphNode(value) && value.definition.type === TraverseNodeType;
  },
  hash: hash.shape(TRAVERSE_NODE_SHAPE),
  serialize: false as false,
  deserialize: false as false,
  operations: {
    evaluate: {
      cacheable: true,
      getDependencies(definition: TraverseNodeDefinition): Array<Dependency> {
        const { root, operation } = definition.properties;
        return [
          {
            target: root,
            operation,
            allowErrors: true,
            allowPending: true,
            invalidate: true,
          },
        ];
      },
      getContextDependencies: constant([]),
      run(
        node: TraverseNode,
        operation: GraphOperation,
        dependencies: Array<GraphNode>,
      ): GraphNode {
        return dependencies[0];
      },
    },
  },
};

export function traverse(
  root: TraverseNodeProperties['root'],
  operation: TraverseNodeProperties['operation'],
): TraverseNodeDefinition {
  return createNodeDefinition(TraverseNodeType, {
    root,
    operation,
  });
}

export function isTraverseNodeDefinition(value: NodeDefinition): value is TraverseNodeDefinition {
  return value.type === TraverseNodeType;
}
