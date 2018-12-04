import mapValues from 'lodash/mapValues';
import { array } from '../nodes/collection/array';
import { isNodeListNodeDefinition } from '../nodes/collection/node-list';
import {
  GraphOperation,
  isGraphNode,
  isGraphOperation,
  isMatcher,
  isNodeDefinition,
  NodeData,
  NodeDefinition,
  NodeName,
  NodeProperties,
  NodeState,
  OperationName,
  OperationProperties,
  SerializedGraphOperation,
  SerializedMusterType,
  SerializedMusterTypeData,
  SerializedNodeDefinition,
  SerializedNodeProperties,
  SerializedOperationProperties,
} from '../types/graph';
import { Matcher } from '../types/matchers';
import { getMusterTypesMap } from './types-registry';

/**
 * A helper function used for serializing the [[GraphNode]] to a JSON that can be safely send
 * to the remote or back to the client. It uses a node-specific implementation of sanitizer
 * to figure out how best to represent the node as JSON.
 * @param value
 * @returns {string}
 */
export function serialize(value: any): string {
  return JSON.stringify(sanitize(value));
}

export function sanitize(value: any): any {
  if (isMatcher(value)) return sanitizeMusterType(value);
  if (isGraphOperation(value)) return sanitizeGraphOperation(value);
  if (isNodeDefinition(value)) return sanitizeNode(value);
  return value;
}

export function sanitizeMusterType(type: Matcher<any, any>): SerializedMusterType {
  return {
    $musterType: type.metadata.name,
    data: sanitizeMusterTypeMetadata(type),
  };
}

export function sanitizeMusterTypeMetadata(
  type: Matcher<any, any>,
): SerializedMusterTypeData | undefined {
  const musterType = getMusterTypesMap()[type.metadata.name];
  if (!musterType) {
    throw new Error(`Unable to serialize ${type.metadata.name} type matcher.`);
  }
  if (!musterType.serialize) return undefined;
  return musterType.serialize(type, sanitize);
}

export function sanitizeGraphOperation(operation: GraphOperation): SerializedGraphOperation {
  return {
    $operation: operation.type.name,
    id: operation.id,
    data: sanitizeGraphOperationProperties(operation),
  };
}

function sanitizeGraphOperationProperties<
  T extends OperationName,
  P extends OperationProperties,
  S extends SerializedOperationProperties = P
>(operation: GraphOperation<T, P, S>): S {
  const operationType = operation.type;
  if (operationType.serialize === false) {
    throw new Error(`Unable to serialize ${operationType.name} operation`);
  }
  if (operationType.serialize) return operationType.serialize(operation.properties, sanitize);
  return mapValues(operation.properties, (value, key) => {
    if (isSanitizable(value)) return sanitize(value);
    if (Array.isArray(value)) {
      return value.map((child: any) =>
        isSanitizable(child) ? sanitize(child) : sanitizeObject(child),
      );
    }
    if (typeof value === 'function') {
      throw new Error(`Unable to serialize ${operationType.name} operation: ${key} is a function`);
    }
    if (isGraphNode(value)) {
      throw new Error(
        `Unable to serialize ${operationType.name} operation: ${key} is a scoped node`,
      );
    }
    return value;
  }) as { [K in keyof S]: S[K] };
}

function sanitizeNode<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition<T, P, S, D, V>): SerializedNodeDefinition {
  // TODO: Remove this hack once collections are refactored
  if (isNodeListNodeDefinition(node)) {
    return sanitize(array(node.properties.items.map((item) => item.definition)));
  }
  return {
    $type: node.type.name,
    data: sanitizeNodeProperties(node),
  };
}

function sanitizeNodeProperties<
  T extends NodeName = NodeName,
  P extends NodeProperties = NodeProperties,
  S extends NodeState = NodeState,
  D extends NodeData = NodeData,
  V extends SerializedNodeProperties = P
>(node: NodeDefinition<T, P, S, D, V>): V {
  const nodeType = node.type;
  if (nodeType.serialize === false) {
    throw new Error(`Unable to serialize ${nodeType.name} node`);
  }
  if (nodeType.serialize) {
    return nodeType.serialize(node.properties, sanitize);
  }
  return mapValues(node.properties, (value, key) => {
    if (isSanitizable(value)) return sanitize(value);
    if (Array.isArray(value)) {
      return value.map((child: any) => (isSanitizable(child) ? sanitize(child) : child));
    }
    if (typeof value === 'function') {
      throw new Error(`Unable to serialize ${nodeType.name} node: ${key} is a function`);
    }
    if (isGraphNode(value)) {
      throw new Error(`Unable to serialize ${nodeType.name} node: ${key} is a scoped node`);
    }
    return value;
  }) as { [K in keyof V]: V[K] };
}

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  return mapValues(obj, (value) => {
    if (isSanitizable(value)) return sanitize(value);
    return sanitizeObject(value);
  });
}

export function isSerializedNode(value: any): value is SerializedNodeDefinition {
  return Boolean(value && typeof value.$type === 'string');
}

export function isSerializedGraphOperation(value: any): value is SerializedGraphOperation {
  return Boolean(value && typeof value.$operation === 'string');
}

export function isSerializedMusterType(value: any): value is SerializedMusterType {
  return Boolean(value && typeof value.$musterType === 'string');
}

export function isSanitizable(
  value: any,
): value is NodeDefinition | GraphOperation | Matcher<any, any> {
  return isNodeDefinition(value) || isGraphOperation(value) || isMatcher(value);
}
