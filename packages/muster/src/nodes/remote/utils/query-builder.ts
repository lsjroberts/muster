import { GetChildOperation, isGetChildOperation } from '../../../operations/get-child';
import { GetItemsOperation, isGetItemsOperation } from '../../../operations/get-items';
import { GraphOperation, NodeDefinition } from '../../../types/graph';

export type QueryPartCallback = (value: NodeDefinition) => void;
export type DisposeRequest = () => void;

export interface OperationPathPart<O extends GraphOperation = GraphOperation> {
  id: string;
  operation: O;
}

export interface Request<T extends string, O extends GraphOperation> {
  isDisposed: boolean;
  pathPart: OperationPathPart<O>;
  retainCount: number;
  type: T;
}

export interface WildcardRequest extends Request<string, GraphOperation> {
  callback: QueryPartCallback;
  isPending: boolean;
  value: NodeDefinition | undefined;
}

export interface GetChildRequest extends Request<'getChild', GetChildOperation> {
  treeBuilder: QueryBuilderTree;
}
export function isGetChildRequest(request: AnyRequest): request is GetChildRequest {
  return request.type === 'getChild';
}

export interface GetItemsRequest extends Request<'getItems', GetItemsOperation> {
  callback: QueryPartCallback | undefined;
  isPending: boolean;
  treeBuilder: QueryBuilderTree;
  value: NodeDefinition | undefined;
}
export function isGetItemsRequest(request: AnyRequest): request is GetItemsRequest {
  return request.type === 'getItems';
}

export type AnyRequest = GetChildRequest | GetItemsRequest | WildcardRequest;

export class RequestWrapper {
  public readonly original: AnyRequest;

  constructor(request: AnyRequest) {
    this.original = request;
  }

  public setValue(value: NodeDefinition) {
    const req = this.original;
    // Check if the function is called for a request that supports values
    if (isGetChildRequest(req)) return;
    req.value = value;
    req.isPending = false;
    req.callback && req.callback(value);
  }
}

export class QueryBuilder {
  public isModified: boolean = false;
  public root: QueryBuilderTree = new QueryBuilderTree(this);

  constructor(public id: string) {}

  addRequest(
    operationPath: Array<OperationPathPart>,
    callback?: QueryPartCallback,
  ): DisposeRequest {
    this.markAsModified();
    const dispose = this.root.addRequest(operationPath, callback);
    return () => {
      dispose();
      this.markAsModified();
    };
  }

  findRequest(operationPath: Array<OperationPathPart>): RequestWrapper | undefined {
    // If the path is incorrect
    if (operationPath.length === 0) return undefined;
    const req = this.root.findRequest(operationPath);
    return req ? new RequestWrapper(req) : undefined;
  }

  isRequestPending(operationPath: Array<OperationPathPart>): boolean {
    // If the path is incorrect
    if (operationPath.length === 0) return false;
    const requestWrapper = this.findRequest(operationPath);
    if (!requestWrapper) return false;
    const request = requestWrapper.original;
    if (isGetChildRequest(request)) return request.treeBuilder.isPending();
    if (isGetItemsRequest(request)) return request.isPending || request.treeBuilder.isPending();
    return request.isPending;
  }

  markAsModified() {
    this.isModified = true;
  }

  resetModifiedState(): void {
    this.isModified = false;
  }
}

export class QueryBuilderTree {
  public readonly getChildRequests: Map<string, GetChildRequest> = new Map();
  public readonly getItemsRequests: Map<string, GetItemsRequest> = new Map();
  public readonly requests: Map<string, WildcardRequest> = new Map();

  constructor(public queryBuilder: QueryBuilder) {}

