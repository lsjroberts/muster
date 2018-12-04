import { Matcher, Muster, NodeDefinition, NodeLike, ScopeNodeProperties } from '@dws/muster';
import { BehaviorSubject, Subscription } from '@dws/muster-observable';
import { Component, ComponentClass, ReactElement, StatelessComponent } from 'react';
import { InjectedMatcher } from './types/injected';
import { DisposeEmitter } from './utils/create-dispose-emitter';
import { RequirementsTree } from './utils/to-requirements-tree';

export interface ExternalComponentProps {}

export type Props<T> = { [key in keyof T]: Matcher<T[key], any> | Props<T[key]> | boolean };

export type InjectedProps<T> = {
  // TODO: Improve this typing
  [key in keyof T]: any
};

export type ResolvedProps<PF, P extends Props<PF>> = {
  // TODO: Improve this typing
  [key in keyof P]: any
};

export interface MusterReactProps<PF, P extends Props<PF>> {
  muster?: Muster;
  $inject?: InjectedProps<P>;
}

export interface RenderErrorCallback<PF = any, P extends Props<PF> = Props<PF>> {
  <E extends ReactElement<ResolvedProps<PF, P>>>(errors: Array<any>, props: any): E;
}

export interface RenderLoadingCallback<PF = any, P extends Props<PF> = Props<PF>> {
  <E extends ReactElement<ResolvedProps<PF, P>>>(props: any): E;
}

export interface ContainerConfiguration<PF, P extends Props<PF>, RF, R extends Props<RF>> {
  // TODO: Deprecated property; use `graph` instead
  data?: NodeLike;
  events?: ScopeNodeProperties['redispatch'];
  graph?: NodeLike;
  props: P | InjectedMatcher;
  relaxPropsValidation?: boolean;
  renderError?: RenderErrorCallback<PF, P> | true;
  renderLoading?: RenderLoadingCallback<PF, P> | true;
  require?: R;
}

export interface MusterReactState<RF, R extends Props<RF>> {
  containerRoot: NodeDefinition;
  data: any;
  dataLoaded: boolean;
  dataQuery?: NodeDefinition;
  dataSubscription?: Subscription;
  disposeEmitter: DisposeEmitter;
  errors: Array<Error>;
  injectedPropsStream: BehaviorSubject<InjectedProps<R> | undefined>;
  muster: Muster;
  reactPropsStream: BehaviorSubject<{} | undefined>;
  settersAndCallersLoaded: boolean;
  settersAndCallersQuery?: NodeDefinition;
  settersAndCallersSubscription?: Subscription;
}

export type ScopeTransformer = (scope: any, props: any, metadata: any) => any;

export interface ContainerComponent<
  RF = any,
  R extends Props<RF> = Props<RF>,
  E extends ExternalComponentProps = any
> extends ComponentClass<MusterReactProps<RF, R> & E> {
  new (props: MusterReactProps<RF, R> & E, context?: any): Component<MusterReactProps<RF, R> & E>;
  getRequirements(): RequirementsTree;
  inject(props: any, propsPath?: Array<string>): MusterReactProps<RF, R>;
}

export type ContainerComponentFactory<
  PF = any,
  P extends Props<PF> = Props<PF>,
  RF = any,
  R extends Props<RF> = Props<RF>
> = <E extends ExternalComponentProps>(
  component: ComponentClass<ResolvedProps<PF, P>> | StatelessComponent<ResolvedProps<PF, P>>,
) => ContainerComponent<RF, R, E>;
