import classnames from 'classnames';
import * as React from 'react';

import './node-renderer.css';

export interface NodeRendererProps {
  className?: string;
  label: React.ReactNode;
  children?: React.ReactNode | undefined;
  onClick?: () => void;
}

// tslint:disable-next-line:function-name
export default class NodeRenderer extends React.PureComponent<NodeRendererProps> {
  render(): JSX.Element {
    const { className, label, children, onClick } = this.props;
    return (
      <div className={classnames('NodeRenderer__root', className)}>
        <div className="NodeRenderer__label" onClick={onClick}>
          {label}
        </div>
        {children &&
          (!Array.isArray(children) || children.length > 0) && (
            <div className="NodeRenderer__edges">{children}</div>
          )}
      </div>
    );
  }
}
