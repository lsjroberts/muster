import { IdentityOperationType } from '../operations/identity';
import { ResolveOperationType } from '../operations/resolve';
import {
  DynamicGraphNode,
  DynamicNodeDefinition,
  DynamicNodeType,
  GraphNode,
  GraphOperation,
  isGraphNode,
  NodeData,
  NodeDefinition,
  NodeName,
  NodeProperties,
  NodeState,
  OperationName,
  SerializedNodeProperties,
} from '../types/graph';
import { isDynamicNode } from './is-dynamic-node';
import { WILDCARD_OPERATION } from './wildcard-operation';

export default function supportsOperationType<T extends OperationName>(
  type: OperationName,
  node: NodeDefinition,
): node is DynamicNodeDefinition<
  NodeName,
  NodeProperties,
  NodeState,
  NodeData,
  SerializedNodeProperties,
  OperationName,
  GraphOperation<OperationName>,
  DynamicNodeType<NodeName, NodeProperties, NodeState, NodeData, SerializedNodeProperties, T>
>;
export default function supportsOperationType<T extends OperationName>(
  type: OperationName,
  node: GraphNode,
): node is DynamicGraphNode<
  NodeName,
  NodeProperties,
  NodeState,
  NodeData,
  SerializedNodeProperties,
  OperationName,
  GraphOperation<OperationName>,
  DynamicNodeType<NodeName, NodeProperties, NodeState, NodeData, SerializedNodeProperties, T>
>;
export default function supportsOperationType<T extends OperationName>(
  type: OperationName,
  node: NodeDefinition | GraphNode,
): node is
  | DynamicNodeDefinition<
      NodeName,
      NodeProperties,
      NodeState,
      NodeData,
      SerializedNodeProperties,
      OperationName,
      GraphOperation<OperationName>,
      DynamicNodeType<NodeName, NodeProperties, NodeState, NodeData, SerializedNodeProperties, T>
    >
  | DynamicGraphNode<
      NodeName,
      NodeProperties,
      NodeState,
      NodeData,
      SerializedNodeProperties,
      OperationName,
      GraphOperation<OperationName>,
      DynamicNodeType<NodeName, NodeProperties, NodeState, NodeData, SerializedNodeProperties, T>
    >;
export default function supportsOperationType<T extends OperationName>(
  type: OperationName,
  node: NodeDefinition | GraphNode,
): node is
  | DynamicNodeDefinition<
      NodeName,
      NodeProperties,
      NodeState,
      NodeData,
      SerializedNodeProperties,
      OperationName,
      GraphOperation<OperationName>,
      DynamicNodeType<NodeName, NodeProperties, NodeState, NodeData, SerializedNodeProperties, T>
    >
  | DynamicGraphNode<
      NodeName,
      NodeProperties,
      NodeState,
      NodeData,
      SerializedNodeProperties,
      OperationName,
      GraphOperation<OperationName>,
      DynamicNodeType<NodeName, NodeProperties, NodeState, NodeData, SerializedNodeProperties, T>
    > {
  // TODO: Extract this check when the `identity` and `resolve` operations get extracted from the store.
  if (type === IdentityOperationType.name || type === ResolveOperationType.name) return true;
  if (!isDynamicNode(node)) {
    return false;
  }
  const nodeType = isGraphNode(node) ? node.definition.type : node.type;
  return type in nodeType.operations || WILDCARD_OPERATION in nodeType.operations;
}
