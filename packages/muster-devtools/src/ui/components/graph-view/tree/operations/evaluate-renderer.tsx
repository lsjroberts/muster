import { EvaluateOperation, EvaluateOperationType, SerializedGraphOperation } from '@dws/muster';
import * as React from 'react';

import {
  GraphTreeEdge,
  GraphTreeHelpers,
  GraphTreeNode,
} from '../../../../../utils/parse-graph-tree';
import OperationLabelRenderer from '../operation-label-renderer';
import OperationRenderer from '../operation-renderer';

import './evaluate-renderer.css';

export type SerializedEvaluateOperation = SerializedGraphOperation<
  EvaluateOperation['type']['name']
>;
export function isSerializedEvaluateOperation(
  value: SerializedGraphOperation,
): value is SerializedEvaluateOperation {
  return value.$operation === EvaluateOperationType.name;
}

export interface EvaluateRendererProps {
  edge: GraphTreeEdge<SerializedEvaluateOperation>;
  helpers: GraphTreeHelpers;
}

export interface EvaluateRendererState {
  expanded: boolean;
}

// tslint:disable-next-line:function-name
export default class EvaluateRenderer extends React.PureComponent<
  EvaluateRendererProps,
  EvaluateRendererState
> {
  constructor(props: EvaluateRendererProps, context: {}) {
    super(props, context);
    this.state = this.getComponentState(props);
  }

  public render(): JSX.Element {
    const { edge, helpers } = this.props;
    const { expanded } = this.state;
    const { renderNode } = helpers;
    const isResolveChain = getIsResolveChain(edge);
    return (
      <OperationRenderer
        label={
          <OperationLabelRenderer>
            {edge.value.$operation}
            {isResolveChain ? <Toggle expanded={expanded} onToggle={this.handleToggle} /> : ' '}
            {'➡ '}
          </OperationLabelRenderer>
        }
      >
        {renderNode(getTarget(edge, expanded), helpers)}
      </OperationRenderer>
    );
  }

  private handleToggle = (): void => {
    const { edge, helpers } = this.props;
    const { setState } = helpers;
    this.setState(
      setState<EvaluateRendererState>(
        edge,
        (prevState): EvaluateRendererState => ({
          ...prevState,
          expanded: !prevState.expanded,
        }),
      ),
    );
  };

  private getComponentState(props: EvaluateRendererProps): EvaluateRendererState {
    const { helpers } = props;
    const { getState } = helpers;
    const { expanded = false } = getState<EvaluateRendererState>(props.edge);
    return {
      expanded,
    };
  }
}

interface ToggleProps {
  expanded?: boolean;
  onToggle?: () => void;
}

// tslint:disable-next-line:function-name
function Toggle(props: ToggleProps): JSX.Element {
  const { expanded, onToggle } = props;
  return (
    <span
      className="EvaluateRenderer__toggle"
      title={expanded ? 'Hide intermediate names' : 'Show intermediate nodes'}
      onClick={onToggle}
    >
      {expanded ? '▼' : '▶'}
    </span>
  );
}

function getTarget(
  edge: GraphTreeEdge<SerializedEvaluateOperation>,
  expanded: boolean,
): GraphTreeNode {
  const target = edge.target;
  if (expanded || target.edges.length !== 1) {
    return target;
  }
  const next = target.edges[0];
  return isSerializedEvaluateEdge(next) ? getTarget(next, expanded) : target;
}

function isSerializedEvaluateEdge(
  edge: GraphTreeEdge,
): edge is GraphTreeEdge<SerializedEvaluateOperation> {
  return isSerializedEvaluateOperation(edge.value);
}

function getIsResolveChain(edge: GraphTreeEdge<SerializedEvaluateOperation>) {
  return (
    edge.target.edges.length === 1 &&
    edge.target.edges.every(({ value }) => isSerializedEvaluateOperation(value))
  );
}
