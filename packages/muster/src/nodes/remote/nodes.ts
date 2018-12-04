import { NodeType } from '../../types/graph';
import { RemoteMiddlewareNodeTypes } from './middlewares/nodes';
import { ProxyNodeType } from './proxy';

export const RemoteNodeTypes: Array<NodeType> = [...RemoteMiddlewareNodeTypes, ProxyNodeType];
