import { EvaluateOperationType, resolveOperation, sanitize } from '@dws/muster';
import * as React from 'react';
import { GraphTreeHelpers, GraphTreeNode } from '../../../../utils/parse-graph-tree';
import NodeLabelRenderer from './node-label-renderer';
import NodeRenderer from './node-renderer';

export interface GenericNodeRendererProps {
  node: GraphTreeNode;
  helpers: GraphTreeHelpers;
}

// tslint:disable-next-line:function-name
export default class GenericNodeRenderer extends React.PureComponent<GenericNodeRendererProps> {
  public render(): JSX.Element {
    const { node, helpers } = this.props;
    const { renderEdge } = helpers;
    const nodeType = helpers.getNodeType(node.value.definition.$type);
    const shouldBeEvaluatedWhenClicked =
      node.edges.length === 0 &&
      nodeType &&
      nodeType.operations.includes(EvaluateOperationType.name);
    const evaluateNode = () => {
      helpers.subscribe([...node.path, sanitize(resolveOperation())]);
    };
    return (
      <NodeRenderer
        label={
          <NodeLabelRenderer>
            {node.value.definition.$type}
            ()
          </NodeLabelRenderer>
        }
        onClick={shouldBeEvaluatedWhenClicked ? evaluateNode : undefined}
      >
        {node.edges.map((edge) => (
          <React.Fragment key={edge.value.id}>{renderEdge(edge, helpers)}</React.Fragment>
        ))}
      </NodeRenderer>
    );
  }
}
