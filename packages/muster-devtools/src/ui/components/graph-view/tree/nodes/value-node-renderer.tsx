import { getType, SerializedGraphNode, ValueNode, ValueNodeProperties } from '@dws/muster';
import * as React from 'react';
import { GraphTreeNode } from '../../../../../utils/parse-graph-tree';
import NodeLabelRenderer from '../node-label-renderer';
import NodeRenderer from '../node-renderer';

export type SerializedValueNode<T> = SerializedGraphNode<
  ValueNode<T>['definition']['type']['name'],
  ValueNodeProperties<T>
>;

export interface ValueNodeRendererProps<T> {
  node: GraphTreeNode<SerializedValueNode<T>>;
}

// tslint:disable-next-line:function-name
export default class ValueNodeRenderer<T> extends React.PureComponent<ValueNodeRendererProps<T>> {
  render(): JSX.Element {
    const { node } = this.props;
    return (
      <NodeRenderer
        label={<NodeLabelRenderer>{getType(node.value.definition.data.value)} </NodeLabelRenderer>}
      />
    );
  }
}
