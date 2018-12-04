import { NodeType } from '../../types/graph';
import { AddNodeType } from './add';
import { CeilNodeType } from './ceil';
import { ClampNodeType } from './clamp';
import { DivideNodeType } from './divide';
import { FloorNodeType } from './floor';
import { MaxNodeType } from './max';
import { MinNodeType } from './min';
import { ModNodeType } from './mod';
import { MultiplyNodeType } from './multiply';
import { PowNodeType } from './pow';
import { RoundNodeType } from './round';
import { SqrtNodeType } from './sqrt';
import { SubtractNodeType } from './subtract';

export const ArithmeticNodeTypes: Array<NodeType> = [
  AddNodeType,
  CeilNodeType,
  ClampNodeType,
  DivideNodeType,
  FloorNodeType,
  MaxNodeType,
  MinNodeType,
  ModNodeType,
  MultiplyNodeType,
  PowNodeType,
  RoundNodeType,
  SqrtNodeType,
  SubtractNodeType,
];
