import {
  GetChildOperation,
  GetChildProperties,
  getType,
  QuerySetCallOperationNode,
  QuerySetCallOperationNodeProperties,
  QuerySetCallOperationNodeType,
  QuerySetGetChildOperationNode,
  QuerySetGetChildOperationNodeProperties,
  QuerySetGetChildOperationNodeType,
  QuerySetGetItemsOperationNode,
  QuerySetGetItemsOperationNodeProperties,
  QuerySetGetItemsOperationNodeType,
  QuerySetNode,
  QuerySetNodeProperties,
  QuerySetNodeType,
  QuerySetOperationNode,
  QuerySetOperationNodeProperties,
  QuerySetOperationNodeType,
  QuerySetSetOperationNode,
  QuerySetSetOperationNodeProperties,
  QuerySetSetOperationNodeType,
  SerializedGraphNode,
  SerializedGraphOperation,
  SerializedNodeDefinition,
} from '@dws/muster';
import classnames from 'classnames';
import * as React from 'react';

import { GraphTreeHelpers, GraphTreeNode } from '../../../../../utils/parse-graph-tree';
import NodeLabelRenderer from '../node-label-renderer';
import NodeRenderer from '../node-renderer';
import OperationLabelRenderer from '../operation-label-renderer';
import OperationRenderer from '../operation-renderer';

import './query-set-node-renderer.css';

export type SerializedGetChildGraphOperation = SerializedGraphOperation<
  GetChildOperation['type']['name'],
  GetChildProperties
>;

export type SerializedQuerySetChild =
  | SerializedQuerySetOperationNodeDefinition
  | SerializedQuerySetGetChildOperationNodeDefinition
  | SerializedQuerySetGetItemsOperationNodeDefinition
  | SerializedQuerySetCallOperationNodeDefinition
  | SerializedQuerySetSetOperationNodeDefinition;

export type SerializedQuerySetNode = SerializedGraphNode<
  QuerySetNode['definition']['type']['name'],
  QuerySetNodeProperties
>;
export function isSerializedQuerySetNode(
  value: SerializedGraphNode,
): value is SerializedQuerySetNode {
  return value.definition.$type === QuerySetNodeType.name;
}
export type SerializedQuerySetNodeDefinition = SerializedNodeDefinition<
  QuerySetNode['definition']['type']['name'],
  QuerySetNodeProperties
>;
export function isSerializedQuerySetNodeDefinition(
  value: SerializedNodeDefinition,
): value is SerializedQuerySetNodeDefinition {
  return value.$type === QuerySetNodeType.name;
}
export type SerializedQuerySetOperationNodeDefinition = SerializedNodeDefinition<
  QuerySetOperationNode['definition']['type']['name'],
  QuerySetOperationNodeProperties
>;
export function isSerializedQuerySetOperationNodeDefinition(
  value: SerializedNodeDefinition,
): value is SerializedQuerySetOperationNodeDefinition {
  return value.$type === QuerySetOperationNodeType.name;
}
export type SerializedQuerySetGetChildOperationNodeDefinition = SerializedNodeDefinition<
  QuerySetGetChildOperationNode['definition']['type']['name'],
  QuerySetGetChildOperationNodeProperties
>;
export function isSerializedQuerySetGetChildOperationNodeDefinition(
  value: SerializedNodeDefinition,
): value is SerializedQuerySetGetChildOperationNodeDefinition {
  return value.$type === QuerySetGetChildOperationNodeType.name;
}
export type SerializedQuerySetGetItemsOperationNodeDefinition = SerializedNodeDefinition<
  QuerySetGetItemsOperationNode['definition']['type']['name'],
  QuerySetGetItemsOperationNodeProperties
>;
export function isSerializedQuerySetGetItemsOperationNodeDefinition(
  value: SerializedNodeDefinition,
): value is SerializedQuerySetGetItemsOperationNodeDefinition {
  return value.$type === QuerySetGetItemsOperationNodeType.name;
}
export type SerializedQuerySetCallOperationNodeDefinition = SerializedNodeDefinition<
  QuerySetCallOperationNode['definition']['type']['name'],
  QuerySetCallOperationNodeProperties
