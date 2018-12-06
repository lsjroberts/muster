import { NodeType } from '../../types/graph';
import { AddItemAtNodeType } from './add-item-at';
import { ApplyTransformsNodeType } from './apply-transforms';
import { ArrayNodeType } from './array';
import { ArrayListNodeType } from './array-list';
import { ArrayReducerNodeType } from './array-reducer';
import { ContainsNodeType } from './contains';
import { HeadNodeType } from './head';
import { ItemWithIdNodeType } from './item-with-id';
import { IterateNodeType } from './iterate';
import { KeysNodeTypes } from './keys/nodes';
import { NodeListNodeType } from './node-list';
import { PopNodeType } from './pop';
import { PushNodeType } from './push';
import { ReduceNodeType } from './reduce';
import { RemoveItemNodeType } from './remove-item';
import { RemoveItemAtNodeType } from './remove-item-at';
import { RemoveItemsNodeType } from './remove-items';
import { ShiftNodeType } from './shift';
import { TransduceNodeType } from './transduce';
import { TransformsNodeTypes } from './transforms/nodes';
import { UnshiftNodeType } from './unshift';

export * from './keys/nodes';
export * from './transforms/nodes';

export const CollectionNodeTypes: Array<NodeType> = [
  ...KeysNodeTypes,
  ...TransformsNodeTypes,
  AddItemAtNodeType,
  ApplyTransformsNodeType,
  ArrayNodeType,
  ArrayListNodeType,
  ArrayReducerNodeType,
  ContainsNodeType,
  HeadNodeType,
  ItemWithIdNodeType,
  IterateNodeType,
  NodeListNodeType,
  PopNodeType,
  PushNodeType,
  ReduceNodeType,
  RemoveItemNodeType,
  RemoveItemAtNodeType,
  RemoveItemsNodeType,
  ShiftNodeType,
  TransduceNodeType,
  UnshiftNodeType,
];