  addRequest(
    operationPath: Array<OperationPathPart>,
    callback?: QueryPartCallback,
  ): DisposeRequest {
    const [pathPart, ...followingOperations] = operationPath;
    if (isGetChildOperation(pathPart.operation)) {
      let request: GetChildRequest;
      if (this.getChildRequests.has(pathPart.id)) {
        request = this.getChildRequests.get(pathPart.id)!;
        if (followingOperations.length > 0) {
          return request.treeBuilder.addRequest(followingOperations, callback);
        }
        request.retainCount += 1;
      } else {
        const childTreeBuilder = new QueryBuilderTree(this.queryBuilder);
        request = {
          isDisposed: false,
          pathPart: pathPart as OperationPathPart<GetChildOperation>,
          retainCount: followingOperations.length > 0 ? 0 : 1,
          type: 'getChild',
          treeBuilder: childTreeBuilder,
        };
        this.getChildRequests.set(pathPart.id, request);
        if (followingOperations.length > 0) {
          return childTreeBuilder.addRequest(followingOperations, callback);
        }
      }
      let disposeWasCalled = false;
      return () => {
        if (disposeWasCalled) return;
        disposeWasCalled = true;
        this.removeRequest(request);
      };
    }
    if (isGetItemsOperation(pathPart.operation)) {
      let request: GetItemsRequest;
      if (this.getItemsRequests.has(pathPart.id)) {
        request = this.getItemsRequests.get(pathPart.id)!;
        if (followingOperations.length > 0) {
          return request.treeBuilder.addRequest(followingOperations, callback);
        }
        if (!callback) {
          throw new Error(`${pathPart.operation.type.name} operation is missing a callback.`);
        }
        const previousCallback = request.callback;
        request.callback = (value) => {
          callback(value);
          previousCallback && previousCallback(value);
        };
        request.retainCount += 1;
      } else {
        const childTreeBuilder = new QueryBuilderTree(this.queryBuilder);
        request = {
          callback: followingOperations.length > 0 ? undefined : callback,
          isDisposed: false,
          isPending: true,
          pathPart: pathPart as OperationPathPart<GetItemsOperation>,
          retainCount: followingOperations.length > 0 ? 0 : 1,
          type: 'getItems',
          treeBuilder: childTreeBuilder,
          value: undefined,
        };
        this.getItemsRequests.set(pathPart.id, request);
        if (followingOperations.length > 0) {
          return childTreeBuilder.addRequest(followingOperations, callback);
        }
      }
      let disposeWasCalled = false;
      return () => {
        if (disposeWasCalled) return;
        disposeWasCalled = true;
        this.removeRequest(request);
      };
    }
    if (followingOperations.length > 0) {
      throw new Error(
        `${pathPart.operation.type.name} operation does not support child operations.`,
      );
    }
    let request: WildcardRequest;
    if (this.requests.has(pathPart.id)) {
      request = this.requests.get(pathPart.id)!;
      request.retainCount += 1;
    } else {
      request = {
        callback: callback!,
        isDisposed: false,
        isPending: true,
        pathPart,
        retainCount: 1,
        type: 'wildcard',
        value: undefined,
      };
      this.requests.set(pathPart.id, request);
    }
    let disposeWasCalled = false;
    return () => {
      if (disposeWasCalled) return;
      disposeWasCalled = true;
      this.removeRequest(request);
    };
  }

  findRequest(operationPath: Array<OperationPathPart>): AnyRequest | undefined {
    const [pathPart, ...followingOperations] = operationPath;
    if (isGetChildOperation(pathPart.operation)) {
      const request = this.getChildRequests.get(pathPart.id);
      if (!request || request.pathPart.operation.id !== pathPart.operation.id) return undefined;
      return followingOperations.length > 0
        ? request.treeBuilder.findRequest(followingOperations)
        : request;
    }
    if (isGetItemsOperation(pathPart.operation)) {
      const request = this.getItemsRequests.get(pathPart.id);
      if (!request || request.pathPart.operation.id !== pathPart.operation.id) return undefined;
      return followingOperations.length > 0
        ? request.treeBuilder.findRequest(followingOperations)
        : request;
    }
    if (followingOperations.length > 0) {
      throw new Error(`${pathPart.operation.type.name} does not support child operations.`);
    }
    const request = this.requests.get(pathPart.id);
    return request && request.pathPart.operation.id === pathPart.operation.id ? request : undefined;
  }

  isEmpty(): boolean {
    if (this.getChildRequests.size > 0) return false;
    if (this.getItemsRequests.size > 0) return false;
    return this.requests.size === 0;
  }

  isPending(): boolean {
    for (const callReq of this.requests.values()) {
      if (callReq.isPending) return true;
    }
    for (const getChildReq of this.getChildRequests.values()) {
      if (getChildReq.treeBuilder.isPending()) return true;
    }
    for (const getItemsReq of this.getItemsRequests.values()) {
      if (getItemsReq.isPending || getItemsReq.treeBuilder.isPending()) return true;
    }
    return false;
  }

  removeRequest(request: AnyRequest): void {
    if (request.isDisposed) return;
    if (isGetChildRequest(request)) {
      request.retainCount -= 1;
      if (request.retainCount <= 0) {
        request.isDisposed = true;
        disposeChildren(request.treeBuilder);
        this.getChildRequests.delete(request.pathPart.id);
      }
    } else if (isGetItemsRequest(request)) {
      request.retainCount -= 1;
      if (request.retainCount <= 0) {
        request.isDisposed = true;
        disposeChildren(request.treeBuilder);
        this.getItemsRequests.delete(request.pathPart.id);
      }
    } else {
      request.retainCount -= 1;
      if (request.retainCount <= 0) {
        request.isDisposed = true;
        this.requests.delete(request.pathPart.id);
      }
    }
  }
}

function disposeChildren(tree: QueryBuilderTree): void {
  for (const req of tree.requests.values()) {
    req.isDisposed = true;
  }
  for (const getChildReq of tree.getChildRequests.values()) {
    getChildReq.isDisposed = true;
    disposeChildren(getChildReq.treeBuilder);
  }
  for (const getItemsReq of tree.getItemsRequests.values()) {
    getItemsReq.isDisposed = true;
    disposeChildren(getItemsReq.treeBuilder);
  }
}
