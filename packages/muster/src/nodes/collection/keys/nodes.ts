import { NodeType } from '../../../types/graph';
import { FirstNodeType } from './first';
import { LastNodeType } from './last';
import { GetLengthNodeType, LengthNodeType } from './length';
import { NthNodeType } from './nth';

export const KeysNodeTypes: Array<NodeType> = [
  FirstNodeType,
  GetLengthNodeType,
  LastNodeType,
  LengthNodeType,
  NthNodeType,
];
