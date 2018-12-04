import { GraphOperation, OperationType } from '../types/graph';
import createGraphOperation from '../utils/create-graph-operation';
import { createOperationType } from '../utils/create-operation-type';

/**
 * A definition of the `identity` graph operation.
 * See the [[identityOperation]] documentation to find out more.
 */
export interface IdentityOperation extends GraphOperation<'identity'> {}

/**
 * An implementation of the [[identityOperation]].
 * See the [[identityOperation]] documentation to find out more.
 */
export const IdentityOperationType: OperationType<'identity'> = createOperationType<'identity'>(
  'identity',
);

let instance: IdentityOperation | undefined;

/**
 * Creates a new instance of [[identityOperation]]. This operation is used to instruct Muster to
 * return the node unchanged, and that it should not be traversed by Muster. It works similarly
 * to the `identity` function from Lodash.
 */
export function identityOperation(): IdentityOperation {
  return instance || (instance = createGraphOperation(IdentityOperationType));
}

export function isIdentityOperation(value: GraphOperation): value is IdentityOperation {
  return value.type === IdentityOperationType;
}
