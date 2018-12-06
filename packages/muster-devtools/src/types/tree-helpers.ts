import { DisposeCallback, SerializedGraphOperation } from '@dws/muster';
import { TreeEdge, TreeNode, TreeState } from './tree-node';

export interface TreeHelpers<T, K> {
  renderNode: (node: TreeNode<T, K>, helpers: TreeHelpers<T, K>) => JSX.Element;
  renderEdge: (edge: TreeEdge<T, K>, helpers: TreeHelpers<T, K>) => JSX.Element;
  setState<S extends TreeState>(
    node: TreeNode<T, K> | TreeEdge<T, K>,
    update: S | ((previous: S) => S),
  ): S;
  getState<S extends TreeState>(node: TreeNode<T, K> | TreeEdge<T, K>): S;
  subscribe: (path: Array<SerializedGraphOperation>) => DisposeCallback;
}
