import { GraphNode, NodeDefinition, NodeLike } from '../../types/graph';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import { toNode } from '../../utils/to-node';
import { isDataNode, valueOf } from '../../utils/value-of';
import { DoneNodeType } from './done';
import { OkNodeType } from './ok';
import { resolve } from './resolve';
import { toValue, ValueNode, ValueNodeType } from './value';

/**
 * Creates a new instance of a [[computed]] node, which is a type of a [[NodeDefinition]] mostly used when dynamically
 * creating other [[NodeDefinition]]s based on `dependencies` and logic defined in the`combine` function.
 *
 *`dependencies` is an array of [[NodeDefinition]]s which must be evaluated (see the
 * [resolve](_utils_resolve_.html#resolve) for more information) before running the
 * `combine` function.
 *
 * `combine` is a synchronous function that must return a valid [[NodeDefinition]] every time it's
 * called. This function receives a number of arguments equal to the length of `dependencies`
 * array. Each argument is a resolved value of the matching dependency. If the dependency has resolved
 * to a [[NodeDefinition]] which is [value](_nodes_graph_value_.html#value), [[tree]] or [[array]] it is run through
 * the [[valueOf]] helper in order to extract its value for easier use in the `combine`
 * function.
 *
 * [[computed]] nodes can be created using the [[computed]] helper exported from `@dws/muster` package:
 * `import { computed } from '@dws/muster';`
 *
 * This node is **not** serializable.
 *
 * @example **Computed nodes without dependencies**
 * ```js
 * import { computed } from '@dws/muster';
 *
 * computed([], () => 'Hello world');
 * ```
 * This is one of the most basic usages of a computed node. This node has no dependencies (note the empty
 * dependencies array) and a pure `combine` function. One more thing to note is that the output of
 * the `combine` function is not a [[NodeDefinition]] but a string. This works because the
 * [[computed]] sanitizes the output of the `combine` function by running it through a
 * [[toValue]] helper. If it encounters a value which is not a node definition (see [[isNodeDefinition]]), it
 * wraps it in a [value](_nodes_graph_value_.html#value) node.
 *
 * The same could be achieved by creating the following computed node:
 * ```js
 * import { computed, value } from '@dws/muster';
 *
 * computed([], () => value('Hello world'));
 * ```
 *
 *
 * @example **Computed nodes with non-dynamic dependencies**
 * ```js
 * import { computed, value } from '@dws/muster';
 *
 * computed([value('Bob')], (name) => `Hello ${name}`);
 * ```
 * In this example we have created a computed node with one dependency: `value('Bob')`, and a `combine`
 * function that adds the value of this dependency to the 'Hello ' string.
 *
 * Note the type of the `name` parameter. The `combine` function expects it to be a string
 * and it is, thanks to the automatic argument unwrapping process described above.
 *
 * As discussed, the unwrapping happens only for certain node types. Consider the following example:
 * ```js
 * import { computed, tree } from '@dws/muster';
 *
 * const testBranch = tree({});
 *
 * computed([testBranch], (val) => {
 *   return val === testBranch; // true
 * });
 * ```
 * This time we used a [[tree]] as a dependency of the [[computed]]. The branch has not
 * been unwrapped as there's no more basic way of representing it in muster, so it is passed
 * directly to the `combine` function.
 *
 *
 * @example **Returning graph nodes other than value**
 * ```js
 * import muster, { computed, ref } from '@dws/muster';
 *
 * const app = muster({
 *   first: 'Bob',
 *   last: 'Johnson',
 *   fullName: computed([ref('first')], (first) =>
 *     computed([ref('last')], (last) => `${first} ${last}`),
 *   ),
 * });
 * ```
 * Computed nodes do not have to return simple [values](_nodes_graph_value_.html#value). They can also return any
 * kind of [[NodeDefinition]]. This example demonstrates returning a nested `computed` node where each node
 * is responsible for retrieving just one dependency. As you can imagine code like this is not the
 * most efficient and could be optimised by combining both of these [[computed]]s into one.
 * ```js
 * import { computed, ref } from '@dws/muster';
 *
 * computed([ref('first'), ref('last')], (first, last) => `${first} ${last}`)
 * ```
 * On the other hand it demonstrates that an output of a [[computed]] can be any other [[NodeDefinition]].
 *
 * Retrieving the value of `fullName` node will cause the first `computed` to be evaluated. As it
 * depends on the node `first`, muster would retrieve the value of node `first` and run the
 * `combine` function with the value of `first` node. As the output of this [[computed]] is
 * a dynamic node Muster will evaluate that as well.
 *
 *
 * @example **Reacting to changing dependencies**
 * ```js
 * import muster, { computed, ref, set, value, variable } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('Bob'),
 *   greeting: computed([ref('name')], (name) => `Hello ${name}`),
 * });
 *
 * let latestGreeting;
 * app.resolve(ref('greeting')).subscribe((greeting) => {
 *   latestGreeting = greeting;
 * });
 *
 * // latestGreeting === 'Hello Bob'
 *
 * await app.resolve(set('name', 'John'));
 *
 * // latestGreeting === 'Hello John'
 * ```
 * In this example we're defining a computed node similar to the one in the "**Computed nodes with
 * non-dynamic dependencies**" example. Note that this time instead of a [value](_nodes_graph_value_.html#value)
 * we're using a [[variable]]. You can think of a [value](_nodes_graph_value_.html#value) as `const` keyword
 * in javascript whilst [[variable]] is comparable to `let`.
 *
 * Dynamic nodes in Muster can react to changes in their dependencies' values.
 * By creating a [[computed]] with a `ref` to another node in the graph we're
 * saying that the value of this `computed` depends on the latest value of the ref's target node.
 * When the value of the dependency changes, this causes the value of this
 * `computed` to change - the `combine` function is rerun with updated values for the dependencies.
 *
 * You can find out more about [set](_nodes_graph_set_.html#set) and [[variable]] in their documentation.
 */
