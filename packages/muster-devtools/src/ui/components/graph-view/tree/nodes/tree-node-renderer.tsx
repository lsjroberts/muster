import {
  BranchDefinition,
  ChildKey,
  deserializeMusterType,
  getChildOperation,
  getMusterNodeTypesMap,
  getMusterOperationTypesMap,
  getType,
  isSerializedMusterType,
  resolveOperation,
  sanitize,
  SerializedGraphNode,
  SerializedGraphOperation,
  SerializedNodeDefinition,
  SerializedTreeNodeProperties,
  TreeNode,
  TreeNodeProperties,
  TreeNodeType,
} from '@dws/muster';
import classnames from 'classnames';
import * as React from 'react';
import { GraphTreeHelpers, GraphTreeNode } from '../../../../../utils/parse-graph-tree';
import GraphInput from '../../graph-input';
import NodeLabelRenderer from '../node-label-renderer';
import NodeRenderer from '../node-renderer';
import OperationLabelRenderer from '../operation-label-renderer';
import OperationRenderer from '../operation-renderer';
import { isSerializedGetChildOperation } from '../operations/get-child-renderer';

import './tree-node-renderer.css';

export type SerializedTreeNode = SerializedGraphNode<
  TreeNode['definition']['type']['name'],
  TreeNodeProperties,
  SerializedTreeNodeProperties
>;
export function isSerializedTreeNode(value: SerializedGraphNode): value is SerializedTreeNode {
  return value.definition.$type === TreeNodeType.name;
}

export interface TreeNodeRendererProps {
  node: GraphTreeNode<SerializedTreeNode>;
  helpers: GraphTreeHelpers;
}

export interface TreeNodeRendererState {
  expanded: boolean;
}

// tslint:disable-next-line:function-name
export default class TreeNodeRenderer extends React.PureComponent<
  TreeNodeRendererProps,
  TreeNodeRendererState
> {
  constructor(props: TreeNodeRendererProps, context: {}) {
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
            className={classnames('TreeNodeRenderer__root', {
              'TreeNodeRenderer--collapsed': !expanded,
            })}
          >
            {getTreeNodeLabel(node.value, expanded, this.handleToggle)}
          </NodeLabelRenderer>
        }
      >
        {expanded ? getTreeNodeChildren(node, helpers, this.handleToggle) : null}
      </NodeRenderer>
    );
  }

  private handleToggle = () => {
    const { node, helpers } = this.props;
    const { setState } = helpers;
    this.setState(
      setState<TreeNodeRendererState>(
        node,
        (prevState): TreeNodeRendererState => ({
          ...prevState,
          expanded: !prevState.expanded,
        }),
      ),
    );
  };

  private getComponentState(props: TreeNodeRendererProps): TreeNodeRendererState {
    const { helpers } = props;
    const { getState } = helpers;
    const { expanded = false } = getState<TreeNodeRendererState>(props.node);
    return {
      expanded,
    };
  }
}

function getTreeNodeLabel(
  node: SerializedTreeNode,
  expanded?: boolean,
  onToggle?: () => void,
): React.ReactChild {
  if (node.definition.data.branches.length === 0) {
    return 'tree({})';
  }
  if (expanded) {
    return (
      <span className="TreeNodeRenderer__toggle" onClick={onToggle}>
        {'tree({'}
      </span>
    );
  }
  return (
    <span className="TreeNodeRenderer__toggle" onClick={onToggle}>
      {'tree({ … })'}
    </span>
  );
}

function getTreeNodeChildren(
  node: GraphTreeNode<SerializedTreeNode>,
  helpers: GraphTreeHelpers,
  onToggle?: () => void,
): React.ReactNode {
  const branches = node.value.definition.data.branches;
  if (branches.length === 0) {
    return null;
  }
  const { renderNode, renderEdge, subscribe } = helpers;
  const operations = node.edges.map(({ value }) => value);
  return [
    ...node.edges.map((edge) =>
      isSerializedGetChildOperation(edge.value) ? (
        <OperationRenderer
          key={`edge:${edge.value.id}`}
          label={<OperationLabelRenderer>{getType(edge.value.data.key)}: </OperationLabelRenderer>}
        >
          {renderNode(edge.target, helpers)}
        </OperationRenderer>
      ) : (
        <React.Fragment key={`edge:${edge.value.id}`}>{renderEdge(edge, helpers)}</React.Fragment>
      ),
    ),
    ...getUnsubscribedBranches(branches, operations).map(({ branch, index }) => {
      const childNode: GraphTreeNode = {
        value: {
          id: node.value.id,
          scope: node.value.scope,
          context: node.value.context,
          definition: (branch.node as any) as SerializedNodeDefinition,
        },
        edges: [],
        path: [...node.path, sanitize(getChildOperation(branch.match))],
      };
      return (
        <OperationRenderer
          key={`branch:${index}`}
          className={'TreeNodeRenderer__unsubscribed'}
          label={<OperationLabelRenderer>{getType(branch.match)}: </OperationLabelRenderer>}
        >
          {renderNode(childNode, helpers)}
        </OperationRenderer>
      );
    }),
    ...getDynamicBranches(branches, operations).map(({ branch, index }) => (
      <OperationRenderer
        key={`matcher:${index}`}
        label={
          <GraphInput
            shape={branch.match}
            onSubmit={(value: ChildKey) =>
              subscribe([
                ...node.path,
                sanitize(getChildOperation(value)),
                sanitize(resolveOperation()),
              ])
            }
          />
        }
      />
    )),
    <OperationRenderer
      key="close"
      label={
        <NodeLabelRenderer>
          <span className="TreeNodeRenderer__toggle" onClick={onToggle}>
            })
          </span>
        </NodeLabelRenderer>
      }
    />,
  ];
}

function getUnsubscribedBranches(
  branches: Array<BranchDefinition>,
  operations: Array<SerializedGraphOperation>,
): Array<{ branch: BranchDefinition; index: number }> {
  const subscribedBranches = new Set(
    operations.filter(isSerializedGetChildOperation).map((operation) => operation.data.key),
  );
  return branches
    .map((branch, index) => ({ branch, index }))
    .filter(
      ({ branch }) =>
        !isSerializedMusterType(branch.match) && !subscribedBranches.has(branch.match),
    );
}

function getDynamicBranches(
  branches: Array<BranchDefinition>,
  operations: Array<SerializedGraphOperation>,
): Array<{ branch: BranchDefinition; index: number }> {
  const nodeTypes = getMusterNodeTypesMap();
  const operationTypes = getMusterOperationTypesMap();
  return branches
    .map((branch, index) => ({ branch, index }))
    .filter(({ branch }) => isSerializedMusterType(branch.match))
    .map(({ branch, index }) => ({
      branch: {
        ...branch,
        match: deserializeMusterType(nodeTypes, operationTypes, branch.match),
      },
      index,
    }));
}
