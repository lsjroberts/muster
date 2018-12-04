import {
  GRAPH_OPERATION,
  GraphOperation,
  OperationName,
  OperationProperties,
  OperationType,
  SerializedOperationProperties,
} from '../types/graph';
import { string as hashString } from './hash';

export default function createGraphOperation<T extends OperationName>(
  operationType: OperationType<T>,
): GraphOperation<T>;

export default function createGraphOperation<
  T extends OperationName,
  P extends OperationProperties,
  S extends SerializedOperationProperties = P,
  N extends OperationType<T, P, S> = OperationType<T, P, S>
>(operationType: N, options: P): GraphOperation<T, P, S, N>;

export default function createGraphOperation<
  T extends OperationName,
  P extends OperationProperties,
  S extends SerializedOperationProperties,
  N extends OperationType<T, P, S>
>(operationType: N, properties: P = {} as P): GraphOperation<T, P, S, N> {
  return {
    [GRAPH_OPERATION]: true,
    id: `${operationType.name}:${hashString(operationType.hash(properties))}`,
    type: operationType,
    properties,
  };
}
