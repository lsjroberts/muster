import {
  GraphAction,
  GraphNode,
  GraphOperation,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import { getInvalidTypeErrorMessage } from '../../utils';
import createGraphAction from '../../utils/create-graph-action';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import supportsOperationType from '../../utils/supports-operation-type';
import * as types from '../../utils/types';

/**
 * An instance of the [[fuzzyTraverse]] node.
 * See the [[fuzzyTraverse]] documentation to find out more.
 */
export interface FuzzyTraverseNode
  extends StatelessGraphNode<'fuzzyTraverse', FuzzyTraverseNodeProperties> {}

/**
 * A definition of the [[fuzzyTraverse]] node.
 * See the [[fuzzyTraverse]] documentation to find out more.
 */
export interface FuzzyTraverseNodeDefinition
  extends StatelessNodeDefinition<'fuzzyTraverse', FuzzyTraverseNodeProperties> {}

export interface FuzzyTraverseNodeProperties {
  operation: GraphOperation;
  target: NodeDefinition | GraphNode;
}

/**
 * The implementation of the [[fuzzyTraverse]].
 * See the [[fuzzyTraverse]] documentation to learn more.
 */
export const FuzzyTraverseNodeType: StatelessNodeType<
  'fuzzyTraverse',
  FuzzyTraverseNodeProperties
> = createNodeType<'fuzzyTraverse', FuzzyTraverseNodeProperties>('fuzzyTraverse', {
  serialize: false,
  deserialize: false,
  shape: {
    operation: graphTypes.graphOperation,
    target: types.oneOfType([graphTypes.graphNode, graphTypes.nodeDefinition]),
  },
  operations: {
    evaluate: {
      getDependencies({ operation, target }: FuzzyTraverseNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: {
              predicate(node: GraphNode) {
                return supportsOperationType(operation.type.name, node.definition);
              },
              errorMessage(node: GraphNode) {
                return getInvalidTypeErrorMessage(
                  `Node does not support ${operation.type.name} operation`,
                  {
                    expected: `Node supporting ${operation.type.name} operation`,
                    received: node.definition,
                  },
                );
              },
            },
          },
        ];
      },
      run(node: FuzzyTraverseNode, operation: never, [target]: Array<never>): GraphAction {
        return createGraphAction(target, node.definition.properties.operation);
      },
    },
  },
});

export function fuzzyTraverse(
  target: GraphNode | NodeDefinition,
  operation: GraphOperation,
): FuzzyTraverseNodeDefinition {
  return createNodeDefinition(FuzzyTraverseNodeType, {
    operation,
    target,
  });
}

export function isFuzzyTraverseNodeDefinition(
  value: NodeDefinition,
): value is FuzzyTraverseNodeDefinition {
  return value.type === FuzzyTraverseNodeType;
}
