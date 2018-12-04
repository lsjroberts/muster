import {
  GetChildRequest,
  GetItemsRequest,
  OperationPathPart,
  QueryBuilder,
  QueryBuilderTree,
} from './query-builder';

export interface OperationWithPath {
  pathPart: OperationPathPart;
  path: Array<OperationPathPart>;
}

export interface GetItemsQuery extends QueriesSnapshot, OperationWithPath {}

export interface GetChildQuery extends QueriesSnapshot, OperationWithPath {}

export type QueriesSnapshot = {
  getChild: Array<GetChildQuery>;
  getItems: Array<GetItemsQuery>;
  otherOperations: Array<OperationWithPath>;
  path: Array<OperationPathPart>;
  queryBuilder: QueryBuilder;
};

export function getQueryBuilderSnapshot(builder: QueryBuilder): QueriesSnapshot {
  const { root: builderRoot } = builder;
  return {
    getChild: [...builderRoot.getChildRequests.values()]
      .map((child) => collectFieldQueries(child, []))
      .filter(isQueriesSnapshotNotEmpty),
    getItems: [...builderRoot.getItemsRequests.values()]
      .map((child) => collectRootGetItemsQueries(child, []))
      .filter(isQueriesSnapshotNotEmpty),
    otherOperations: getOtherOperations(builderRoot, []),
    path: [],
    queryBuilder: builder,
  };
}

function getOtherOperations(
  builder: QueryBuilderTree,
  parentPath: Array<OperationPathPart>,
): Array<OperationWithPath> {
  return [...builder.requests.values()].map(({ pathPart }) => ({
    path: [...parentPath, pathPart],
    pathPart,
  }));
}

function collectFieldQueries(
  child: GetChildRequest,
  parentPath: Array<OperationPathPart>,
): GetChildQuery {
  const { treeBuilder } = child;
  const path = [...parentPath, child.pathPart];
  return {
    getChild: [...treeBuilder.getChildRequests.values()]
      .map((c) => collectFieldQueries(c, path))
      .filter(isQueriesSnapshotNotEmpty),
    getItems: [...treeBuilder.getItemsRequests.values()]
      .map((c) => collectRootGetItemsQueries(c, path))
      .filter(isQueriesSnapshotNotEmpty),
    otherOperations: getOtherOperations(treeBuilder, path),
    path,
    pathPart: child.pathPart,
    queryBuilder: treeBuilder.queryBuilder,
  };
}

function collectRootGetItemsQueries(
  request: GetItemsRequest,
  parentPath: Array<OperationPathPart>,
): GetItemsQuery {
  const { treeBuilder } = request;
  const path = [...parentPath, request.pathPart];
  return {
    getChild: [...treeBuilder.getChildRequests.values()]
      .map((child) => collectItemsFieldsQueries(child, path))
      .filter(isQueriesSnapshotNotEmpty),
    getItems: [...treeBuilder.getItemsRequests.values()]
      .map((child) => collectRootGetItemsQueries(child, path))
      .filter(isQueriesSnapshotNotEmpty),
    otherOperations: getOtherOperations(treeBuilder, path),
    pathPart: request.pathPart,
    path,
    queryBuilder: treeBuilder.queryBuilder,
  };
}

function collectItemsFieldsQueries(
  child: GetChildRequest,
  parentPath: Array<OperationPathPart>,
): GetChildQuery {
  const { treeBuilder } = child;
  const path = [...parentPath, child.pathPart];
  return {
    getChild: [...treeBuilder.getChildRequests.values()]
      .map((c) => collectItemsFieldsQueries(c, path))
      .filter(isQueriesSnapshotNotEmpty),
    getItems: [...treeBuilder.getItemsRequests.values()]
      .map((c) => collectRootGetItemsQueries(c, path))
      .filter(isQueriesSnapshotNotEmpty),
    otherOperations: getOtherOperations(treeBuilder, path),
    pathPart: child.pathPart,
    path,
    queryBuilder: treeBuilder.queryBuilder,
  };
}

function isQueriesSnapshotNotEmpty(snapshot: QueriesSnapshot): boolean {
  return (
    snapshot.getItems.length > 0 ||
    snapshot.getChild.length > 0 ||
    snapshot.otherOperations.length > 0
  );
}
