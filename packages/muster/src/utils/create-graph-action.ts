import {
  DynamicGraphAction,
  DynamicGraphNode,
  DynamicNodeType,
  GRAPH_ACTION,
  GraphAction,
  GraphOperation,
  NodeData,
  NodeName,
  NodeProperties,
  NodeState,
  OperationName,
  SerializedNodeProperties,
  StaticGraphAction,
  StaticGraphNode,
  StaticNodeType,
} from '../types/graph';

export default function createGraphAction<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  V extends SerializedNodeProperties = P,
  N extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>
>(node: StaticGraphNode<T, P, V, N>, operation: GraphOperation): StaticGraphAction<T, P, V, N>;
export default function createGraphAction<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends DynamicNodeType<T, P, S, D, V> = DynamicNodeType<T, P, S, D, V, M, O>
>(
  node: DynamicGraphNode<T, P, S, D, V, M, O, N>,
  operation: GraphOperation,
): DynamicGraphAction<T, P, S, D, V, M, O, N>;
export default function createGraphAction<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N1 extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>,
  N2 extends DynamicNodeType<T, P, S, D, V> = DynamicNodeType<T, P, S, D, V, M, O>
>(
  node: StaticGraphNode<T, P, V, N1> | DynamicGraphNode<T, P, S, D, V, M, O, N2>,
  operation: GraphOperation,
): GraphAction<T, P, S, D, V, M, O, N1, N2>;
export default function createGraphAction<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P,
  M extends OperationName = OperationName,
  O extends GraphOperation<M> = GraphOperation<M>,
  N1 extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>,
  N2 extends DynamicNodeType<T, P, S, D, V> = DynamicNodeType<T, P, S, D, V, M, O>
>(
  node: StaticGraphNode<T, P, V, N1> | DynamicGraphNode<T, P, S, D, V, M, O, N2>,
  operation: GraphOperation,
): GraphAction<T, P, S, D, V, M, O, N1, N2> {
  return {
    [GRAPH_ACTION]: true,
    id: `${node.id}:${operation.id}`,
    node,
    operation,
  };
}
