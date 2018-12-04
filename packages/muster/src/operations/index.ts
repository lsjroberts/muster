import { OperationType } from '../types/graph';
import { CallOperationType } from './call';
import { EvaluateOperationType } from './evaluate';
import { GetChildOperationType } from './get-child';
import { GetItemsOperationType } from './get-items';
import { IdentityOperationType } from './identity';
import { IsPendingOperationType } from './is-pending';
import { IsUpdatingOperationType } from './is-updating';
import { IterateOperationType } from './iterate';
import { ResetOperationType } from './reset';
import { ResolveOperationType } from './resolve';
import { SetOperationType } from './set';

export * from './call';
export * from './evaluate';
export * from './get-child';
export * from './get-items';
export * from './is-pending';
export * from './is-updating';
export * from './iterate';
export * from './reset';
export * from './resolve';
export * from './set';

export default [
  CallOperationType,
  EvaluateOperationType,
  GetChildOperationType,
  GetItemsOperationType,
  IdentityOperationType,
  IsPendingOperationType,
  IsUpdatingOperationType,
  IterateOperationType,
  ResetOperationType,
  ResolveOperationType,
  SetOperationType,
] as Array<OperationType>;
