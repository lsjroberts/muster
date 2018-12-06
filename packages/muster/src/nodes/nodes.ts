import { NodeType } from '../types/graph';
import { ArithmeticNodeTypes } from './arithmetic';
import { BrowserNodeTypes } from './browser';
import { CollectionNodeTypes } from './collection';
import { GraphNodeTypes } from './graph';
import { LogicNodeTypes } from './logic';
import { RemoteNodeTypes } from './remote';
import { StringNodeTypes } from './string';

export const DEFAULT_NODE_TYPES: Array<NodeType> = [
  ...ArithmeticNodeTypes,
  ...BrowserNodeTypes,
  ...CollectionNodeTypes,
  ...GraphNodeTypes,
  ...LogicNodeTypes,
  ...RemoteNodeTypes,
  ...StringNodeTypes,
];
