import classnames from 'classnames';
import * as React from 'react';

import './node-label-renderer.css';

interface NodeLabelRendererProps {
  className?: string;
  children: React.ReactNode;
}

// tslint:disable-next-line:function-name
export default class NodeLabelRenderer extends React.PureComponent<NodeLabelRendererProps> {
  render(): JSX.Element {
    const { className, children } = this.props;
    return <code className={classnames('NodeLabelRenderer__root', className)}>{children}</code>;
  }
}
