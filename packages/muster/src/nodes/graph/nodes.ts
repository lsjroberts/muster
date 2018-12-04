import { NodeType } from '../../types/graph';
import { ActionNodeType } from './action';
import { ApplyNodeType } from './apply';
import { CallNodeType } from './call';
import { CatchErrorNodeType } from './catch-error';
import { CombineLatestNodeType } from './combine-latest';
import { ContextNodeType } from './context';
import { CreateBehaviorNodeType } from './create-behavior';
import { CreateCallerNodeType } from './create-caller';
import { CreateSetterNodeType } from './create-setter';
import { DebugNodeType } from './debug';
import { DeferNodeType } from './defer';
import { DispatchNodeType } from './dispatch';
import { DoneNodeType } from './done';
import { EntriesNodeType } from './entries';
import { ErrorNodeType } from './error';
import { ExtendNodeType } from './extend';
import { FactoryNodeType } from './factory';
import { FieldsNodeType } from './fields';
import { FlowNodeType } from './flow';
import { FnNodeType } from './fn';
import { FromPromiseNodeType } from './from-promise';
import { FromStreamNodeType } from './from-stream';
import { GetNodeType } from './get';
import { GraphNodeNodeType } from './graph-node';
import { IfErrorNodeType } from './if-error';
import { IfPendingNodeType } from './if-pending';
import { InjectDependenciesNodeType } from './inject-dependencies';
import { InvalidateNodeType } from './invalidate';
import { InvalidateOnNodeType } from './invalidate-on';
import { IsNilNodeType } from './is-nil';
import { IsPendingNodeType } from './is-pending';
import { IsUpdatingNodeType } from './is-updating';
import { IteratorResultNodeType } from './iterator-result';
import { KeyNodeType } from './key';
import { LegacyQueryNodeType } from './legacy-query';
import { LogNodeType } from './log';
import { NilNodeType } from './nil';
import { OkNodeType } from './ok';
import { OnNodeType } from './on';
import { OnceNodeType } from './once';
import { OptimisticNodeType } from './optimistic';
import { ParallelNodeType } from './parallel';
import { ParamNodeType } from './param';
import { ParentNodeType } from './parent';
import { PartialNodeType } from './partial';
import { PendingNodeType } from './pending';
import { PlaceholderNodeType } from './placeholder';
import { PropertyNodeType } from './property';
import { QueryNodeType } from './query';
import { QuerySetNodeType } from './query-set';
import { QuerySetCallOperationNodeType } from './query-set-call-operation';
import { QuerySetGetChildOperationNodeType } from './query-set-get-child-operation';
import { QuerySetGetItemsOperationNodeType } from './query-set-get-items-operation';
import { QuerySetOperationNodeType } from './query-set-operation';
import { QuerySetResultNodeType } from './query-set-result';
import { QuerySetSetOperationNodeType } from './query-set-set-operation';
import { ResetNodeType } from './reset';
import { ResolveNodeType } from './resolve';
import { RootNodeType } from './root';
import { ScopeNodeType } from './scope';
import { SeriesNodeType } from './series';
import { SetNodeType } from './set';
import { SetResultNodeType } from './set-result';
import { ExternalStatefulNodeType } from './stateful';
import { TakeLastNodeType } from './take-last';
import { TraverseNodeType } from './traverse';
import { TreeNodeType } from './tree';
import { UpdateNodeType } from './update';
import { ValueNodeType } from './value';
import { VariableNodeType } from './variable';
import { WithContextNodeType } from './with-context';
import { WithScopeNodeType } from './with-scope';
import { WithTransformsNodeType } from './with-transforms';

export const GraphNodeTypes: Array<NodeType> = [
  ActionNodeType,
  ApplyNodeType,
  CallNodeType,
  CatchErrorNodeType,
  CombineLatestNodeType,
  ContextNodeType,
  CreateCallerNodeType,
  CreateSetterNodeType,
  CreateBehaviorNodeType,
  DebugNodeType,
  DeferNodeType,
  DispatchNodeType,
  DoneNodeType,
  EntriesNodeType,
  ErrorNodeType,
  ExtendNodeType,
  FactoryNodeType,
  FieldsNodeType,
  ExternalStatefulNodeType,
  FlowNodeType,
  FnNodeType,
  FromPromiseNodeType,
  FromStreamNodeType,
  GetNodeType,
  GraphNodeNodeType,
  IfErrorNodeType,
  IfPendingNodeType,
  InvalidateNodeType,
  InvalidateOnNodeType,
  IsNilNodeType,
  IsPendingNodeType,
  IsUpdatingNodeType,
  IteratorResultNodeType,
  KeyNodeType,
  LegacyQueryNodeType,
  LogNodeType,
  NilNodeType,
  OkNodeType,
  OnNodeType,
  OnceNodeType,
  OptimisticNodeType,
  ParallelNodeType,
  ParamNodeType,
  ParentNodeType,
  InjectDependenciesNodeType,
  PartialNodeType,
  PendingNodeType,
  PlaceholderNodeType,
  PropertyNodeType,
  QueryNodeType,
  QuerySetNodeType,
  QuerySetCallOperationNodeType,
  QuerySetGetChildOperationNodeType,
  QuerySetGetItemsOperationNodeType,
  QuerySetOperationNodeType,
  QuerySetResultNodeType,
  QuerySetSetOperationNodeType,
  ResetNodeType,
  ResolveNodeType,
  RootNodeType,
  ScopeNodeType,
  SeriesNodeType,
  SetNodeType,
  SetResultNodeType,
  TakeLastNodeType,
  TraverseNodeType,
  TreeNodeType,
  UpdateNodeType,
  ValueNodeType,
  VariableNodeType,
  WithContextNodeType,
  WithScopeNodeType,
  WithTransformsNodeType,
];
