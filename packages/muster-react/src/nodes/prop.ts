import {
  createNodeDefinition,
  createNodeType,
  error,
  getInvalidTypeError,
  graphTypes,
  isNodeDefinition,
  NodeDefinition,
  NodeExecutionContext,
  pending,
  StatefulGraphNode,
  StatefulNodeType,
  toValue,
  types,
  value,
  ValueNode,
  ValueNodeType,
} from '@dws/muster';
import { isObservable, ObservableLike, Subscription } from '@dws/muster-observable';

export const REACT_PROP_CONTEXT_NAME = '$$props';

/**
 * An instance of the [[prop]] node.
 * See the [[prop]] documentation to find out more.
 */
export interface PropNode
  extends StatefulGraphNode<'prop', PropNodeProperties, PropNodeState, PropNodeData> {}

/**
 * A definition of the [[prop]] node.
 * See the [[prop]] documentation to find out more.
 */
export interface PropNodeDefinition
  extends NodeDefinition<'prop', PropNodeProperties, PropNodeState, PropNodeData> {}

export interface PropNodeProperties {
  name: string;
}

export interface PropNodeState {
  currentValue: NodeDefinition;
}

export interface PropNodeData {
  subscription: Subscription;
}

/**
 * The implementation of the [[prop]] node.
 * See the [[prop]] documentation to learn more.
 */
export const PropNodeType: StatefulNodeType<
  'prop',
  PropNodeProperties,
  PropNodeState
> = createNodeType<'prop', PropNodeProperties, PropNodeState>('prop', {
  state: {
    currentValue: graphTypes.nodeDefinition,
  },
  shape: {
    name: types.string,
  },
  getInitialState(): PropNodeState {
    return {
      currentValue: pending(),
    };
  },
  operations: {
    evaluate: {
      run(
        node: PropNode,
        options: never,
        dependencies: Array<never>,
        context: Array<never>,
        state: PropNodeState,
      ): NodeDefinition {
        return state.currentValue;
      },
      onSubscribe(this: NodeExecutionContext<PropNodeState, PropNodeData>, node: PropNode): void {
        // Check if the right context value is set
        if (!(REACT_PROP_CONTEXT_NAME in node.context.values)) {
          this.setState({
            currentValue: error('Prop node can only be used within a container'),
          });
          return;
        }
        // Verify the props context value
        const propsNode = node.context.values[REACT_PROP_CONTEXT_NAME];
        if (!ValueNodeType.is(propsNode)) {
          this.setState({
            currentValue: error(
              getInvalidTypeError('Invalid type of props stream supplied with the context.', {
                expected: ['value(ObservableLike<any>)'],
                received: propsNode,
              }),
            ),
          });
          return;
        }
        // Verify the props stream
        const propsStream = (propsNode as ValueNode<ObservableLike<any>>).definition.properties
          .value;
        if (!isObservable(propsStream)) {
          this.setState({
            currentValue: error(
              getInvalidTypeError('React props context value has invalid type.', {
                expected: ['Observable<any>'],
                received: propsStream,
              }),
            ),
          });
          return;
        }
        const { subscription: previousSubscription } = this.getData();
        this.setData({
          subscription: propsStream.subscribe((props) => {
            this.setState({
              currentValue: props
                ? toValue(props[node.definition.properties.name])
                : value(undefined),
            });
          }),
        });
        previousSubscription && previousSubscription.unsubscribe();
      },
      onUnsubscribe(this: NodeExecutionContext<PropNodeState, PropNodeData>): void {
        const { subscription } = this.getData();
        subscription && subscription.unsubscribe();
      },
    },
  },
});

/**
 * Creates a new instance of the [[prop]] node, which is used when accessing a value of a property
 * from within the local container graph. See the **Accessing react props from the local graph** example in the
 * README.md to learn more.
 *
 * @example **Access a property form local graph**
 * ```js
 * import { computed, container, prop, types } from '@dws/muster-react';
 *
 * const myContainer = container({
 *   graph: {
 *     greeting: computed(
 *       [prop('firstName')],
 *       (firstName) => `Hello, ${firstName}`,
 *     ),
 *   },
 *   props: {
 *     greeting: true,
 *   }
 * });
 *
 * // Example usage:
 * // const MyComponent = myContainer(({ greeting }) =>  <h1>{greeting}</h1>);
 * // <MyComponent firstName="Bob" />
 * ```
 * This example shows how to use the [[prop]] node to access the value of a property from within
 * the local container graph.
 */
export function prop(name: string): PropNodeDefinition {
  return createNodeDefinition(PropNodeType, {
    name,
  });
}

export function isPropNodeDefinition(value: any): value is PropNodeDefinition {
  return isNodeDefinition(value) && value.type === PropNodeType;
}
