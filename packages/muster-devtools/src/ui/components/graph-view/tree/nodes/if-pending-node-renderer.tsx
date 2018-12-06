import {
  IfPendingNode,
  IfPendingNodeProperties,
  SerializedGraphNode,
  SerializedNodeDefinition,
} from '@dws/muster';
import * as React from 'react';
import { GraphTreeHelpers, GraphTreeNode } from '../../../../../utils/parse-graph-tree';
import NodeLabelRenderer from '../node-label-renderer';
import NodeRenderer from '../node-renderer';

export type SerializedIfPendingNode = SerializedGraphNode<
  IfPendingNode['definition']['type']['name'],
  IfPendingNodeProperties
>;

export interface IfPendingNodeRendererProps {
  node: GraphTreeNode<SerializedIfPendingNode>;
  helpers: GraphTreeHelpers;
}

// tslint:disable-next-line:function-name
export default class IfPendingNodeRenderer extends React.PureComponent<IfPendingNodeRendererProps> {
  render(): JSX.Element {
    const { node, helpers } = this.props;
    const { renderNode, renderEdge } = helpers;
    const innerTreeNode: GraphTreeNode = {
      value: {
        // TODO: Calculate actual node ID
        id: `${node.value.id}:inner`,
        scope: node.value.scope,
        context: node.value.context,
        definition: (node.value.definition.data.target as any) as SerializedNodeDefinition,
      },
      edges: [],
      path: [],
    };
    return (
      <NodeRenderer
        label={
          <NodeLabelRenderer>
            {node.value.definition.$type}
            ($
            {node.value.definition.$type}({renderNode(innerTreeNode, helpers)}
            )))
          </NodeLabelRenderer>
        }
      >
        {node.edges.map((edge) => renderEdge(edge, helpers))}
      </NodeRenderer>
    );
  }
}
