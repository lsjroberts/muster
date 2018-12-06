import fromPairs from 'lodash/fromPairs';
import { resolveOperation } from '../operations/resolve';
import {
  Dependency,
  GraphAction,
  GraphNode,
  GraphOperation,
  isGraphNode,
  NODE_TYPE,
  NodeDefinition,
  NodeName,
  OperationName,
  StatelessGraphNode,
  StatelessNodeType,
  StatelessOperationHandler,
} from '../types/graph';
import createGraphAction from './create-graph-action';
import { getInvalidTypeErrorMessage } from './get-invalid-type-error';
import * as graphTypes from './graph-types';
import * as hash from './hash';
import supportsOperationType from './supports-operation-type';
import * as types from './types';

export interface OperationComposerNodeType<T extends NodeName>
  extends StatelessNodeType<T, OperationComposerProperties> {}

export interface OperationComposerNode<T extends NodeName>
  extends StatelessGraphNode<T, OperationComposerProperties> {}

export interface OperationComposerNodeDefinition<T extends NodeName>
  extends NodeDefinition<T, OperationComposerProperties, never, never, never> {}

export interface OperationComposerProperties {
  current: NodeDefinition | GraphNode;
  next: NodeDefinition | GraphNode;
}

export default function createOperationComposer<
  T extends NodeName,
  M extends OperationName,
  O extends GraphOperation<M, { next?: GraphNode }>
>(name: T, operations: Array<M>): OperationComposerNodeType<T> {
  const nodeType = {
    [NODE_TYPE]: true as true,
    name,
    shape: types.shape({
      current: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
      next: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
    }),
    is(value: GraphNode): value is StatelessGraphNode<T, OperationComposerProperties> {
      return isGraphNode(value) && value.definition.type === nodeType;
    },
    state: undefined,
    getInitialState: undefined,
    onSubscribe: undefined,
    onUnsubscribe: undefined,
    hash: hash.object,
    hashState: undefined,
    serialize: false as false,
    deserialize: false as false,
    operations: fromPairs(
      operations.map(
        (operationName: M) =>
          [
            operationName,
            {
              cacheable: true,
              getContextDependencies(): Array<never> {
                return [];
              },
              getDependencies(definition: OperationComposerNodeDefinition<T>): Array<Dependency> {
                const { current, next } = definition.properties;
                return [
                  getOperationHandlerDependency(operationName, current),
                  getOperationHandlerDependency(operationName, next),
                ];
              },
              run(
                node: OperationComposerNode<T>,
                operation: O,
                [current, next]: [GraphNode, GraphNode],
              ): GraphAction {
                const composedOperation = next
                  ? Object.assign({}, operation, {
                      properties: {
                        ...operation.properties,
                        next,
                      },
                    })
                  : operation;
                return createGraphAction(current, composedOperation);
              },
            },
          ] as [string, StatelessOperationHandler<T, OperationComposerProperties, never, M, O>],
      ),
    ),
  };
  return nodeType;
}

function getOperationHandlerDependency(
  operationName: OperationName,
  target: NodeDefinition | GraphNode,
): Dependency {
  return {
    target,
    operation: resolveOperation({
      until: {
        predicate: supportsOperationType.bind(null, operationName),
        errorMessage(node: GraphNode): string {
          return getInvalidTypeErrorMessage(
            `Target node does not support the "${operationName}" operation`,
            { received: node.definition },
          );
        },
      },
      allowErrors: false,
      allowPending: false,
      acceptNil: false,
    }),
    allowErrors: false,
    allowPending: false,
    invalidate: true,
  };
}
