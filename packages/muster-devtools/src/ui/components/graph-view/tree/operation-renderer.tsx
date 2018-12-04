import classnames from 'classnames';
import * as React from 'react';

import './operation-renderer.css';

export interface OperationRendererProps {
  className?: string;
  label?: React.ReactNode;
  children?: React.ReactNode;
}

// tslint:disable-next-line:function-name
export default class OperationRenderer extends React.PureComponent<OperationRendererProps> {
  render(): JSX.Element {
    const { className, label, children } = this.props;
    return (
      <div className={classnames('OperationRenderer__root', className)}>
        {label && <div className="OperationRenderer__label">{label}</div>}
        {children && <div className="OperationRenderer__target">{children}</div>}
      </div>
    );
  }
}
