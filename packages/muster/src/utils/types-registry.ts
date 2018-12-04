import {
  MusterType,
  MusterTypeMap,
  MusterTypeName,
  NodeType,
  NodeTypeMap,
  OperationType,
  OperationTypeMap,
} from '../types/graph';

const musterTypesMap: MusterTypeMap = {};
const nodeTypesMap: NodeTypeMap = {};
const operationTypesMap: OperationTypeMap = {};

export function getMusterTypesMap(): MusterTypeMap {
  return musterTypesMap;
}

export function getMusterNodeTypesMap(): NodeTypeMap {
  return nodeTypesMap;
}

export function getMusterOperationTypesMap(): OperationTypeMap {
  return operationTypesMap;
}

export function buildNodeTypesMap(nodeTypes: Array<NodeType>): NodeTypeMap {
  return nodeTypes.reduce((map: NodeTypeMap, node: NodeType) => {
    map[node.name] = node;
    return map;
  }, {});
}

export function buildOperationTypesMap(operationTypes: Array<OperationType>): OperationTypeMap {
  return operationTypes.reduce((map: OperationTypeMap, node: OperationType) => {
    map[node.name] = node;
    return map;
  }, {});
}

export function registerMusterType<N extends MusterTypeName>(
  name: string,
  musterTypeProps: Omit<MusterType<N>, 'name'>,
): void {
  musterTypesMap[name] = {
    name,
    ...musterTypeProps,
  };
}

export function registerNodeType(nodeType: NodeType): void {
  nodeTypesMap[nodeType.name] = nodeType;
}

export function registerOperationType(operationType: OperationType): void {
  operationTypesMap[operationType.name] = operationType;
}
