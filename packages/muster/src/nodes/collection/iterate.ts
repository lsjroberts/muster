import { supportsIterateOperation } from '../../operations/iterate';
import {
  GraphNode,
  NodeDefinition,
  NodeDependency,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { arrayReducer } from './array-reducer';
import { supportsStepOperation } from './operations/step';
import { transduce } from './transduce';

export interface IterateNode extends StatelessGraphNode<'iterate', IterateNodeProperties> {}
export interface IterateNodeDefinition
  extends StatelessNodeDefinition<'iterate', IterateNodeProperties> {}

export interface IterateNodeProperties {
  target: NodeDefinition;
  transforms: Array<NodeDefinition | GraphNode>;
}

export const IterateNodeType: StatelessNodeType<'iterate', IterateNodeProperties> = createNodeType<
  'iterate',
  IterateNodeProperties
>('iterate', {
  shape: {
    target: graphTypes.nodeDefinition,
    transforms: types.arrayOf(types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode])),
  },
  operations: {
    evaluate: {
      getDependencies({ target, transforms }: IterateNodeProperties): Array<NodeDependency> {
        return [
          {
            target,
            until: untilSupportsIterateOperation,
          },
          ...transforms.map((transformer) => ({
            target: transformer,
            until: untilSupportsStepOperation,
          })),
        ];
      },
      run(
        node: IterateNode,
        options: never,
        [targetNode, ...transforms]: Array<GraphNode>,
      ): NodeDefinition | GraphNode {
        return withScopeFrom(
          targetNode,
          transduce(targetNode.definition, [...transforms, arrayReducer()]),
        );
      },
    },
  },
});

const untilSupportsIterateOperation = {
  predicate: supportsIterateOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Target node is not iterable', {
      received: node.definition,
    });
  },
};

const untilSupportsStepOperation = {
  predicate: supportsStepOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Supplied transform is not a valid transformer node', {
      received: node.definition,
    });
  },
};

export function iterate(
  target: NodeDefinition,
  transforms?: Array<NodeDefinition | GraphNode>,
): IterateNodeDefinition {
  return createNodeDefinition(IterateNodeType, {
    target,
    transforms: transforms || [],
  });
}
