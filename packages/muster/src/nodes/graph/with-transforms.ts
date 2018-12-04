import {
  NodeDefinition,
  StaticGraphNode,
  StaticNodeDefinition,
  StaticNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { EntriesNodeDefinition } from './entries';

export interface WithTransformsNode
  extends StaticGraphNode<'withTransforms', WithTransformsNodeProperties> {}

export interface WithTransformsNodeDefinition
  extends StaticNodeDefinition<'withTransforms', WithTransformsNodeProperties> {}

export interface WithTransformsNodeProperties {
  transforms: Array<NodeDefinition>;
  fields: EntriesNodeDefinition;
}

export const WithTransformsNodeType: StaticNodeType<
  'withTransforms',
  WithTransformsNodeProperties
> = createNodeType<'withTransforms', WithTransformsNodeProperties>('withTransforms', {
  shape: {
    transforms: types.arrayOf(graphTypes.nodeDefinition),
    fields: graphTypes.nodeDefinition,
  },
});

export function withTransforms(
  transforms: Array<NodeDefinition>,
  fields: EntriesNodeDefinition,
): WithTransformsNodeDefinition {
  return createNodeDefinition(WithTransformsNodeType, {
    transforms,
    fields,
  } as WithTransformsNodeProperties);
}

export function isWithTransformsNodeDefinition(
  array: NodeDefinition,
): array is WithTransformsNodeDefinition {
  return array.type === WithTransformsNodeType;
}
