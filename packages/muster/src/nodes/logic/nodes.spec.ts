import {
  AndNodeType,
  ChooseNodeType,
  EqNodeType,
  GteNodeType,
  GtNodeType,
  IfElseNodeType,
  LteNodeType,
  LtNodeType,
  NotNodeType,
  OrNodeType,
  OtherwiseNodeType,
  SwitchOnNodeType,
  WhenNodeType,
} from '../..';

import { LogicNodeTypes } from './nodes';

describe('Logic graph extensions', () => {
  it('SHOULD export all of the required node types', () => {
    expect(LogicNodeTypes).toEqual([
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
    ]);
  });
});
