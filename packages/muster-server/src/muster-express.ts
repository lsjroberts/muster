import {
  attachMetadata,
  buildNodeTypesMap,
  CallNodeType,
  CombineLatestNodeType,
  ContextNodeType,
  ContextValuesDefinitions,
  deserialize,
  downgradeGraph,
  EntriesNodeType,
  error,
  FieldsNodeType,
  FirstItemNodeType,
  FnNodeType,
  getMusterOperationTypesMap,
  GetNodeType,
  GraphWithMetadata,
  HeadNodeType,
  KeyNodeType,
  LegacyQueryNodeType,
  Muster,
  NodeType,
  ParallelNodeType,
  QueryNodeType,
  QuerySetCallOperationNodeType,
  QuerySetGetChildOperationNodeType,
  QuerySetGetItemsOperationNodeType,
  QuerySetNodeType,
  QuerySetOperationNodeType,
  QuerySetResultNodeType,
  QuerySetSetOperationNodeType,
  RootNodeType,
  sanitize,
  SeriesNodeType,
  SetNodeType,
  toGraphWithMetadata,
  upgradeGraph,
  ValueNodeType,
  WithTransformsNodeType,
} from '@dws/muster';
import {
  ArithmeticNodeTypes,
  KeysNodeTypes,
  LogicNodeTypes,
  StringNodeTypes,
  TransformsNodeTypes,
} from '@dws/muster/nodes';
import { Request, RequestHandler, Response } from 'express';

export type NodeTypesArray = Array<NodeType>;

export const DEFAULT_WHITELISTED_NODE_TYPES: NodeTypesArray = [
  ...ArithmeticNodeTypes,
  ...KeysNodeTypes,
  ...TransformsNodeTypes,
  ...LogicNodeTypes,
  ...StringNodeTypes,
  FirstItemNodeType,
  CallNodeType,
  CombineLatestNodeType,
  ContextNodeType,
  FieldsNodeType,
  FnNodeType,
  GetNodeType,
  HeadNodeType,
  KeyNodeType,
  EntriesNodeType,
  LegacyQueryNodeType,
  QueryNodeType,
  QuerySetCallOperationNodeType,
  QuerySetGetChildOperationNodeType,
  QuerySetGetItemsOperationNodeType,
  QuerySetNodeType,
  QuerySetOperationNodeType,
  QuerySetResultNodeType,
  QuerySetSetOperationNodeType,
  ParallelNodeType,
  RootNodeType,
  SeriesNodeType,
  SetNodeType,
  ValueNodeType,
  WithTransformsNodeType,
];

export interface MusterExpressConfig {
  enableRequestLogging: boolean;
  whitelistedNodeTypes: NodeTypesArray;
}

const defaultConfig: MusterExpressConfig = {
  enableRequestLogging: false,
  whitelistedNodeTypes: DEFAULT_WHITELISTED_NODE_TYPES,
};

let nextRequestNumber = 1;

export function musterExpress(
  app: Muster,
  config: Partial<MusterExpressConfig> = {},
): RequestHandler {
  const mergedConfig = Object.assign({}, defaultConfig, config);
  const whitelistedNodesMap = buildNodeTypesMap(mergedConfig.whitelistedNodeTypes);
  const operationsMap = getMusterOperationTypesMap();
  return (req: Request, res: Response): void => {
    // tslint:disable-next-line:no-increment-decrement
    const requestNumber = nextRequestNumber++;
    const graphWithMetadata = toGraphWithMetadata(req.body);
    catchErrors(res, graphWithMetadata, requestNumber, () => {
      if (mergedConfig.enableRequestLogging) {
        console.log(`REQUEST [${requestNumber}]:`, JSON.stringify(req.body));
      }
      const upgradedGraph = upgradeGraph(graphWithMetadata);
      const query = deserialize(whitelistedNodesMap, operationsMap, upgradedGraph.graph);
      const resolveOptions = {
        context: (req as any).context as ContextValuesDefinitions,
        raw: true as true,
      };
      app.resolve(query, resolveOptions).then((value) => {
        catchErrors(res, graphWithMetadata, requestNumber, () => {
          const response = attachMetadata(sanitize(value));
          const downgradedGraph = downgradeGraph(response, graphWithMetadata.version);
          const serializedGraph = JSON.stringify(downgradedGraph);
          if (mergedConfig.enableRequestLogging) {
            console.log(`RESPONSE [${requestNumber}]:`, serializedGraph);
          }
          res.setHeader('Content-Type', 'application/json');
          res.send(serializedGraph);
        });
      });
    });
  };

  function catchErrors(
    res: Response,
    graphWithMetadata: GraphWithMetadata,
    requestNumber: number,
    fn: () => void,
  ): void {
    try {
      fn();
    } catch (ex) {
      const serializedError = JSON.stringify(
        downgradeGraph(attachMetadata(sanitize(error(ex))), graphWithMetadata.version),
      );
      if (mergedConfig.enableRequestLogging) {
        console.log(`RESPONSE ERR [${requestNumber}]:`, serializedError);
      }
      res.setHeader('Content-Type', 'application/json');
      res.status(400);
      res.send(serializedError);
    }
  }
}

export * from './nodes';
