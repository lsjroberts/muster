import { NodeType, StatefulNodeType, StatelessNodeType } from '../types/graph';

export default function isDynamicNodeType(
  nodeType: NodeType,
): nodeType is StatelessNodeType | StatefulNodeType {
  return Boolean((nodeType as StatelessNodeType | StatefulNodeType).operations);
}
