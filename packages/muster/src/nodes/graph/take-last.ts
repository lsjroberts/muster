import last from 'lodash/last';
import noop from 'lodash/noop';
import { resolveOperation } from '../../operations/resolve';
import {
  isNodeDefinition,
  NodeDefinition,
  NodeExecutionContext,
  NodeLike,
  StatefulGraphNode,
  StatefulNodeDefinition,
  StatefulNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { nil } from './nil';
import { value } from './value';

/**
 * An instance of the [[takeLast]] node.
 * See the [[takeLast]] documentation to find out more.
 */
export interface TakeLastNode extends StatefulGraphNode<'takeLast', TakeLastNodeProperties> {}

/**
 * A definition of the [[takeLast]] node.
 * See the [[takeLast]] documentation to find out more.
 */
export interface TakeLastNodeDefinition
  extends StatefulNodeDefinition<'takeLast', TakeLastNodeProperties> {}

export interface TakeLastNodeProperties {
  operations: Array<NodeDefinition>;
}

export interface TakeLastNodeState {}

export interface TakeLastNodeData {
  unsubscribe: () => void;
}

/**
 * The implementation of the [[takeLast]] node.
 * See the [[takeLast]] documentation to learn more.
 */
export const TakeLastNodeType: StatefulNodeType<
  'takeLast',
  TakeLastNodeProperties,
  TakeLastNodeState,
  TakeLastNodeData
> = createNodeType<'takeLast', TakeLastNodeProperties, TakeLastNodeState, TakeLastNodeData>(
  'takeLast',
  {
    state: {},
    shape: {
      operations: types.arrayOf(graphTypes.nodeDefinition),
    },
    getInitialState(): TakeLastNodeState {
      return {};
    },
    operations: {
      evaluate: {
        run(node: TakeLastNode): NodeDefinition {
          return last(node.definition.properties.operations) || nil();
        },
        onSubscribe(
          this: NodeExecutionContext<TakeLastNodeState, TakeLastNodeData>,
          node: TakeLastNode,
        ): void {
          const { operations } = node.definition.properties;
          const subscriptions = operations
            .slice(0, -1)
            .map((operation) =>
              node.scope.store.subscribe(withScopeFrom(node, operation), resolveOperation(), noop),
            );
          this.setData({
            unsubscribe: () => subscriptions.forEach((unsubscribe) => unsubscribe()),
          });
        },
        onUnsubscribe(this: NodeExecutionContext<TakeLastNodeState, TakeLastNodeData>): void {
          const { unsubscribe } = this.getData();
          if (unsubscribe) {
            unsubscribe();
          }
        },
      },
    },
  },
);

/**
 * Creates a new instance of a [[takeLast]] node, which works in a similar way to the `series` node, but instead of
 * resolving all `operations` as its dependencies, it subscribes to all of them through the store. This prevents
 * these operations from being added to the dependency chain of the [[takeLast]] node.
 * This node is internally used by the [[proxy]] node to disconnect the middleware subscription from the output of the
 * [[proxy]] node.
 */
export function takeLast(operations: Array<NodeDefinition | NodeLike>): TakeLastNodeDefinition {
  return createNodeDefinition(TakeLastNodeType, {
    operations: operations.map(
      (operation) => (isNodeDefinition(operation) ? operation : value(operation)),
    ),
  });
}

export function isTakeLastNodeDefinition(value: NodeDefinition): value is TakeLastNodeDefinition {
  return value.type === TakeLastNodeType;
}
