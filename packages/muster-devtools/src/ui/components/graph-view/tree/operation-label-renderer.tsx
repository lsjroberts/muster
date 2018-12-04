import * as React from 'react';

import './operation-label-renderer.css';

interface OperationLabelRendererProps {
  children?: React.ReactNode;
}
// tslint:disable-next-line:function-name
export default class OperationLabelRenderer extends React.PureComponent<
  OperationLabelRendererProps
> {
  render(): JSX.Element {
    const { children } = this.props;
    return <code className="OperationLabelRenderer__root">{children}</code>;
  }
}
