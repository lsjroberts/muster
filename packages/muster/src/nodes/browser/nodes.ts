import { NodeType } from '../../types/graph';
import { LocationNodeType } from './location';
import { LocationDataNodeType } from './location-data';
import { LocationPathNodeType } from './location-path';

export const BrowserNodeTypes: Array<NodeType> = [
  LocationNodeType,
  LocationDataNodeType,
  LocationPathNodeType,
];
