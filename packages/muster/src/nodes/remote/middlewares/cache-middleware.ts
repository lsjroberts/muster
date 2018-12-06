// import flatMap from 'lodash/flatMap';
// import isEqual from 'lodash/isEqual';
// import mapValues from 'lodash/mapValues';
// import omit from 'lodash/omit';
// import partition from 'lodash/partition';
// import set from 'lodash/set';
// import uniq from 'lodash/uniq';
// import {
//   GraphNode,
//   isNodeDefinition,
//   MusterEvent,
//   NodeDefinition,
//   NodeExecutionContext,
//   StatefulNodeType,
// } from '../../../types/graph';
// import createNodeDefinition from '../../../utils/create-node-definition';
// import { createNodeType } from '../../../utils/create-node-type';
// import { UnsubscribeCallback } from '../../../utils/emitter';
// import { getInvalidTypeError } from '../../../utils/get-invalid-type-error';
// import * as graphTypes from '../../../utils/graph-types';
// import { serialize } from '../../../utils/serialize';
// import { toNode } from '../../../utils/to-node';
// import * as types from '../../../utils/types';
// import withScopeFrom from '../../../utils/with-scope-from';
// import { isArrayNodeDefinition } from '../../graph/array';
// import { combineLatest, CombineLatestNodeDefinition } from '../../graph/combine-latest';
// import { EntriesNodeDefinition, isEntriesNodeDefinition } from '../../graph/entries';
// import { fields, FieldsNodeDefinition } from '../../graph/fields';
// import { key, KeyNodeDefinition } from '../../graph/key';
// import { ok } from '../../graph/ok';
// import { isPendingNodeDefinition, pending } from '../../graph/pending';
// import { isQueryNodeDefinition, query, QueryNodeDefinition } from '../../graph/query';
// import { resolve } from '../../graph/resolve';
// import { traverse } from '../../graph/traverse';
// import {
//   getBranchByName,
//   getBranchNames,
//   isTreeNodeDefinition,
//   tree,
//   TreeNodeDefinition,
// } from '../../graph/tree';
// import {
//   isWithTransformsNodeDefinition,
//   WithTransformsNodeDefinition,
// } from '../../graph/with-transforms';
// import { requestOperation, RequestOperation } from '../operations/update-request';
//
// export const RESET_CACHE_FOR_PATHS = '$$event:reset-cache-for-paths';
//
// export type Path = Array<NodeDefinition>;
// export type CacheStrategy = boolean
//   | number
//   | ((path: Path) => boolean | number);
//
// export interface CachedPath {
//   path: Path;
//   hasExpired: () => boolean;
//   list: string | undefined;
//   value: NodeDefinition;
// }
//
// export interface PathToReset {
//   path: Path;
//   matchStart?: boolean;
// }
//
// export function resetCacheForPaths(paths: Array<PathToReset>): MusterEvent {
//   return {
//     type: RESET_CACHE_FOR_PATHS,
//     payload: paths,
//   };
// }
//
// export interface CacheMiddlewareNode extends GraphNode<
//   'cache-middleware',
//   CacheMiddlewareNodeProperties,
//   CacheMiddlewareNodeState,
//   CacheMiddlewareNodeData
// > {}
//
// export interface CacheMiddlewareNodeDefinition extends NodeDefinition<
//   'cache-middleware',
//   CacheMiddlewareNodeProperties,
//   CacheMiddlewareNodeState,
//   CacheMiddlewareNodeData
// > {}
//
// export interface CacheMiddlewareNodeProperties {
//   cacheStrategy: CacheStrategy;
//   cachedPaths: Array<CachedPath>;
// }
//
// export interface CacheMiddlewareNodeState {
//   results: {
//     [operationHash: string]: NodeDefinition | undefined;
//   };
// }
//
// export interface CacheMiddlewareNodeData {
//   disposeListener: UnsubscribeCallback;
// }
//
// export const CacheMiddlewareNodeType: StatefulNodeType<
//   'cache-middleware',
//   CacheMiddlewareNodeProperties,
//   CacheMiddlewareNodeState,
//   CacheMiddlewareNodeData
// > =
// createNodeType<
//   'cache-middleware',
//   CacheMiddlewareNodeProperties,
//   CacheMiddlewareNodeState,
//   CacheMiddlewareNodeData
// >('cache-middleware', {
//   state: {
//     results: types.objectOf(graphTypes.nodeDefinition),
//   },
//   shape: {
//     cacheStrategy: types.oneOfType<boolean | number | Function>([
//       types.bool,
//       types.number,
//       types.func,
//     ]),
//     cachedPaths: types.any,
//   },
//   getInitialState(): CacheMiddlewareNodeState {
//     return { results: {} };
//   },
//   operations: {
//     request: {
//       run(
//         node: CacheMiddlewareNode,
//         operation: RequestOperation,
//         dependencies: never,
//         context: never,
//         state: CacheMiddlewareNodeState
//       ): NodeDefinition {
//         return state.results[operation.id] || pending();
//       },
//       onSubscribe(
//         this: NodeExecutionContext<CacheMiddlewareNodeState, CacheMiddlewareNodeData>,
//         node: CacheMiddlewareNode,
//         operation: RequestOperation,
//       ): void {
//         const { abortEmitter, next, query } = operation.properties;
//         const cacheProperties = node.definition.properties;
//         const cleanedPaths = removeStaleEntries(cacheProperties.cachedPaths);
//         this.setData({
//           disposeListener: node.scope.events.listen((event) => {
//             if (event.type !== RESET_CACHE_FOR_PATHS) return;
//             cacheProperties.cachedPaths = [];
//           }),
//         });
//         cacheProperties.cachedPaths = cleanedPaths;
//         const {
//           cachedResponse,
//           outboundRequest,
//         } = partitionCombinedRequest(query.definition as CombineLatestNodeDefinition, cleanedPaths);
//         if (!outboundRequest) {
//           this.setState((state) => ({
//             ...state,
//             results: {
//               ...state.results,
//               [operation.id]: cachedResponse,
//             },
//           }));
//           return;
//         }
//         const traverseNext = traverse(
//           next!.definition,
//           requestOperation(withScopeFrom(query, outboundRequest), abortEmitter),
//         );
//         this.setState((previousState) => ({
//           ...previousState,
//           results: {
//             ...previousState.results,
//             [operation.id]: resolve([{ target: traverseNext }], ([response]): GraphNode => {
//               cacheProperties.cachedPaths = updateCache(
//                 cacheProperties.cacheStrategy,
//                 outboundRequest,
//                 cacheProperties.cachedPaths,
//                 response.definition,
//               );
//               return withScopeFrom(
//                 response,
//                 mergeCombinedResponse(cachedResponse, response.definition),
//               );
//             }),
//           }
//         }));
//       },
//       onUnsubscribe(
//         this: NodeExecutionContext<CacheMiddlewareNodeState, CacheMiddlewareNodeData>,
//         node: CacheMiddlewareNode,
//         operation: RequestOperation,
//       ): void {
//         const { results } = this.getState();
//         if (!results[operation.id]) return;
//         this.setState((state) => ({
//           ...state,
//           results: omit(state.results, operation.id),
//         }));
//       },
//     },
//     reset: {
//       run(): NodeDefinition {
//         return ok();
//       },
//       onSubscribe(
//         this: NodeExecutionContext<CacheMiddlewareNodeState, CacheMiddlewareNodeData>,
//         node: CacheMiddlewareNode,
//       ): void {
//         node.definition.properties.cachedPaths = [];
//       },
//     },
//   },
// });
//
// export function cacheMiddleware(
//   cacheStrategy: CacheStrategy,
// ): CacheMiddlewareNodeDefinition {
//   return createNodeDefinition(CacheMiddlewareNodeType, {
//     cacheStrategy,
//     cachedPaths: [] as Array<CachedPath>,
//   });
// }
//
// export function isCacheMiddlewareNodeDefinition(value: NodeDefinition): value is CacheMiddlewareNodeDefinition {
//   return value.type === CacheMiddlewareNodeType;
// }
//
// function removeStaleEntries(cachedPaths: Array<CachedPath>): Array<CachedPath> {
//   return cachedPaths.filter((path) => !path.hasExpired());
// }
//
// interface PartitionedRequest {
//   cachedResponse: CombineLatestNodeDefinition;
//   outboundRequest: CombineLatestNodeDefinition | undefined;
// }
//
// interface PartitionedQuery {
//   cachedResponse: NodeDefinition;
//   outboundRequest: QueryNodeDefinition | undefined;
// }
//
// interface RequestedLeaf {
//   list: EntriesNodeDefinition | WithTransformsNodeDefinition | undefined;
//   pathInGraph: Array<NodeDefinition>;
//   pathInResponse: Array<string>;
// }
//
// interface PartitionedRequests {
//   cachedResponses: Array<NodeDefinition>;
//   outboundRequests: Array<NodeDefinition>;
// }
//
// function partitionCombinedRequest(
//   request: CombineLatestNodeDefinition,
//   cachedPaths: Array<CachedPath>,
// ): PartitionedRequest {
//   let queryIsEmpty = false;
//   const partitionedRequests = request.properties.operations.reduce((acc: PartitionedRequests, node) => {
//     if (!isQueryNodeDefinition(node)) {
//       acc.cachedResponses.push(pending());
//       acc.outboundRequests.push(node);
//     } else {
//       const partitionedQuery = partitionRequest(node, cachedPaths);
//       queryIsEmpty = !partitionedQuery.outboundRequest;
//       acc.cachedResponses.push(partitionedQuery.cachedResponse);
//       acc.outboundRequests.push(partitionedQuery.outboundRequest || tree({}));
//     }
//     return acc;
//   }, { cachedResponses: [], outboundRequests: [] });
//   return {
//     cachedResponse: combineLatest(partitionedRequests.cachedResponses),
//     outboundRequest: queryIsEmpty && partitionedRequests.outboundRequests.length === 1
//       ? undefined
//       : combineLatest(partitionedRequests.outboundRequests),
//   };
// }
//
// function partitionRequest(
//   request: QueryNodeDefinition,
//   cachedPaths: Array<CachedPath>,
// ): PartitionedQuery {
//   const requestedLeaves = getRequestedLeaves(request.properties.keys as (
//     FieldsNodeDefinition | EntriesNodeDefinition | WithTransformsNodeDefinition
//   ));
//   const requestedLeavesWithCache = requestedLeaves.map((leaf) => ({
//     leaf,
//     cacheEntry: cachedPaths.find((cachedPath) =>
//       isEqual(cachedPath.path, leaf.pathInGraph)
//       && (
//         (!leaf.list && !cachedPath.list)
//         || (Boolean(leaf.list) && Boolean(cachedPath.list) && cachedPath.list === getLeafList(leaf))
//       )
//     ),
//   }));
//   const [cachedLeaves, outboundLeaves] = partition(
//     requestedLeavesWithCache,
//     (leaf) => leaf.cacheEntry,
//   );
//   return {
//     cachedResponse: getCachedResponse(cachedLeaves as any),
//     outboundRequest: getOutboundRequest(request.properties.root, outboundLeaves.map((l) => l.leaf)),
//   };
// }
//
// function getRequestedLeaves(
//   request: FieldsNodeDefinition | EntriesNodeDefinition | WithTransformsNodeDefinition,
//   pathInGraph: Array<NodeDefinition> = [],
//   pathInResponse: Array<string> = [],
// ): Array<RequestedLeaf> {
//   if (isCollectionFieldsNodeDefinition(request)) {
//     return [{
//       list: request,
//       pathInGraph,
//       pathInResponse,
//     }];
//   }
//   return flatMap(Object.keys(request.properties.fields).map((key) => {
//     const getter = request.properties.fields[key] as KeyNodeDefinition;
//     const childPartInGraph = [...pathInGraph, getter.properties.key];
//     const childPathInResponse = [...pathInResponse, key];
//     if (!getter.properties.children) {
//       return [{
//         list: undefined,
//         pathInGraph: childPartInGraph,
//         pathInResponse: childPathInResponse,
//       }];
//     }
//     return getRequestedLeaves(getter.properties.children, childPartInGraph, childPathInResponse);
//   }));
// }
//
// function getCachedResponse(
//   cachedLeaves: Array<{leaf: RequestedLeaf, cacheEntry: CachedPath}>,
// ): NodeDefinition {
//   const cachedResponse = cachedLeaves.reduce((cachedResponse, leaf) => {
//     set(cachedResponse, leaf.leaf.pathInResponse, leaf.cacheEntry!.value);
//     return cachedResponse;
//   }, {} as any);
//   return toNode(cachedResponse);
// }
//
// interface FieldsDefinition {
//   [key: string]: GetterDefinition;
// }
//
// interface GetterDefinition {
//   key: NodeDefinition;
//   fields: EntriesNodeDefinition | WithTransformsNodeDefinition | FieldsDefinition | undefined;
// }
//
// function getOutboundRequest(
//   root: NodeDefinition,
//   leaves: Array<RequestedLeaf>,
// ): QueryNodeDefinition | undefined {
//   if (leaves.length === 0) return undefined;
//   const fieldsDefinition = leaves.reduce(
//     (fieldsDefinition, leaf) => addLeafToQueryDefinition(
//       fieldsDefinition,
//       leaf.pathInGraph,
//       leaf.pathInResponse,
//       leaf.list,
//     ),
//     {} as FieldsDefinition,
//   );
//   return query(root, buildFieldsQuery(fieldsDefinition));
// }
//
// function addLeafToQueryDefinition(
//   queryDefinition: FieldsDefinition,
//   pathInGraph: Array<NodeDefinition>,
//   pathInResponse: Array<string>,
//   list: EntriesNodeDefinition | WithTransformsNodeDefinition | undefined,
// ): FieldsDefinition {
//   const [keyInGraph, ...remainingPathInGraph] = pathInGraph;
//   const [keyInResponse, ...remainingPathInResponse] = pathInResponse;
//   let getter = queryDefinition[keyInResponse];
//   const isFinalPath = remainingPathInGraph.length === 0;
//   if (!getter) {
//     getter = {
//       key: keyInGraph,
//       fields: isFinalPath ? list : undefined,
//     };
//     queryDefinition[keyInResponse] = getter;
//   }
//   if (isFinalPath) return queryDefinition;
//   getter.fields = addLeafToQueryDefinition(
//     (getter.fields as FieldsDefinition) || {},
//     remainingPathInGraph,
//     remainingPathInResponse,
//     list,
//   );
//   return queryDefinition;
// }
//
// function buildFieldsQuery(
//   fieldsDefinition: FieldsDefinition,
// ): FieldsNodeDefinition | EntriesNodeDefinition {
//   const children = mapValues(fieldsDefinition, (definition) => {
//     if (!definition.fields) return key(definition.key);
//     if (isNodeDefinition(definition.fields) && isCollectionFieldsNodeDefinition(definition.fields)) {
//       return key(definition.key, definition.fields);
//     }
//     return key(definition.key, buildFieldsQuery(definition.fields));
//   });
//   return fields(children);
// }
//
// function mergeCombinedResponse(
//   cachedResponse: CombineLatestNodeDefinition,
//   response: NodeDefinition | undefined,
// ): NodeDefinition {
//   let nextResponseIndex = 0;
//   return combineLatest(
//     cachedResponse.properties.operations.map((node) => {
//       if (response && isPendingNodeDefinition(response)) return response;
//       if (!response || !isArrayNodeDefinition(response)) {
//         throw getInvalidTypeError('Invalid response node type.', {
//           expected: ['combineLatest(...)'],
//           received: response,
//         });
//       }
//       // tslint:disable-next-line:no-increment-decrement
//       return mergeResponse(node, response.properties.items[nextResponseIndex++]);
//     }),
//   )
// }
//
// function mergeResponse(
//   cachedResponse: NodeDefinition | undefined,
//   response: NodeDefinition | undefined,
// ): NodeDefinition {
//   if ((cachedResponse && !isTreeNodeDefinition(cachedResponse))
//     || (response && !isTreeNodeDefinition(response))
//   ) {
//     return (response || cachedResponse) as NodeDefinition;
//   }
//   const cachedTree = cachedResponse as TreeNodeDefinition | undefined;
//   const responseTree = response as TreeNodeDefinition | undefined;
//   const allKeys = uniq([
//     ...(cachedTree ? getBranchNames(cachedTree) : []),
//     ...(responseTree ? getBranchNames(responseTree) : []),
//   ]);
//   const combinedTree = allKeys.reduce((combinedTree, key) => {
//     combinedTree[key] = mergeResponse(
//       cachedTree ? getBranchByName(cachedTree, key) : undefined,
//       responseTree ? getBranchByName(responseTree, key) : undefined,
//     );
//     return combinedTree;
//   }, {} as any);
//   return toNode(combinedTree);
// }
//
// function updateCache(
//   strategy: CacheStrategy,
//   remoteQuery: CombineLatestNodeDefinition,
//   cachedPaths: Array<CachedPath>,
//   response: NodeDefinition,
// ): Array<CachedPath> {
//   const { query, queryResponse } = getQueryNodeAndResponse(remoteQuery, response);
//   if (!query || !queryResponse) {
//     return cachedPaths;
//   }
//   const requestedLeaves = getRequestedLeaves(query.properties.keys as (
//     FieldsNodeDefinition | EntriesNodeDefinition | WithTransformsNodeDefinition
//   ));
//   const leavesToCache = requestedLeaves.filter((leaf) =>
//     shouldBeCached(strategy, leaf.pathInGraph),
//   );
//   const remainingCachedPaths = cachedPaths.filter((cachedPath) =>
//     leavesToCache.every((leaf) => !isEqual(leaf.pathInGraph, cachedPath.path)),
//   );
//   const cachedLeaves = leavesToCache.map((leaf) => ({
//     path: leaf.pathInGraph,
//     hasExpired: getExpirationValidator(strategy, leaf.pathInGraph),
//     list: getLeafList(leaf),
//     value: getValueFromResponse(queryResponse, leaf.pathInResponse),
//   }));
//   return [
//     ... remainingCachedPaths,
//     ...cachedLeaves,
//   ];
// }
//
// interface QueryNodeWithResponse {
//   query: QueryNodeDefinition | undefined;
//   queryResponse: NodeDefinition | undefined;
// }
//
// function getQueryNodeAndResponse(
//   remoteQuery: CombineLatestNodeDefinition,
//   response: NodeDefinition,
// ): QueryNodeWithResponse {
//   const queryNodeIndex = remoteQuery.properties.operations.findIndex(isQueryNodeDefinition);
//   if (queryNodeIndex === -1) {
//     return { query: undefined, queryResponse: undefined };
//   }
//   if (isPendingNodeDefinition(response)) {
//     return {
//       query: remoteQuery.properties.operations[queryNodeIndex] as QueryNodeDefinition,
//       queryResponse: response,
//     };
//   }
//   if (!isArrayNodeDefinition(response)) {
//     throw getInvalidTypeError('Invalid response.', {
//       expected: ['items(...)'],
//       received: response,
//     });
//   }
//   return {
//     query: remoteQuery.properties.operations[queryNodeIndex] as QueryNodeDefinition,
//     queryResponse: response.properties.items[queryNodeIndex],
//   };
// }
//
// function shouldBeCached(strategy: CacheStrategy, path: Array<NodeDefinition>): boolean {
//   const computedStrategy = typeof strategy === 'function'
//     ? strategy(path)
//     : strategy;
//   return computedStrategy === true || typeof strategy === 'number';
// }
//
// function getExpirationValidator(strategy: CacheStrategy, path: Array<NodeDefinition>): () => boolean {
//   const computedStrategy = typeof strategy === 'function'
//     ? strategy(path)
//     : strategy;
//   if (computedStrategy === true) return () => false;
//   if (typeof computedStrategy === 'number') return () => Date.now() > computedStrategy;
//   return () => true;
// }
//
// function getValueFromResponse(response: NodeDefinition, pathInResponse: Array<string>): NodeDefinition {
//   if (isPendingNodeDefinition(response)) return response;
//   let parent: NodeDefinition | undefined = response;
//   let pathIndex = 0;
//   while (pathIndex < pathInResponse.length) {
//     if (!parent || !isTreeNodeDefinition(parent)) {
//       throw getInvalidTypeError('Invalid response node type.', {
//         expected: ['TreeNodeType'],
//         received: parent,
//       });
//     }
//     parent = getBranchByName(parent, pathInResponse[pathIndex]);
//     pathIndex += 1;
//   }
//   return parent!;
// }
//
// function getLeafList(leaf: RequestedLeaf): string | undefined {
//   return leaf.list && leaf.list
//     ? normalizeList(leaf.list)
//     : undefined;
// }
//
// function normalizeList(list: EntriesNodeDefinition | WithTransformsNodeDefinition): string {
//   // TODO: Remove once named fn args have been implemented
//   const str = serialize(list);
//   const args = str.match(/\$\$arg:(\d+)/g);
//   if (!args) return str;
//   return uniq(args).reduce((outStr, arg, index) => (
//     outStr.replace(new RegExp(`"\\$\\$${arg.substr(2)}"`, "g"), `"$$arg:${index}"`)
//   ), str);
// }
//
// function isCollectionFieldsNodeDefinition(
//   value: NodeDefinition,
// ): value is EntriesNodeDefinition | WithTransformsNodeDefinition {
//   return isEntriesNodeDefinition(value) || isWithTransformsNodeDefinition(value);
// }
