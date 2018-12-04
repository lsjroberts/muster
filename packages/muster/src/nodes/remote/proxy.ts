import identity from 'lodash/identity';
import isEqual from 'lodash/isEqual';
import uniqueId from 'lodash/uniqueId';
import { FLUSH } from '../../events';
import {
  GraphNode,
  NodeDefinition,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { ok } from '../graph/ok';
import { placeholder } from '../graph/placeholder';
import { resolve } from '../graph/resolve';
import { takeLast } from '../graph/take-last';
import { traverse } from '../graph/traverse';
import { combinedMiddleware } from './middlewares/combined-middleware';
import { requestOperation } from './operations/request';
import { onGlobalEvent } from './schedulers/on-global-event';
import { SchedulerFactory } from './schedulers/types';
import { buildQuerySetFromQueryBuilderSnapshot } from './utils/build-query-set-from-query-builder-snapshot';
import { getQueryBuilderSnapshot, QueriesSnapshot } from './utils/get-query-builder-snapshot';
import { QueryBuilder } from './utils/query-builder';

export interface ProxyNode extends StatelessGraphNode<'proxy', ProxyNodeProperties> {}

export interface ProxyNodeDefinition
  extends StatelessNodeDefinition<'proxy', ProxyNodeProperties> {}

export interface ProxyNodeProperties {
  middlewares: Array<NodeDefinition>;
  queryBuilder: QueryBuilder;
  schedulerFactory: SchedulerFactory;
}

export const ProxyNodeType: StatelessNodeType<'proxy', ProxyNodeProperties> = createNodeType<
  'proxy',
  ProxyNodeProperties
>('proxy', {
  shape: {
    middlewares: types.arrayOf(graphTypes.nodeDefinition),
    queryBuilder: types.saveHash(types.any),
    schedulerFactory: types.saveHash(types.func),
  },
  serialize: false,
  deserialize: false,
  operations: {
    evaluate: {
      run(node: ProxyNode): NodeDefinition {
        const { middlewares, queryBuilder, schedulerFactory } = node.definition.properties;
        const composedMiddleware = composeMiddlewares(transformMiddlewares(middlewares, node));
        let lastResult: NodeDefinition = ok();
        let lastSnapshot: QueriesSnapshot | undefined = undefined;
        return takeLast([
          schedulerFactory(() => {
            if (!queryBuilder.isModified) return lastResult;
            queryBuilder.resetModifiedState();
            const queryBuilderSnapshot = getQueryBuilderSnapshot(queryBuilder);
            if (lastSnapshot && isEqual(lastSnapshot, queryBuilderSnapshot)) return lastResult;
            lastSnapshot = queryBuilderSnapshot;
            const querySetWithCallback = buildQuerySetFromQueryBuilderSnapshot(
              queryBuilderSnapshot,
              queryBuilder,
            );
            const traverseRequest = traverse(
              composedMiddleware,
              requestOperation(querySetWithCallback.node, {}),
            );
            lastResult = resolve(
              [{ target: traverseRequest, allowErrors: true }],
              ([result]: [GraphNode]) => {
                querySetWithCallback.callback(result.definition);
                return ok();
              },
            );
            return lastResult;
          }),
          placeholder(queryBuilder, []),
        ]);
      },
    },
  },
});

export interface ProxyOptions {
  scheduler?: SchedulerFactory;
}

export function proxy(
  middlewares: Array<NodeDefinition>,
  options?: ProxyOptions,
): ProxyNodeDefinition {
  return createNodeDefinition(ProxyNodeType, {
    middlewares,
    queryBuilder: new QueryBuilder(uniqueId('proxy_')),
    schedulerFactory: options && options.scheduler ? options.scheduler : onGlobalEvent(FLUSH),
  });
}

export function isProxyNodeDefinition(value: NodeDefinition): value is ProxyNodeDefinition {
  return value.type === ProxyNodeType;
}

function composeMiddlewares(middlewares: Array<NodeDefinition>): NodeDefinition {
  if (middlewares.length === 0) throw new Error('No middleware specified');
  if (middlewares.length === 1) return middlewares[0];
  return combinedMiddleware(middlewares[0], composeMiddlewares(middlewares.slice(1)));
}

export type MiddlewareTransformer = (
  middlewares: Array<NodeDefinition>,
  proxyNode: ProxyNode,
) => Array<NodeDefinition>;

let transformMiddlewares: MiddlewareTransformer = identity;

export function setTransformMiddlewares(fn: MiddlewareTransformer): void {
  transformMiddlewares = fn;
}
