import classnames from 'classnames';
import * as React from 'react';
import { GraphTreeHelpers, GraphTreeNode } from '../../../utils/parse-graph-tree';

import './graph-view.css';

export interface GraphViewProps {
  className?: string;
  roots: Array<GraphTreeNode> | undefined;
  helpers: GraphTreeHelpers;
}

// tslint:disable-next-line:function-name
export class GraphView extends React.PureComponent<GraphViewProps> {
  public render(): JSX.Element {
    const { className, roots, helpers } = this.props;
    const { renderNode } = helpers;
    return (
      <div className={classnames('GraphView__root', className)}>
        {roots && roots.length > 0
          ? roots.map((root) => (
              <React.Fragment key={root.value.id}>{renderNode(root, helpers)}</React.Fragment>
            ))
          : 'Empty graph'}
      </div>
    );
  }
}
