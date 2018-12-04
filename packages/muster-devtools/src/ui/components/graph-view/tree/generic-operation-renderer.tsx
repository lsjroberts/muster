import * as React from 'react';

import { GraphTreeEdge, GraphTreeHelpers } from '../../../../utils/parse-graph-tree';
import OperationLabelRenderer from './operation-label-renderer';
import OperationRenderer from './operation-renderer';

export interface GenericOperationRendererProps {
  edge: GraphTreeEdge;
  helpers: GraphTreeHelpers;
}

export interface GenericOperationRendererState {
  expanded: boolean;
}

// tslint:disable-next-line:function-name
export default class GenericOperationRenderer extends React.PureComponent<
  GenericOperationRendererProps
> {
  render(): JSX.Element {
    const { edge, helpers } = this.props;
    return (
      <OperationRenderer
        label={<OperationLabelRenderer>{edge.value.$operation} ➡ </OperationLabelRenderer>}
      >
        {helpers.renderNode(edge.target, helpers)}
      </OperationRenderer>
    );
  }
}
