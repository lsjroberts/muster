import {
  ArrayNode,
  ArrayNodeProperties,
  ArrayNodeType,
  SerializedGraphNode,
  SerializedNodeDefinition,
} from '@dws/muster';
import classnames from 'classnames';
import * as React from 'react';

import { GraphTreeHelpers, GraphTreeNode } from '../../../../../utils/parse-graph-tree';
import NodeLabelRenderer from '../node-label-renderer';
import NodeRenderer from '../node-renderer';
import OperationLabelRenderer from '../operation-label-renderer';
import OperationRenderer from '../operation-renderer';

import './array-node-renderer.css';

export type SerializedArrayNode = SerializedGraphNode<
  ArrayNode['definition']['type']['name'],
  ArrayNodeProperties
>;
export function isSerializedArrayNode(value: SerializedGraphNode): value is SerializedArrayNode {
  return value.definition.$type === ArrayNodeType.name;
}

export interface ArrayNodeRendererProps {
  node: GraphTreeNode<SerializedArrayNode>;
  helpers: GraphTreeHelpers;
}

export interface ArrayNodeRendererState {
  expanded: boolean;
}

// tslint:disable-next-line:function-name
export default class ArrayNodeRenderer extends React.PureComponent<
  ArrayNodeRendererProps,
  ArrayNodeRendererState
> {
  constructor(props: ArrayNodeRendererProps, context: {}) {
    super(props, context);
    this.state = this.getComponentState(props);
  }

  public render(): JSX.Element {
    const { node, helpers } = this.props;
    const { expanded } = this.state;
    return (
      <NodeRenderer
        label={
          <NodeLabelRenderer
            className={classnames('ArrayNodeRenderer__root', {
              'ArrayNodeRenderer--collapsed': !expanded,
            })}
          >
            {getArrayNodeLabel(node.value, expanded, this.handleToggle)}
          </NodeLabelRenderer>
        }
      >
        {expanded ? getArrayNodeChildren(node, helpers, this.handleToggle) : null}
      </NodeRenderer>
    );
  }

  private handleToggle = () => {
    const { node, helpers } = this.props;
    const { setState } = helpers;
    this.setState(
      setState<ArrayNodeRendererState>(
        node,
        (prevState): ArrayNodeRendererState => ({
          ...prevState,
          expanded: !prevState.expanded,
        }),
      ),
    );
  };

  private getComponentState(props: ArrayNodeRendererProps): ArrayNodeRendererState {
    const { helpers } = props;
    const { getState } = helpers;
    const { expanded = false } = getState<ArrayNodeRendererState>(props.node);
    return {
      expanded,
    };
  }
}

function getArrayNodeLabel(
  node: SerializedArrayNode,
  expanded?: boolean,
  onToggle?: () => void,
): React.ReactChild {
  const items = node.definition.data.items;
  if (items.length === 0) {
    return 'array([])';
  }
  if (expanded) {
    return (
      <span className="ArrayNodeRenderer__toggle" onClick={onToggle}>
        {'array(['}
      </span>
    );
  }
  return (
    <span className="ArrayNodeRenderer__toggle" onClick={onToggle}>
      {`array([ ${items.length === 1 ? '1 item' : `${items.length} items`} ])`}
    </span>
  );
}

function getArrayNodeChildren(
  node: GraphTreeNode<SerializedArrayNode>,
  helpers: GraphTreeHelpers,
  onToggle?: () => void,
): React.ReactNode {
  const items = node.value.definition.data.items;
  if (items.length === 0) {
    return null;
  }
  const { renderNode } = helpers;
  return [
    ...items.map((item, index, array) => {
      const childNode: GraphTreeNode = {
        value: {
          // TODO: Calculate actual node ID
          id: `${node.value.id}:${index}`,
          scope: node.value.scope,
          context: node.value.context,
          definition: (item as any) as SerializedNodeDefinition,
        },
        edges: [],
        path: [],
      };
      return (
        <OperationRenderer
          key={index}
          label={<OperationLabelRenderer>{index}: </OperationLabelRenderer>}
        >
          {renderNode(childNode, helpers)}
        </OperationRenderer>
      );
    }),
    <OperationRenderer
      key="close"
      label={
        <NodeLabelRenderer>
          <span className="ArrayNodeRenderer__toggle" onClick={onToggle}>
            ])
          </span>
        </NodeLabelRenderer>
      }
    />,
  ];
}
