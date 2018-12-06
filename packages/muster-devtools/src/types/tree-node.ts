import { SerializedGraphOperation } from '@dws/muster';

export interface TreeNode<T, K> {
  value: T;
  edges: Array<TreeEdge<T, K>>;
  path: Array<SerializedGraphOperation>;
}

export interface TreeEdge<T, K> {
  value: K;
  target: TreeNode<T, K>;
}

export type TreeState<T extends {} = {}> = T;
