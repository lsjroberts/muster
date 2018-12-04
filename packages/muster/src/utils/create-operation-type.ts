import {
  NodeDefinition,
  OPERATION_TYPE,
  OperationName,
  OperationProperties,
  OperationType,
  SerializedOperationProperties,
} from '../types/graph';
import { ShapeFields } from '../types/matchers';
import { registerOperationType } from './types-registry';

// Ensure the graph hashers and matchers are loaded before any node types are created
import './graph-hash';
import './graph-types';
import * as hash from './hash';
import * as types from './types';

export interface OperationDefinition<
  P extends OperationProperties,
  S extends SerializedOperationProperties = P
> {
  shape?: ShapeFields<P>;
  cacheable?: boolean;
  serialize?: false | (<T>(value: P, serialize: (value: NodeDefinition) => T) => S);
  deserialize?: false | (<T>(value: S, deserialize: (value: T) => NodeDefinition) => P);
}

export function createOperationType<T extends OperationName>(name: T): OperationType<T>;

export function createOperationType<
  T extends OperationName,
  P extends OperationProperties,
  S extends SerializedOperationProperties = P
>(name: T, definition: OperationDefinition<P, S>): OperationType<T, P, S>;

export function createOperationType<
  T extends OperationName,
  P extends OperationProperties,
  S extends SerializedOperationProperties
>(name: T, definition?: OperationDefinition<P, S>): OperationType<T, P, S> {
  const shape = types.shape((definition && definition.shape) || {});
  const { deserialize, serialize } = definition || ({} as OperationDefinition<P, S>);
  const operationType: OperationType<T, P, S> = {
    [OPERATION_TYPE]: true,
    name,
    shape,
    hash: hash.type(shape),
    deserialize,
    serialize,
  };
  registerOperationType(operationType);
  return operationType;
}
