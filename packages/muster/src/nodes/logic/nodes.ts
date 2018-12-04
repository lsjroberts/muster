import { NodeType } from '../../types/graph';
import { AndNodeType } from './and';
import { ChooseNodeType } from './choose';
import { EqNodeType } from './eq';
import { GtNodeType } from './gt';
import { GteNodeType } from './gte';
import { IfElseNodeType } from './if-else';
import { LtNodeType } from './lt';
import { LteNodeType } from './lte';
import { NotNodeType } from './not';
import { OrNodeType } from './or';
import { OtherwiseNodeType } from './otherwise';
import { SwitchOnNodeType } from './switch-on';
import { WhenNodeType } from './when';

export const LogicNodeTypes: Array<NodeType> = [
  AndNodeType,
  ChooseNodeType,
  EqNodeType,
  GtNodeType,
  GteNodeType,
  IfElseNodeType,
  LtNodeType,
  LteNodeType,
  NotNodeType,
  OrNodeType,
  OtherwiseNodeType,
  SwitchOnNodeType,
  WhenNodeType,
];
