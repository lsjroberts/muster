import {
  ArrayNodeType,
  QuerySetNodeType,
  QuerySetResultNodeType,
  TreeNodeType,
  ValueNodeType,
} from '@dws/muster';
import * as React from 'react';

import { GraphTreeHelpers, GraphTreeNode } from '../../../../utils/parse-graph-tree';
import ArrayNodeRenderer, { SerializedArrayNode } from './nodes/array-node-renderer';
import QuerySetNodeRenderer, { SerializedQuerySetNode } from './nodes/query-set-node-renderer';
import QuerySetResultNodeRenderer, {
  SerializedQuerySetResultNode,
} from './nodes/query-set-result-node-renderer';
import TreeNodeRenderer, { SerializedTreeNode } from './nodes/tree-node-renderer';
import ValueNodeRenderer, { SerializedValueNode } from './nodes/value-node-renderer';

const NODE_RENDERERS: {
  [key: string]: (node: GraphTreeNode, helpers: GraphTreeHelpers) => JSX.Element;
} = {
  [ArrayNodeType.name]: (node: GraphTreeNode<SerializedArrayNode>, helpers: GraphTreeHelpers) => (
    <ArrayNodeRenderer node={node} helpers={helpers} />
  ),
  [TreeNodeType.name]: (node: GraphTreeNode<SerializedTreeNode>, helpers: GraphTreeHelpers) => (
    <TreeNodeRenderer node={node} helpers={helpers} />
  ),
  [ValueNodeType.name]: (node: GraphTreeNode<SerializedValueNode<any>>) => (
    <ValueNodeRenderer node={node} />
  ),
  [QuerySetNodeType.name]: (
    node: GraphTreeNode<SerializedQuerySetNode>,
    helpers: GraphTreeHelpers,
  ) => <QuerySetNodeRenderer node={node} helpers={helpers} />,
  [QuerySetResultNodeType.name]: (
    node: GraphTreeNode<SerializedQuerySetResultNode>,
    helpers: GraphTreeHelpers,
  ) => <QuerySetResultNodeRenderer node={node} helpers={helpers} />,
};

export default NODE_RENDERERS;
