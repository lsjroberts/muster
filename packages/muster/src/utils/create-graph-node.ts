import {
  Context,
  DynamicGraphNode,
  DynamicNodeDefinition,
  DynamicNodeType,
  GRAPH_NODE,
  GraphNode,
  GraphOperation,
  NodeData,
  NodeDefinition,
  NodeName,
  NodeProperties,
  NodeState,
  NodeType,
  OperationType,
  Scope,
  SerializedNodeProperties,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../types/graph';

export default function createGraphNode<
  T extends NodeName,
  P extends NodeProperties,
  V extends SerializedNodeProperties,
  N extends StaticNodeType<T, P, V> = StaticNodeType<T, P, V>
>(
  scope: Scope,
  context: Context,
  definition: StaticNodeDefinition<T, P, V, N>,
): StaticGraphNode<T, P, V, N>;
export default function createGraphNode<
  T extends NodeName,
  P extends NodeProperties,
  V extends SerializedNodeProperties,
  N extends StatelessNodeType<T, P, V> = StatelessNodeType<T, P, V>
>(
  scope: Scope,
  context: Context,
  definition: StatelessNodeDefinition<T, P, V, N>,
): StatelessGraphNode<T, P, V, N>;
export default function createGraphNode<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties,
  M extends OperationType['name'] = OperationType['name'],
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends StatefulNodeType<T, P, S, D, V, M, O> = StatefulNodeType<T, P, S, D, V, M, O>
>(
  scope: Scope,
  context: Context,
  definition: StatefulNodeDefinition<T, P, S, D, V, M, O, N>,
): StatefulGraphNode<T, P, S, D, V, M, O, N>;
export default function createGraphNode<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties,
  M extends OperationType['name'] = OperationType['name'],
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends DynamicNodeType<T, P, S, D, V, M, O> = DynamicNodeType<T, P, S, D, V, M, O>
>(
  scope: Scope,
  context: Context,
  definition: DynamicNodeDefinition<T, P, S, D, V, M, O, N>,
): DynamicGraphNode<T, P, S, D, V, M, O, N>;
export default function createGraphNode<
  T extends NodeName,
  P extends NodeProperties,
  S extends NodeState,
  D extends NodeData,
  V extends SerializedNodeProperties,
  M extends OperationType['name'] = OperationType['name'],
  O extends GraphOperation<M> = GraphOperation<M>,
  N extends NodeType<T, P, S, D, V, M, O> = NodeType<T, P, S, D, V, M, O>
>(
  scope: Scope,
  context: Context,
  definition: NodeDefinition<T, P, S, D, V, N>,
): GraphNode<T, P, S, D, V, N> {
  return {
    [GRAPH_NODE]: true,
    id: `${scope.id}:${context.id}:${definition.id}`,
    definition,
    scope,
    context,
  };
}
