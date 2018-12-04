import { NodeType } from '../../../types/graph';
// import { CacheMiddlewareNodeType } from './cache-middleware';
import { CombinedMiddlewareNodeType } from './combined-middleware';
import { FromStreamMiddlewareNodeType } from './from-stream-middleware';
import { MockResponseMiddlewareNodeType } from './mock-response-middleware';
import { TransformResponseMiddlewareNodeType } from './transform-response-middleware';
import { XhrMiddlewareNodeType } from './xhr-middleware';

export const RemoteMiddlewareNodeTypes: Array<NodeType> = [
  // CacheMiddlewareNodeType,
  CombinedMiddlewareNodeType,
  FromStreamMiddlewareNodeType,
  MockResponseMiddlewareNodeType,
  TransformResponseMiddlewareNodeType,
  XhrMiddlewareNodeType,
];
