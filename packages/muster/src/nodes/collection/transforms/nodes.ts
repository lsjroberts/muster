import { NodeType } from '../../../types/graph';
import { CountNodeType } from './count';
import { FilterNodeType } from './filter';
import { FirstItemNodeType } from './first-item';
import { LastItemNodeType } from './last-item';
import { MapNodeType } from './map';
import { NthItemNodeType } from './nth-item';
import { SkipNodeType } from './skip';
import { SliceNodeType } from './slice';
import { SortNodeType, SortOrderNodeType } from './sort';
import { TakeNodeType } from './take';
import { UniqueNodeType } from './unique';

export const TransformsNodeTypes: Array<NodeType> = [
  CountNodeType,
  FilterNodeType,
  FirstItemNodeType,
  LastItemNodeType,
  MapNodeType,
  NthItemNodeType,
  SkipNodeType,
  SliceNodeType,
  SortNodeType,
  SortOrderNodeType,
  TakeNodeType,
  UniqueNodeType,
];
