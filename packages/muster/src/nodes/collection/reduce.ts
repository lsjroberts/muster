import { iterateOperation, supportsIterateOperation } from '../../operations/iterate';
import {
  GraphNode,
  isGraphNode,
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
import { DoneNode, DoneNodeType } from '../graph/done';
import { IteratorResultNode, IteratorResultNodeType } from '../graph/iterator-result';
import { NilNode, NilNodeType } from '../graph/nil';
import { resolve } from '../graph/resolve';
import { traverse } from '../graph/traverse';
import { value, ValueNode, ValueNodeType } from '../graph/value';
import { step } from './operations/step';

export interface ReduceNode extends StatelessGraphNode<'reduce', ReduceNodeProperties> {}
export interface ReduceNodeDefinition
  extends StatelessNodeDefinition<'reduce', ReduceNodeProperties> {}

export interface ReduceNodeProperties {
  source: NodeDefinition | GraphNode;
  reducer: NodeDefinition | GraphNode;
  initialState: any;
}

export const ReduceNodeType: StatelessNodeType<'reduce', ReduceNodeProperties> = createNodeType<
  'reduce',
  ReduceNodeProperties
>('reduce', {
  shape: {
    source: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
    reducer: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
    initialState: types.any,
  },
  operations: {
    evaluate: {
      getDependencies({ source }: ReduceNodeProperties): Array<NodeDependency> {
        return [
          {
            target: source,
            until: untilSupportsIterateOperation,
          },
        ];
      },
      run(node: ReduceNode, options: never, [iterable]: [GraphNode]): NodeDefinition {
        const { initialState, reducer } = node.definition.properties;
        return getNextIteratorResult(iterable, (iteratorResult) => {
          if (NilNodeType.is(iteratorResult)) {
            return withScopeFrom(iterable, value(initialState));
          }
          const { value: itemValue, next: nextIterator } = iteratorResult.definition.properties;
          const item = isGraphNode(itemValue)
            ? itemValue
            : withScopeFrom(iteratorResult, itemValue);
          return withScopeFrom(
            iteratorResult,
            applyReducerStep(reducer, initialState, item, (transformedResult) => {
              if (DoneNodeType.is(transformedResult)) {
                const resultValue = transformedResult.definition.properties.value!;
                return withScopeFrom(
                  transformedResult,
                  resolve(
                    [
                      {
                        target: resultValue,
                        until: untilValidReducerStep,
                      },
                    ],
                    ([finalValue]: [ValueNode<any>]) => finalValue,
                  ),
                );
              }
              const { value: updatedState } = transformedResult.definition.properties;
              if (!nextIterator) {
                return withScopeFrom(transformedResult, value(updatedState));
              }
              const nextIteratorNode = isGraphNode(nextIterator)
                ? nextIterator
                : withScopeFrom(iteratorResult, nextIterator);
              const nextResult = reduce(nextIteratorNode, reducer, updatedState);
              return withScopeFrom(node, nextResult);
            }),
          );
        });
      },
    },
  },
});

const untilSupportsIterateOperation = {
  predicate: supportsIterateOperation,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Reduce source must be iterable', {
      received: node.definition,
    });
  },
};

const untilValidReducerStep = {
  predicate: ValueNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(
      'Reducer step operation must resolve to a valid result type',
      {
        expected: ValueNodeType,
        received: node.definition,
      },
    );
  },
};

export function reduce(
  source: NodeDefinition | GraphNode,
  reducer: NodeDefinition | GraphNode,
  initialState: any,
): ReduceNodeDefinition {
  return createNodeDefinition(ReduceNodeType, {
    source,
    reducer,
    initialState,
  });
}

export const isValidReducerStepResult: {
  predicate(node: GraphNode): boolean;
  errorMessage(node: GraphNode): string;
} = {
  predicate(node: GraphNode): boolean {
    return (
      ValueNodeType.is(node) || (DoneNodeType.is(node) && Boolean(node.definition.properties.value))
    );
  },
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage(
      'Reducer step operation must resolve to a valid result type',
      {
        expected: [ValueNodeType, DoneNodeType],
        received: node.definition,
      },
    );
  },
};

export function getNextIteratorResult(
  iterable: GraphNode,
  callback: (value: IteratorResultNode | NilNode) => GraphNode,
): NodeDefinition {
  return resolve(
    [
      {
        target: traverse(iterable, iterateOperation()),
        until: untilIsValidIteratorResult,
      },
    ],
    ([iteratorResult]: [IteratorResultNode | NilNode]) => callback(iteratorResult),
  );
}

const untilIsValidIteratorResult: NodeDependency['until'] = {
  predicate: isValidIteratorResult,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('iterate() operation must return a valid iterator result', {
      received: node.definition,
    });
  },
};

function isValidIteratorResult(node: GraphNode): boolean {
  return IteratorResultNodeType.is(node) || NilNodeType.is(node);
}

function applyReducerStep(
  reducer: NodeDefinition | GraphNode,
  acc: any,
  item: GraphNode,
  callback: (value: ValueNode<any> | DoneNode) => GraphNode,
): NodeDefinition {
  return resolve(
    [
      {
        target: traverse(reducer, step(acc, item)),
        until: isValidReducerStepResult,
      },
    ],
    ([transformedResult]: [ValueNode<any> | DoneNode]) => callback(transformedResult),
  );
}