>;
export function isSerializedQuerySetCallOperationNodeDefinition(
  value: SerializedNodeDefinition,
): value is SerializedQuerySetCallOperationNodeDefinition {
  return value.$type === QuerySetCallOperationNodeType.name;
}
export type SerializedQuerySetSetOperationNodeDefinition = SerializedNodeDefinition<
  QuerySetSetOperationNode['definition']['type']['name'],
  QuerySetSetOperationNodeProperties
>;
export function isSerializedQuerySetSetOperationNodeDefinition(
  value: SerializedNodeDefinition,
): value is SerializedQuerySetSetOperationNodeDefinition {
  return value.$type === QuerySetSetOperationNodeType.name;
}

export interface QuerySetNodeRendererProps {
  node: GraphTreeNode<SerializedQuerySetNode>;
  helpers: GraphTreeHelpers;
}

export interface QuerySetNodeRendererState {
  expanded: boolean;
}

// tslint:disable-next-line:function-name
export default class QuerySetNodeRenderer extends React.PureComponent<
  QuerySetNodeRendererProps,
  QuerySetNodeRendererState
> {
  constructor(props: QuerySetNodeRendererProps, context: {}) {
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
            className={classnames('QuerySetNodeRenderer__root', {
              QuerySetNodeRenderer: !expanded,
            })}
          >
            {getQuerySetNodeLabel(node.value, expanded, this.handleToggle)}
          </NodeLabelRenderer>
        }
      >
        {expanded
          ? getQuerySetNodeChildren(
              node.value,
              getQuerySetBranches(node.value),
              helpers,
              this.handleToggle,
            )
          : null}
      </NodeRenderer>
    );
  }

  private handleToggle = () => {
    const { node, helpers } = this.props;
    const { setState } = helpers;
    this.setState(
      setState<QuerySetNodeRendererState>(
        node,
        (prevState): QuerySetNodeRendererState => ({
          ...prevState,
          expanded: !prevState.expanded,
        }),
      ),
    );
  };

  private getComponentState(props: QuerySetNodeRendererProps): QuerySetNodeRendererState {
    const { helpers } = props;
    const { getState } = helpers;
    const { expanded = false } = getState<QuerySetNodeRendererState>(props.node);
    return {
      expanded,
    };
  }
}

function getQuerySetNodeLabel(
  node: SerializedQuerySetNode,
  expanded?: boolean,
  onToggle?: () => void,
): React.ReactChild {
  const branches = getQuerySetBranches(node);
  if (branches.length === 0) {
    return 'querySet({})';
  }
  if (expanded) {
    return (
      <span className="QuerySetNodeRenderer__toggle" onClick={onToggle}>
        {'querySet({'}
      </span>
    );
  }
  return (
    <span className="QuerySetNodeRenderer__toggle" onClick={onToggle}>
      {'querySet({ … })'}
    </span>
  );
}

function getQuerySetBranches(node: SerializedQuerySetNode): Array<SerializedQuerySetChild> {
  return node.definition.data.children as Array<any>;
}

function getQuerySetNodeChildren(
  root: SerializedQuerySetNode,
  children: Array<SerializedQuerySetChild>,
  helpers: GraphTreeHelpers,
  onToggle?: () => void,
): React.ReactNode {
  if (children.length === 0) {
    return null;
  }
  const { renderNode } = helpers;
  return [
    ...children.filter(isSerializedQuerySetGetChildOperationNodeDefinition).map((child, index) => {
      const childNode: GraphTreeNode = {
        value: {
          id: root.id,
          scope: root.scope,
          context: root.context,
          definition: (child.data.operation as any) as SerializedNodeDefinition,
        },
        edges: [],
        path: [],
      };
      return (
        <OperationRenderer
          key={`branch:getChild:${index}`}
          className={'QuerySetNodeRenderer__unsubscribed'}
          label={
            <OperationLabelRenderer>
              {getType(
                ((child.data.operation as any) as SerializedGetChildGraphOperation).data.key,
              )}
              :{' '}
            </OperationLabelRenderer>
          }
        >
          {renderNode(childNode, helpers)}
        </OperationRenderer>
      );
    }),
    <OperationRenderer
      key="close"
      label={
        <NodeLabelRenderer>
          <span className="QuerySetNodeRenderer__toggle" onClick={onToggle}>
            })
          </span>
        </NodeLabelRenderer>
      }
    />,
  ];
}
