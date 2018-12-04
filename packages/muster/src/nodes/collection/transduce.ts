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
import { resolve } from '../graph/resolve';
import { traverse } from '../graph/traverse';
import { ValueNode, ValueNodeType } from '../graph/value';
import { combinedReducer } from './combined-reducer';
import { init } from './operations/init';
import { result } from './operations/result';
import { reduce } from './reduce';
import isTransformer from './utils/is-transformer';

export interface TransduceNode extends StatelessGraphNode<'transduce', TransduceNodeProperties> {}
export interface TransduceNodeDefinition
  extends StatelessNodeDefinition<'transduce', TransduceNodeProperties> {}

export interface TransduceNodeProperties {
  source: NodeDefinition | GraphNode;
  reducer: NodeDefinition | GraphNode;
}

export const TransduceNodeType: StatelessNodeType<
  'transduce',
  TransduceNodeProperties
> = createNodeType<'transduce', TransduceNodeProperties>('transduce', {
  shape: {
    source: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
    reducer: types.oneOfType([graphTypes.nodeDefinition, graphTypes.graphNode]),
  },
  operations: {
    evaluate: {
      getDependencies({ reducer }: TransduceNodeProperties): Array<NodeDependency> {
        return [
          {
            target: traverse(reducer, init()),
            until: untilValidInitializer,
          },
        ];
      },
      run(node: TransduceNode, options: never, [initialState]: [ValueNode<any>]): NodeDefinition {
        const { source, reducer } = node.definition.properties;
        return resolve(
          [
            {
              target: reduce(source, reducer, initialState.definition.properties.value),
              until: untilValidStepResult,
            },
          ],
          ([acc]: [ValueNode<any>]) =>
            withScopeFrom(
              acc,
              resolve(
                [
                  {
                    target: traverse(reducer, result(acc.definition.properties.value)),
                    until: untilValidResult,
                  },
                ],
                ([finalValue]: [ValueNode<any>]) => finalValue.definition.properties.value,
              ),
            ),
        );
      },
    },
  },
});

const untilValidInitializer = {
  predicate: ValueNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Transduce initializer must resolve to a value node', {
      expected: ValueNodeType,
      received: node.definition,
    });
  },
};

const untilValidStepResult = {
  predicate: ValueNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Transduce step output must resolve to a value node', {
      expected: ValueNodeType,
      received: node.definition,
    });
  },
};

const untilValidResult = {
  predicate: ValueNodeType.is,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Transduce result must resolve to a value node', {
      expected: ValueNodeType,
      received: node.definition,
    });
  },
};

export function transduce(
  source: NodeDefinition | GraphNode,
  reducers: Array<NodeDefinition | GraphNode>,
): TransduceNodeDefinition {
  if (reducers.length === 0) {
    throw new Error('No reducers specified');
  }
  if (!reducers.every(isTransformer)) {
    throw new Error('Invalid transformers passed to transduce');
  }
  return createNodeDefinition(TransduceNodeType, {
    source,
    reducer: composeReducers(reducers),
  });
}

function composeReducers(reducers: Array<NodeDefinition | GraphNode>): NodeDefinition | GraphNode {
  if (reducers.length === 0) {
    throw new Error('No reducer specified');
  }
  if (reducers.length === 1) {
    return reducers[0];
  }
  return combinedReducer(reducers[0], composeReducers(reducers.slice(1)));
}
