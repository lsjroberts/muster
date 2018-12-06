import { NodeType, StatefulNodeType } from '../types/graph';

export default function isStatefulNodeType(nodeType: NodeType): nodeType is StatefulNodeType {
  return Boolean((nodeType as StatefulNodeType).state);
}
