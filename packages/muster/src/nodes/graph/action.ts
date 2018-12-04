import fromPairs from 'lodash/fromPairs';
import zip from 'lodash/zip';
import { CallOperation, isCallArgumentArray } from '../../operations/call';
import {
  getProxiedNodeValue,
  GraphNode,
  isGraphNode,
  isNodeDefinition,
  isProxiedNode,
  NodeDefinition,
  NodeDependency,
  NodeLike,
  ProxiedNode,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import { getInvalidTypeErrorMessage } from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import * as types from '../../utils/types';
import { DataNode, isDataNode, valueOf } from '../../utils/value-of';
import withScopeFrom from '../../utils/with-scope-from';
import { ArrayNodeType } from '../collection/array';
import { DoneNodeType } from './done';
import { error, ErrorNode, ErrorNodeType, isErrorNodeDefinition } from './error';
import { OkNodeType } from './ok';
import { once } from './once';
import { resolve } from './resolve';
import { TreeNodeType } from './tree';
import { toValue, value, ValueNodeType } from './value';

/**
 * An instance of the [[action]] node.
 * See the [[action]] documentation to find out more.
 */
export interface ActionNode extends StatelessGraphNode<'action', ActionNodeProperties> {}

/**
 * A definition of the [[action]] node.
 * See the [[action]] documentation to find out more.
 */
export interface ActionNodeDefinition
  extends StatelessNodeDefinition<'action', ActionNodeProperties> {}

export interface ActionNodeProperties {
  body: (
    ...args: Array<any>
  ) => Iterator<NodeDefinition | NodeLike> | GraphNode | NodeDefinition | NodeLike | void;
}

/**
 * The implementation of the [[action]].
 * See the [[action]] documentation for more information.
 */
export const ActionNodeType: StatelessNodeType<'action', ActionNodeProperties> = createNodeType<
  'action',
  ActionNodeProperties
>('action', {
  serialize: false,
  deserialize: false,
  shape: {
    body: types.saveHash(types.func),
  },
  operations: {
    call: {
      cacheable: false,
      getDependencies(
        properties: ActionNodeProperties,
        operation: CallOperation,
      ): Array<NodeDependency> {
        const { args } = operation.properties;
        if (!args) return [];
        if (isCallArgumentArray(args)) {
          return args.map((arg) => ({
            target: arg,
            until: untilIsDataNode,
            once: true,
          }));
        }
        return Object.keys(args).map((name) => ({
          target: args[name],
          until: untilIsDataNode,
          once: true,
        }));
      },
      run(
        node: ActionNode,
        operation: CallOperation,
        argValues: Array<DataNode>,
      ): GraphNode | NodeDefinition {
        const { body } = node.definition.properties;
        const { args } = operation.properties;
        const unwrappedArgs = argValues.map((argValue) => valueOf(argValue));
        let result: any;
        if (!args) {
          result = body();
        } else if (isCallArgumentArray(args)) {
          // Handle array of arguments
          result = body(...unwrappedArgs);
        } else {
          // Handle named arguments
          const argNames = Object.keys(args);
          result = body(fromPairs(zip(argNames, unwrappedArgs)));
        }
        if (isProxiedNode(result)) {
          return getProxiedNodeValue(result);
        }
        if (isGraphNode(result)) {
          return result;
        }
        if (isNodeDefinition(result)) {
          return withScopeFrom(node, result);
        }
        if (isGenerator(result)) {
          const generatorResult = stepNext(result, []);
          return isGraphNode(generatorResult)
            ? generatorResult
            : withScopeFrom(node, generatorResult);
        }
        return withScopeFrom(node, value(result));
      },
    },
  },
});

const untilIsDataNode: NodeDependency['until'] = {
  predicate: isDataNode,
  errorMessage(node: GraphNode): string {
    return getInvalidTypeErrorMessage('Invalid action node dependencies', {
      expected: [ValueNodeType, TreeNodeType, ArrayNodeType, OkNodeType, DoneNodeType],
      received: node.definition,
    });
  },
};

/**
 * Creates a new instance of an [[action]] node, which is a type of [[NodeDefinition]] that allows for defining reusable fragments of code
 * which can interact with the graph. The [[action]] on its own is treated as a data-node - just
 * like a [value](_nodes_graph_value_.html#value) or an [[array]]. It can be used as a target for a [[call]] or
 * [[apply]] nodes. See the [[call]] and [[apply]] documentation to learn more about invoking actions.
 *
 * The [[action]] can return three types of values:
 * - `void`/`undefined`: for very simple actions that don't interact with the graph
 * - A [[NodeDefinition]]: an output of the [[action]]. This node can be resolved later.
 * - An iterator of GraphNodes: the most common use for the [[action]]. The [[action]] body can be
 *   defined as a generator function. This way the [[action]] can perform complex
 *   operations. See the "**Using generators in an action node**" example to learn more.
 *
 * The [[action]] node can be thought of as a [[computed]] node with few differences. The
 * [[computed]] must statically declare its dependencies. [[action]]s, however,
 * declare only a number of arguments, without linking them to [[NodeDefinition]]s. These
 * arguments will be passed to the action at the time of calling or applying. Another difference is
 * that the [[computed]] must always resolve to a single [[NodeDefinition]], whereas the
 * [[action]] has no such limitations.
 *
 * @example **Simple actions**
 * ```ts
 * import muster, { action, call } from '@dws/muster';
 *
 * const app = muster({
 *   logWhenCalled: action(() => {
 *     console.log('Action has been called');
 *   }),
 * });
 *
 * console.log('Calling action');
 * const output = await app.resolve(call('logWhenCalled'));
 * // output === undefined
 *
 * // Console output:
 * // Calling action
 * // Action has been called
 * ```
 * This example demonstrates how to define a simple action that does something when called with the
 * help of a [[call]] node. See the [[call]] documentation to learn more about calling
 * actions. Note that the function returns `value(undefined)`.
 *
 *
 * @example **Actions with arguments**
 * ```ts
 * import muster, { action, call } from '@dws/muster';
 *
 * const app = muster({
 *   logFullName: action((firstName, lastName) => {
 *     console.log(`Hello, ${firstName} ${lastName}!`);
 *   }),
 * });
 *
 * console.log('Calling action');
 * const output = await app.resolve(call('logFullName', ['Bob', 'Builder']));
 * // output === undefined
 *
 * // Console output:
 * // Calling action
 * // Hello, Bob Builder!
 * ```
 * The [[action]] node can also define a number of arguments. These arguments will be supplied from
 * the calling [[call]] or [[apply]] nodes. As in the previous example, the function returns
 * `undefined`.
 *
 * Much like the [[computed]] node, the parameters of the [[action]] are first resolved to their
 * most basic form (here with the help of a [[resolve]] node). Resolved values that are
 * a [value](_nodes_graph_value_.html#value), a [[tree]] or an [[array]] are run through the [[valueOf]] helper.
 * This simplifies the implementation of your actions by not forcing you to deal with
 * [[NodeDefinition]]s inside the action's function body.
 *
 *
 * @example **Returning a value from an action**
 * ```ts
 * import muster, { action, call } from '@dws/muster';
 *
 * const app = muster({
 *   getFullName: action((firstName, lastName) => `${firstName} ${lastName}`),
 * });
 *
 * console.log('Calling action');
 * const fullName = await app.resolve(call('getFullName', ['Rosalind', 'Franklin']));
 * // fullName === 'Rosalind Franklin'
 *
 * console.log(fullName);
 *
 * // Console output:
 * // Calling action
 * // Rosalind Franklin
 * ```
 * This example shows how to return values from an [[action]]. As with the [[computed]],
 * the value returned from the action function is converted to a [value](_nodes_graph_value_.html#value) if is not already
 * a [[NodeDefinition]].
 *
 *
 * @example **Returning a computed node from an action**
 * ```ts
 * import muster, { action, call, computed, value } from '@dws/muster';
 *
 * const app = muster({
 *   getGreeting: action((firstName, lastName) =>
 *     computed([value(`${firstName} ${lastName}`)], (fullName) => `Hello, ${fullName}`),
 *   ),
 * });
 *
 * console.log('Getting a greeting');
 * const greeting = await app.resolve(call('getGreeting', ['Rosalind', 'Franklin']));
 * // greeting === 'Hello, Rosalind Franklin'
 *
 * console.log(greeting);
 *
 * // Console output:
 * // Getting a greeting
 * // Hello, Rosalind Franklin
 * ```
 * The return node type of an [[action]] is not limited to a [value](_nodes_graph_value_.html#value). The action can
 * return any type of a [[NodeDefinition]]. This example demonstrates the action returning a
 * [[computed]] that resolves to a greeting.
 *
 *
 * @example **Using generators in action nodes**
 * ```ts
 * import muster, { action, call, ref } from '@dws/muster';
 *
 * const app = muster({
 *   greeting: 'Hello',
 *   getGreeting: action(function*(name) {
 *     const greeting = yield ref('greeting');
 *     return `${greeting}, ${name}`;
 *   }),
 * });
 *
 * console.log('Getting a greeting');
 * const greeting = await app.resolve(call('getGreeting', ['Rosalind']));
 * // greeting === 'Hello, Rosalind'
 *
 * console.log(greeting);
 *
 * // Console output:
 * // Getting a greeting
 * // Hello, Rosalind
 * ```
 * This example shows the use of generator functions as the body of an [[action]].
 * Generators offer greater flexibility than a simple [[computed]]. They allow
 * writing code which seem to be executed in series, but may in fact be making asynchronous
 * requests to external APIs or remote instances of Muster.
 *
 * Note the use of a `yield` keyword inside of the generator function. Yielding a [[NodeDefinition]]
 * instructs Muster to resolve a given node to its most basic form (just like with the parameters).
 * In this example, the ref resolves to a [value](_nodes_graph_value_.html#value), which gets un-wrapped into a more basic
 * representation (with the help of a [[valueOf]] helper) and assigned to the `greeting`
 * variable. Muster actions also allow for returning an array of [[NodeDefinition]]s (e.g. [ref](_utils_ref_.html#ref)).
 * See the "**Yielding multiple graph nodes**" example to learn more.
 *
 *
 * @example **Yielding multiple graph nodes**
 * ```js
 * import muster, { action, call, ref } from '@dws/muster';
 *
 * const app = muster({
 *   firstName: 'Rosalind',
 *   lastName: 'Franklin',
 *   getFullName: action(function*() {
 *     const [firstName, lastName] = yield [
 *       ref('firstName'),
 *       ref('lastName'),
 *     ];
 *     return `${firstName} ${lastName}`;
 *   }),
 * });
 *
 * console.log('Getting a full name');
 * const fullName = await app.resolve(call('getFullName'));
 * // fullName = 'Rosalind Franklin';
 *
 * console.log(fullName);
 * ```
 * This example shows how to yield multiple [[NodeDefinition]]s. Muster tries to resolve both of these
 * values simultaneously before returning the result. The result of such operation is an array of
 * un-wrapped [[NodeDefinition]]s.
 *
 * One major benefit of this kind of batching is most visible when making requests to a remote
 * Muster instance. Normally the `yield` keyword waits for the non-pending result to be returned.
 * In a situation where the application needs to load two separate branches that come from a server,
 * it's best to batch them into a single request. By `yielding` an array we're letting Muster know
 * that these branches can be resolved simultaneously.
 * See the [[proxy]] and [[remote]] documentation for more information.
 *
 *
 * @example **Yielding named nodes**
 * ```js
 * import muster, { action, call, ref } from '@dws/muster';
 *
 * const app = muster({
 *   firstName: 'Rosalind',
 *   lastName: 'Franklin',
 *   getFullName: action(function*() {
 *     const { first, last } = yield {
 *       first: ref('firstName'),
 *       last: ref('lastName'),
 *     };
 *     return `${first} ${last}`;
 *   }),
 * });
 *
 * console.log('Getting a full name');
 * const fullName = await app.resolve(call('getFullName'));
 * // fullName = 'Rosalind Franklin';
 *
 * console.log(fullName);
 * ```
 * This example shows how to yield multiple [[NodeDefinition]]s as named nodes. The benefit of using
 * this form of yielding when compared to the previous example is that it's less prone to errors.
 * When yielding an array it is possible to accidentally do
 * `const [last, first] = yield [ref('firstName'), ref('lastName')];`
 * This code would work perfectly fine, but the values would end up in incorrectly named variables.
 * The ability to yield named nodes mitigates this category of errors.
 *
 *
 * @example **Create an [[action]] with named args**
 * ```js
 * import muster, { action, call } from '@dws/muster';
 *
 * const app = muster({
 *   greet: action(({ name }) => `Hello, ${name}!`),
 * });
 *
 * await app.resolve(call('greet', { name: 'Bob' }));
 * // === 'Hello, Bob!'
 * ```
 * This example shows how to create and call an [[action]] node with named arguments.
 */
export function action(body: ActionNodeProperties['body']): ActionNodeDefinition {
  return createNodeDefinition(ActionNodeType, {
    body,
  });
}

export function isActionNodeDefinition(value: NodeDefinition): value is ActionNodeDefinition {
  return value.type === ActionNodeType;
}

function isGenerator<T>(input: any): input is Iterator<T> {
  return Boolean(input) && typeof input === 'object' && typeof input.next === 'function';
}

interface NodeMap {
  [name: string]: NodeDefinition | ProxiedNode;
}

type YieldedValueType =
  | NodeMap
  | ProxiedNode
  | DataNode
  | NodeLike
  | Array<ProxiedNode | DataNode | NodeLike>;

const NODE_MAP_MATCHER = types.objectOf(
  types.oneOfType([graphTypes.nodeDefinition, graphTypes.proxiedNode]),
);

function handleStep(
  generator: Generator,
  { done, value: yielded }: { done: boolean; value: YieldedValueType },
): NodeDefinition | GraphNode {
  if (done) {
    return isProxiedNode(yielded) ? getProxiedNodeValue(yielded) : toValue(yielded);
  }
  return resolve(
    getDependenciesToResolve(yielded),
    // FIXME: Action generator resolve combiner being reinvoked with wrong dependencies
    // TODO: For some reason the combine function is being re-called with the wrong dependencies.
    // Perhaps something to do with the resolve() nodes for the different steps getting muddled?
    // If this is fixed, the cacheFirstResult() wrapper can be removed.
    cacheFirstResult(
      (values: Array<DataNode>): NodeDefinition | GraphNode => {
        const errorNode: ErrorNode | undefined = values.find(ErrorNodeType.is);
        return errorNode
          ? stepThrow(generator, errorNode)
          : stepNext(generator, getResolvedValuesOfDependencies(yielded, values));
      },
    ),
  );
}

function getDependenciesToResolve(yielded: YieldedValueType): Array<NodeDependency> {
  if (NODE_MAP_MATCHER(yielded)) {
    return Object.keys(yielded).map((key) => {
      const node = yielded[key];
      return {
        target: once(isProxiedNode(node) ? getProxiedNodeValue(node) : node),
        allowErrors: true,
      };
    });
  }
  return (Array.isArray(yielded) ? yielded : [yielded]).map((node: NodeDefinition | NodeLike) => ({
    target: once(isProxiedNode(node) ? getProxiedNodeValue(node) : toValue(node)),
    allowErrors: true,
  }));
}

function getResolvedValuesOfDependencies(
  yielded: YieldedValueType,
  resolvedValues: Array<DataNode>,
): any {
  const unwrappedValues = resolvedValues.map((value) => valueOf(value));
  if (NODE_MAP_MATCHER(yielded)) {
    const keys = Object.keys(yielded);
    return fromPairs(zip(keys, unwrappedValues));
  }
  return Array.isArray(yielded) ? unwrappedValues : unwrappedValues[0];
}

function cacheFirstResult<T extends (...args: Array<any>) => any>(fn: T): T {
  const PENDING = {} as never;
  let result: any = PENDING;
  return ((...args: Array<any>) => (result !== PENDING ? result : (result = fn(...args)))) as T;
}

function stepNext(generator: Generator, nextValue: any): GraphNode | NodeDefinition {
  return catchErrors(() => handleStep(generator, generator.next(nextValue)));
}

function stepThrow(generator: Generator, error: ErrorNode): NodeDefinition | GraphNode {
  if (!generator.throw) throw valueOf(error);
  return catchErrors(() => handleStep(generator, generator.throw!(valueOf(error))));
}

function catchErrors<T>(fn: () => T): T | NodeDefinition {
  try {
    return fn();
  } catch (e) {
    if (e instanceof Error) {
      return error(e);
    }
    if (typeof e === 'string') {
      return error(e);
    }
    if (isNodeDefinition(e) && isErrorNodeDefinition(e)) {
      return e;
    }
    if (e && typeof e === 'object' && typeof e.message === 'string') {
      return error(e);
    }
    throw e;
  }
}