export function computed(
  dependencies: Array<never>,
  combine: () => GraphNode | NodeLike,
): NodeDefinition;
export function computed(
  dependencies: [NodeLike],
  combine: (value: any) => GraphNode | NodeLike,
): NodeDefinition;
export function computed(
  dependencies: [NodeLike, NodeLike],
  combine: (value1: any, value2: any) => GraphNode | NodeLike,
): NodeDefinition;
export function computed(
  dependencies: [NodeLike, NodeLike, NodeLike],
  combine: (value1: any, value2: any, value3: any) => GraphNode | NodeLike,
): NodeDefinition;
export function computed(
  dependencies: [NodeLike, NodeLike, NodeLike, NodeLike],
  combine: (value1: any, value2: any, value3: any, value4: any) => GraphNode | NodeLike,
): NodeDefinition;
export function computed(
  dependencies: [NodeLike, NodeLike, NodeLike, NodeLike, NodeLike],
  combine: (
    value1: any,
    value2: any,
    value3: any,
    value4: any,
    value5: any,
  ) => GraphNode | NodeLike,
): NodeDefinition;
export function computed(
  dependencies: Array<NodeLike>,
  combine: (...values: Array<any>) => GraphNode | NodeLike,
): NodeDefinition;

export function computed(
  dependencies: Array<NodeLike>,
  combine: (...values: Array<any | NodeDefinition>) => any | NodeDefinition,
): NodeDefinition {
  if (dependencies.length === 0) {
    return toValue(combine());
  }
  const nodeDependencies = dependencies.map((dependency) => ({
    target: toNode(dependency),
    until: untilDataNode,
  }));
  return resolve(nodeDependencies, (results: Array<ValueNode<any>>) => {
    const values = results.map(({ definition }) => valueOf(definition));
    const combinerResult = combine(...values);
    return toValue(combinerResult);
  });
}

const untilDataNode = {
  predicate: isDataNode,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Invalid computed node dependencies', {
      expected: [ValueNodeType, OkNodeType, DoneNodeType],
      received: node.definition,
    });
  },
};
