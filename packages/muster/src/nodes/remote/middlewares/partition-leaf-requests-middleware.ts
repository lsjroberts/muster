// import {
//   NodeDefinition,
//   StatefulGraphNode,
//   StatefulNodeDefinition,
//   StatefulNodeType,
// } from '../../../types/graph';
// import createNodeDefinition from '../../../utils/create-node-definition';
// import { createNodeType } from '../../../utils/create-node-type';
// import * as types from '../../../utils/types';
// import { RequestOperation } from '../operations/request';
//
// export interface PartitionLeafRequestsMiddlewareNode extends StatefulGraphNode<
//   'partition-leaf-requests-middleware',
//   PartitionLeafRequestsMiddlewareNodeProperties,
//   PartitionLeafRequestsMiddlewareNodeState,
//   PartitionLeafRequestsMiddlewareNodeData
// > {
// }
//
// export interface PartitionLeafRequestsMiddlewareNodeDefinition extends StatefulNodeDefinition<
//   'partition-leaf-requests-middleware',
//   PartitionLeafRequestsMiddlewareNodeProperties,
//   PartitionLeafRequestsMiddlewareNodeState,
//   PartitionLeafRequestsMiddlewareNodeData
// > {
// }
//
// export interface PartitionLeafRequestsMiddlewareNodeProperties {
// }
//
// export interface PartitionLeafRequestsMiddlewareNodeState {
//
// }
//
// export interface PartitionLeafRequestsMiddlewareNodeData {
//
// }
//
// export const PartitionLeafRequestsMiddlewareNodeType: StatefulNodeType<
//   'partition-leaf-requests-middleware',
//   PartitionLeafRequestsMiddlewareNodeProperties,
//   PartitionLeafRequestsMiddlewareNodeState,
//   PartitionLeafRequestsMiddlewareNodeData
// > =
// createNodeType<
//   'partition-leaf-requests-middleware',
//   PartitionLeafRequestsMiddlewareNodeProperties,
//   PartitionLeafRequestsMiddlewareNodeState,
//   PartitionLeafRequestsMiddlewareNodeData
// >('partition-leaf-requests-middleware', {
//   shape: {
//     log: types.bool,
//     streamFactory: types.func,
//   },
//   state: {
//
//   },
//   getInitialState() {
//     return {};
//   },
//   operations: {
//     request: {
//       run(
//         node: PartitionLeafRequestsMiddlewareNode,
//         operation: RequestOperation,
//       ): NodeDefinition {
//
//       },
//     },
//   },
// });
//
// export function partitionLeafRequestsMiddleware(): PartitionLeafRequestsMiddlewareNodeDefinition {
//   return createNodeDefinition(PartitionLeafRequestsMiddlewareNodeType, {});
// }
