import {
  ArrayNode,
  ArrayNodeProperties,
  getType,
  QuerySetResultNode,
  QuerySetResultNodeProperties,
  QuerySetResultNodeType,
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
import {
  isSerializedQuerySetGetChildOperationNodeDefinition,
  SerializedGetChildGraphOperation,
  SerializedQuerySetChild,
} from './query-set-node-renderer';

import './query-set-node-renderer.css';

export type SerializedArrayNodeDefinition = SerializedNodeDefinition<
  ArrayNode['definition']['type']['name'],
  ArrayNodeProperties & { items: Array<SerializedNodeDefinition> }
>;
export type SerializedQuerySetResultNode = SerializedGraphNode<
  QuerySetResultNode['definition']['type']['name'],
  QuerySetResultNodeProperties
>;
export function isSerializedQuerySetResultNode(
  value: SerializedGraphNode,
): value is SerializedQuerySetResultNode {
  return value.definition.$type === QuerySetResultNodeType.name;
}
export type SerializedQuerySetResultNodeDefinition = SerializedNodeDefinition<
  QuerySetResultNode['definition']['type']['name'],
  QuerySetResultNodeProperties
>;

export interface QuerySetResultNodeRendererProps {
  node: GraphTreeNode<SerializedQuerySetResultNode>;
  helpers: GraphTreeHelpers;
}

export interface QuerySetResultNodeRendererState {
  expanded: boolean;
}

// tslint:disable-next-line:function-name
export default class QuerySetResultNodeRenderer extends React.PureComponent<
  QuerySetResultNodeRendererProps,
  QuerySetResultNodeRendererState
> {
  constructor(props: QuerySetResultNodeRendererProps, context: {}) {
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
            className={classnames('QuerySetResultNodeRenderer__root', {
              QuerySetResultNodeRenderer: !expanded,
            })}
          >
            {getQuerySetResultNodeLabel(node.value, expanded, this.handleToggle)}
          </NodeLabelRenderer>
        }
      >
        {expanded
          ? getQuerySetResultNodeChildren(
              node.value,
              getQuerySetResultBranches(node.value),
              (node.value.definition.data.result as any) as SerializedArrayNodeDefinition,
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
      setState<QuerySetResultNodeRendererState>(
        node,
        (prevState): QuerySetResultNodeRendererState => ({
          ...prevState,
          expanded: !prevState.expanded,
        }),
      ),
    );
  };

  private getComponentState(
    props: QuerySetResultNodeRendererProps,
  ): QuerySetResultNodeRendererState {
    const { helpers } = props;
    const { getState } = helpers;
    const { expanded = false } = getState<QuerySetResultNodeRendererState>(props.node);
    return {
      expanded,
    };
  }
}

function getQuerySetResultNodeLabel(
  node: SerializedQuerySetResultNode,
  expanded?: boolean,
  onToggle?: () => void,
): React.ReactChild {
  const branches = getQuerySetResultBranches(node);
  if (branches.length === 0) {
    return 'querySet({})';
  }
  if (expanded) {
    return (
      <span className="QuerySetResultNodeRenderer__toggle" onClick={onToggle}>
        {'querySet({'}
      </span>
    );
  }
  return (
    <span className="QuerySetResultNodeRenderer__toggle" onClick={onToggle}>
      {'querySet({ … })'}
    </span>
  );
}

function getQuerySetResultBranches(
  node: SerializedQuerySetResultNode,
): Array<SerializedQuerySetChild> {
  return node.definition.data.queries as Array<any>;
}

function getQuerySetResultNodeChildren(
  root: SerializedQuerySetResultNode,
  children: Array<SerializedQuerySetChild>,
  results: SerializedArrayNodeDefinition,
  helpers: GraphTreeHelpers,
  onToggle?: () => void,
): React.ReactNode {
  if (children.length === 0) {
    return null;
  }
  const { renderNode } = helpers;
  const resultsByChild = new Map(
    children.map(
      (child, index): [SerializedQuerySetChild, SerializedNodeDefinition] => [
        child,
        results.data.items[index],
      ],
    ),
  );
  return [
    ...children.filter(isSerializedQuerySetGetChildOperationNodeDefinition).map((child, index) => {
      const result = resultsByChild.get(child)!;
      const childNode: GraphTreeNode = {
        value: {
          id: root.id,
          scope: root.scope,
          context: root.context,
          definition: result,
        },
        edges: [],
        path: [],
      };
      return (
        <OperationRenderer
          key={`branch:getChild:${index}`}
          className={'QuerySetResultNodeRenderer__unsubscribed'}
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
          <span className="QuerySetResultNodeRenderer__toggle" onClick={onToggle}>
            })
          </span>
        </NodeLabelRenderer>
      }
    />,
  ];
}
