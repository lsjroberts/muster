import {
  DisposeCallback,
  SerializedGraphOperation,
  SerializedNodeType,
  SerializedStore,
} from '@dws/muster';
import * as React from 'react';
import { TreeState } from '../../types/tree-node';
import { GraphTreeEdge, GraphTreeHelpers, GraphTreeNode } from '../../utils/parse-graph-tree';
import GenericNodeRenderer from '../components/graph-view/tree/generic-node-renderer';
import GenericOperationRenderer from '../components/graph-view/tree/generic-operation-renderer';

export default function createGraphHelpers(
  store: SerializedStore | undefined,
  options: {
    nodes: {
      [key: string]: (node: GraphTreeNode, helpers: GraphTreeHelpers) => JSX.Element;
    };
    operations: {
      [key: string]: (edge: GraphTreeEdge, helpers: GraphTreeHelpers) => JSX.Element;
    };
    subscribe: (path: Array<SerializedGraphOperation>) => DisposeCallback;
  },
): GraphTreeHelpers {
  const { nodes, operations, subscribe } = options;
  const nodeState = new WeakMap<GraphTreeNode | GraphTreeEdge, TreeState>();
  return {
    renderNode,
    renderEdge,
    getState,
    setState,
    subscribe,
    getNodeType,
  };

  function getNodeType(name: string): SerializedNodeType | undefined {
    if (!store) return undefined;
    return store.nodeTypes[name];
  }

  function renderNode(node: GraphTreeNode, helpers: GraphTreeHelpers): JSX.Element {
    const customRenderer = nodes[node.value.definition.$type];
    if (customRenderer) {
      return customRenderer(node, helpers);
    }
    return React.createElement(GenericNodeRenderer, { node, helpers });
  }

  function renderEdge(edge: GraphTreeEdge, helpers: GraphTreeHelpers): JSX.Element {
    const customRenderer = operations[edge.value.$operation];
    if (customRenderer) {
      return customRenderer(edge, helpers);
    }
    return React.createElement(GenericOperationRenderer, { edge, helpers });
  }

  function isTreeStateUpdateFunction<S extends TreeState>(
    value: S | ((previous: S) => S),
  ): value is ((previous: S) => S) {
    return typeof value === 'function';
  }

  function getState<S extends TreeState>(node: GraphTreeNode | GraphTreeEdge): S {
    return (nodeState.get(node) || {}) as S;
  }

  function setState<S extends TreeState>(
    node: GraphTreeNode | GraphTreeEdge,
    update: S | ((previous: S) => S),
  ): S {
    const updated = isTreeStateUpdateFunction(update) ? update(getState(node)) : update;
    nodeState.set(node, updated);
    return updated;
  }
}
