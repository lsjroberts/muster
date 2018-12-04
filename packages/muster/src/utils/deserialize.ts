import mapValues from 'lodash/mapValues';
import partial from 'lodash/partial';
import {
  GraphOperation,
  NodeDefinition,
  NodeProperties,
  NodeTypeMap,
  OperationProperties,
  OperationTypeMap,
  SerializedGraphOperation,
  SerializedMusterType,
  SerializedNodeDefinition,
} from '../types/graph';
import { Matcher } from '../types/matchers';
import createGraphOperation from './create-graph-operation';
import createNodeDefinition from './create-node-definition';
import { isSerializedGraphOperation, isSerializedMusterType, isSerializedNode } from './serialize';
import { getMusterTypesMap } from './types-registry';

export function deserialize(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  value: any,
): NodeDefinition | GraphOperation | Matcher<any, any> | any {
  if (isSerializedGraphOperation(value)) {
    return deserializeGraphOperation(nodeTypes, operationTypes, value);
  }
  if (isSerializedMusterType(value)) {
    return deserializeMusterType(nodeTypes, operationTypes, value);
  }
  if (isSerializedNode(value)) {
    return deserializeNode(nodeTypes, operationTypes, value);
  }
  return value;
}

export function deserializeMusterType(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  type: SerializedMusterType,
): Matcher<any, any> {
  const musterType = getMusterTypesMap()[type.$musterType];
  if (!musterType) {
    throw new Error(`Unrecognised muster type: "${type.$musterType}".`);
  }
  return musterType.deserialize(type.data, (value: any) =>
    deserialize(nodeTypes, operationTypes, value),
  );
}

export function deserializeGraphOperation(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  operation: SerializedGraphOperation,
): GraphOperation {
  const operationType = operationTypes[operation.$operation];
  if (!operationType) {
    throw new Error(`Unrecognised operation type: "${operation.$operation}"`);
  }
  if (operationType.deserialize === false) {
    throw new Error(`Unable to deserialize ${operationType.name} operation`);
  }
  return createGraphOperation(
    operationType,
    operationType.deserialize
      ? operationType.deserialize(operation.data, partial(deserialize, nodeTypes, operationTypes))
      : deserializeOperationProperties(nodeTypes, operationTypes, operation),
  );
}

function deserializeOperationProperties(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  operation: SerializedGraphOperation,
): OperationProperties {
  return mapValues(operation.data, (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => deserializeValue(nodeTypes, operationTypes, item));
    }
    return deserializeValue(nodeTypes, operationTypes, value);
  });
}

export function deserializeNode(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  node: SerializedNodeDefinition,
): NodeDefinition {
  const nodeType = nodeTypes[node.$type];
  if (!nodeType) {
    throw new Error(`Unrecognised node type: "${node.$type}"`);
  }
  if (nodeType.deserialize === false) {
    throw new Error(`Unable to deserialize ${nodeType.name} node`);
  }
  const nodeProperties = nodeType.deserialize
    ? nodeType.deserialize(node.data, partial(deserialize, nodeTypes, operationTypes))
    : deserializeNodeProperties(nodeTypes, operationTypes, node);
  if (!nodeType.shape(nodeProperties)) {
    throw new Error(`Unable to deserialize ${nodeType.name} node`);
  }
  return createNodeDefinition(nodeType, nodeProperties);
}

function deserializeNodeProperties(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  node: SerializedNodeDefinition,
): NodeProperties {
  return mapValues(node.data, (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => deserializeValue(nodeTypes, operationTypes, item));
    }
    return deserializeValue(nodeTypes, operationTypes, value);
  });
}

function deserializeValue<T>(
  nodeTypes: NodeTypeMap,
  operationTypes: OperationTypeMap,
  obj: T,
): T | NodeDefinition | GraphOperation {
  if (obj instanceof Error) return obj;
  if (isSerializedNode(obj)) return deserializeNode(nodeTypes, operationTypes, obj);
  if (isSerializedGraphOperation(obj)) {
    return deserializeGraphOperation(nodeTypes, operationTypes, obj);
  }
  return obj;
}
