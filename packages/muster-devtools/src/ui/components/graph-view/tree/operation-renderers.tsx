import { EvaluateOperationType, GetChildOperationType } from '@dws/muster';
import * as React from 'react';

import { GraphTreeEdge, GraphTreeHelpers } from '../../../../utils/parse-graph-tree';
import EvaluateRenderer, { SerializedEvaluateOperation } from './operations/evaluate-renderer';
import GetChildRenderer, { SerializedGetChildOperation } from './operations/get-child-renderer';

const OPERATION_RENDERERS: {
  [key: string]: (edge: GraphTreeEdge, helpers: GraphTreeHelpers) => JSX.Element;
} = {
  [EvaluateOperationType.name]: (
    edge: GraphTreeEdge<SerializedEvaluateOperation>,
    helpers: GraphTreeHelpers,
  ) => <EvaluateRenderer edge={edge} helpers={helpers} />,
  [GetChildOperationType.name]: (
    edge: GraphTreeEdge<SerializedGetChildOperation>,
    helpers: GraphTreeHelpers,
  ) => <GetChildRenderer edge={edge} helpers={helpers} />,
};

export default OPERATION_RENDERERS;
