import { ObservableLike } from '@dws/muster-observable';

const version = require('@dws/muster-version');
import { FLUSH, TRANSACTION_END, TRANSACTION_START } from './events';
import { ROOT_CONTEXT_NAME } from './nodes/graph/root';
import { resolveOperation } from './operations/resolve';
import {
  Context,
  GraphAction,
  GraphNode,
  isGraphAction,
  MusterEventSource,
  NodeDefinition,
  NodeStream,
  Scope,
} from './types/graph';
import { Stream, StreamSubscription, StreamUpdateCallback } from './types/stream';
import { createRootContext } from './utils/create-context';
import createGraphNode from './utils/create-graph-node';
import { createScope } from './utils/create-scope';
import { push } from './utils/global-queue';
import { nodeDefinition as hashNodeDefinition } from './utils/graph-hash';
import { thenable } from './utils/observable';
import {
  createStream,
  createSubscription,
  filter,
  fromEmitter,
  sample,
  toObservable,
} from './utils/stream';
import { valueOf } from './utils/value-of';

export type ContextValuesDefinitions = { [key: string]: NodeDefinition };

export interface MusterResolveOptions {
  context?: ContextValuesDefinitions;
  raw?: boolean;
}

export class Muster {
  public readonly debug: boolean;
  public readonly version: string;
  public readonly context: Context;
  public disposeCallbacks: Array<() => void>;
  public readonly graph: NodeDefinition;
  public readonly scope: Scope;
  public readonly transform?: (value: GraphNode) => Array<NodeDefinition>;

  constructor(
    graph: NodeDefinition,
    options?: {
      context?: Context;
      debug?: boolean;
      scope?: Scope;
      transform?: (value: GraphNode) => Array<NodeDefinition>;
    },
  ) {
    this.debug = options && typeof options.debug !== 'undefined' ? options.debug : true;
    this.version = version;
    this.graph = graph;
    this.context = (options && options.context) || createRootContext();
    this.scope = (options && options.scope) || createScope({ debug: this.debug });
    this.transform = options && options.transform;
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    this.context.values[ROOT_CONTEXT_NAME as any] = createGraphNode(
      this.scope,
      this.context,
      this.graph,
    );
    this.disposeCallbacks = [];
  }

  dispose(): void {
    this.disposeCallbacks.forEach((dispose) => dispose());
    this.disposeCallbacks = [];
  }

  resolve(
    target: NodeDefinition | GraphAction,
    options: { raw: true } & Partial<MusterResolveOptions>,
  ): ObservableLike<NodeDefinition> & Promise<NodeDefinition>;
  resolve(
    target: NodeDefinition | GraphAction,
    options?: { raw?: false } & Partial<MusterResolveOptions>,
  ): ObservableLike<any> & Promise<any>;
  resolve(
    target: NodeDefinition | GraphAction,
    options: MusterResolveOptions = {},
  ):
    | (ObservableLike<NodeDefinition> & Promise<NodeDefinition>)
    | (ObservableLike<any> & Promise<any>) {
    const scope = this.scope;
    const resolverContext = getResolverContext(this.scope, this.context, options.context);
    const graphNode = isGraphAction(target)
      ? target.node
      : createGraphNode(scope, resolverContext, target);
    const operation = isGraphAction(target) ? target.operation : resolveOperation();
    const resultStream = createStream((callback: StreamUpdateCallback<GraphNode>) => {
      const store = this.scope.store;
      const unsubscribe = store.subscribe(graphNode, operation, callback, { debug: true });
      return createSubscription({
        unsubscribe,
        invalidate(): void {
          store.invalidate(graphNode, operation);
        },
      });
    });
    const queryStream = createQueryStream(
      resultStream,
      scope.globalEvents,
      this.transform,
      options.raw || false,
    );
    const flushStream = filter((event) => event.type === FLUSH, fromEmitter(scope.globalEvents));
    const outputStream = sample(flushStream, queryStream);
    return thenable(toObservable(outputStream));
  }
}

function getResolverContext(
  rootScope: Scope,
  rootContext: Context,
  contextValues?: ContextValuesDefinitions,
): Context {
  if (!contextValues) return rootContext;
  const context = createRootContext(rootContext.values);
  // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
  context.values[ROOT_CONTEXT_NAME as any] = createGraphNode(
    rootScope,
    context,
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    context.values[ROOT_CONTEXT_NAME as any].definition,
  );
  Object.keys(contextValues).forEach((key) => {
    context.values[key] = createGraphNode(rootScope, context, contextValues[key]);
  });
  Object.getOwnPropertySymbols(contextValues).forEach((key) => {
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    context.values[key as any] = createGraphNode(rootScope, context, contextValues[key as any]);
  });
  return context;
}

function createQueryStream(
  resultStream: NodeStream,
  events: MusterEventSource,
  transform: ((value: GraphNode) => Array<NodeDefinition>) | undefined,
  raw: boolean,
): Stream<NodeDefinition> {
  const transactionStartEvent = { type: TRANSACTION_START, payload: undefined };
  const transactionEndEvent = { type: TRANSACTION_END, payload: undefined };
  return createStream(
    (callback: StreamUpdateCallback<NodeDefinition>): StreamSubscription => {
      events.emit(transactionStartEvent);
      let hasResolved = false;
      let latestValue: NodeDefinition | undefined;
      return resultStream(
        (value: GraphNode): void => {
          const isFirstEmission = !hasResolved;
          hasResolved = true;
          const outputValues = transform ? transform(value) : [value.definition];
          outputValues.forEach((result: NodeDefinition) => {
            if (latestValue && valuesAreEqual(result, latestValue)) {
              return;
            }
            latestValue = result;
            callback(raw ? result : valueOf(result));
          });
          if (isFirstEmission) {
            push(() => {
              events.emit(transactionEndEvent);
            });
          }
        },
      );
    },
  );
}

function valuesAreEqual(value1: NodeDefinition, value2: NodeDefinition): boolean {
  return hashNodeDefinition(value1) === hashNodeDefinition(value2);
}
