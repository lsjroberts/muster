import {
  Context,
  getProxiedNodeValue,
  GraphAction,
  GraphNode,
  GraphOperation,
  MusterEvent,
  NodeDefinition,
  NodeDependency,
  NodeType,
  OperationType,
  ProxiedNode,
  Scope,
} from '../types/graph';
import * as graphTypes from './graph-types';
import * as hash from './hash';

export const nodeType: hash.HashFunction<NodeType> = hash.registerTypeHasher(
  graphTypes.nodeType,
  (value: NodeType) => value.name,
);

export const nodeDefinition: hash.HashFunction<NodeDefinition> = hash.registerTypeHasher(
  graphTypes.nodeDefinition,
  (value: NodeDefinition): string => value.id,
);

export const graphNode: hash.HashFunction<GraphNode> = hash.registerTypeHasher(
  graphTypes.graphNode,
  (value: GraphNode): string => value.id,
);

const nodeDependencyShapeHasher = hash.type(graphTypes.nodeDependency);
export const nodeDependency: hash.HashFunction<NodeDependency> = hash.registerTypeHasher(
  graphTypes.nodeDependency,
  nodeDependencyShapeHasher,
);

export const context: hash.HashFunction<Context> = hash.registerTypeHasher(
  graphTypes.context,
  (value: Context) => value.id,
);

export const scope: hash.HashFunction<Scope> = hash.registerTypeHasher(
  graphTypes.scope,
  (value: Scope) => value.id,
);

export const operationType: hash.HashFunction<OperationType> = hash.registerTypeHasher(
  graphTypes.operationType,
  (value: OperationType) => value.name,
);

export const graphOperation: hash.HashFunction<GraphOperation> = hash.registerTypeHasher(
  graphTypes.graphOperation,
  (value: GraphOperation): string => value.id,
);

export const graphAction: hash.HashFunction<GraphAction> = hash.registerTypeHasher(
  graphTypes.graphAction,
  (value: GraphAction): string => value.id,
);

export const event: hash.HashFunction<MusterEvent> = hash.registerTypeHasher(
  graphTypes.event,
  (value: MusterEvent): string => `${hash.string(value.type)}:${hash.any(value.payload)}`,
);

export const proxiedNode: hash.HashFunction<ProxiedNode> = hash.registerTypeHasher(
  graphTypes.proxiedNode,
  (value: ProxiedNode): string => `P(${getProxiedNodeValue(value).id})`,
);
