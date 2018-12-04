import {
  GetChildOperation,
  GetChildOperationType,
  GetChildProperties,
  getType,
  SerializedGraphOperation,
} from '@dws/muster';
import * as React from 'react';

import { GraphTreeEdge, GraphTreeHelpers } from '../../../../../utils/parse-graph-tree';
import OperationLabelRenderer from '../operation-label-renderer';
import OperationRenderer from '../operation-renderer';

export type SerializedGetChildOperation = SerializedGraphOperation<
  GetChildOperation['type']['name'],
  GetChildProperties
>;
export function isSerializedGetChildOperation(
  value: SerializedGraphOperation,
): value is SerializedGetChildOperation {
  return value.$operation === GetChildOperationType.name;
}

interface GetChildRendererProps {
  edge: GraphTreeEdge<SerializedGetChildOperation>;
  helpers: GraphTreeHelpers;
}

// tslint:disable-next-line:function-name
export default class GetChildRenderer extends React.PureComponent<GetChildRendererProps> {
  render(): JSX.Element {
    const { edge, helpers } = this.props;
    const { renderNode } = helpers;
    return (
      <OperationRenderer
        label={<OperationLabelRenderer>{getType(edge.value.data.key)}: </OperationLabelRenderer>}
      >
        {renderNode(edge.target, helpers)}
      </OperationRenderer>
    );
  }
}
