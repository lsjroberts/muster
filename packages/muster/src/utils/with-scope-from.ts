import { GraphNode, NodeDefinition } from '../types/graph';
import createGraphNode from './create-graph-node';

export default function withScopeFrom(source: GraphNode, target: NodeDefinition): GraphNode {
  return createGraphNode(source.scope, source.context, target);
}
