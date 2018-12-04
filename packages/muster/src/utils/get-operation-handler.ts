import { GraphNode, GraphOperation, OperationHandler } from '../types/graph';
import isDynamicNodeType from './is-dynamic-node-type';

export default function getOperationHandler(
  node: GraphNode,
  operation: GraphOperation,
): OperationHandler | undefined {
  const nodeType = node.definition.type;
  return isDynamicNodeType(nodeType) ? nodeType.operations[operation.type.name] : undefined;
}
