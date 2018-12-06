import fromPairs from 'lodash/fromPairs';
import toPairs from 'lodash/toPairs';
import { GetChildOperation } from '../../operations/get-child';
import {
  ChildKey,
  Context,
  GraphNode,
  isGraphNode,
  NodeDefinition,
  Params,
  StatelessGraphNode,
  StatelessNodeDefinition,
  StatelessNodeType,
} from '../../types/graph';
import createGraphNode from '../../utils/create-graph-node';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import getContextValues from '../../utils/get-context-values';
import getType from '../../utils/get-type';
import * as graphTypes from '../../utils/graph-types';
import * as hash from '../../utils/hash';
import * as types from '../../utils/types';
import withScopeFrom from '../../utils/with-scope-from';
import { createChildPathContext } from './get';
import { notFound } from './not-found';
import { value, ValueNodeDefinition } from './value';

/**
 * An instance of the [[tree]] node.
 * See the [[tree]] documentation to find out more.
 */
export interface TreeNode extends StatelessGraphNode<'tree', TreeNodeProperties> {}

/**
 * A definition of the [[tree]] node.
 * See the [[tree]] documentation to find out more.
 */
export interface TreeNodeDefinition extends StatelessNodeDefinition<'tree', TreeNodeProperties> {}

export type KeyMatcher = (key: ChildKey) => boolean;

const PARAM_NAME_PREFIX = '$$param:';
export const MISSING_PARAM_NAME = '$$graph-missing';

export type BranchDefinition = {
  match: ChildKey | KeyMatcher;
  param: string | undefined;
  node: NodeDefinition;
};

const MATCHERS: {
  [id: string]: {
    match: KeyMatcher;
    param: string | undefined;
  };
} = {};

export interface TreeNodeProperties {
  branches: Array<BranchDefinition>;
}

export interface SerializedTreeNodeProperties<T = any> {
  branches: Array<{
    match: string | undefined;
    param: string | undefined;
    node: T;
  }>;
}

/**
 * The implementation of the [[tree]] node.
 * See the [[tree]] documentation to learn more.
 */
export const TreeNodeType: StatelessNodeType<
  'tree',
  TreeNodeProperties,
  SerializedTreeNodeProperties
> = createNodeType<'tree', TreeNodeProperties, SerializedTreeNodeProperties>('tree', {
  shape: {
    branches: types.arrayOf(
      types.shape({
        match: types.saveHash(types.any),
        param: types.optional(types.string),
        node: graphTypes.nodeDefinition,
      }),
    ),
  },
  operations: {
    getChild: {
      run(node: TreeNode, operation: GetChildOperation): NodeDefinition | GraphNode {
        const { key } = operation.properties;
        const branches = node.definition.properties.branches;
        const matchingBranch = findBranchByKey(branches, key);
        if (!matchingBranch) {
          return notFound(`Invalid child key: ${getType(key)}`);
        }
        const { param, node: child } = matchingBranch;
        const childContext = createChildPathContext(
          node,
          key,
          param === undefined
            ? undefined
            : {
                [getParamContextId(param)]: withScopeFrom(node, value(key)),
              },
        );
        return createGraphNode(node.scope, childContext, child);
      },
    },
  },
  serialize<T>(
    properties: TreeNodeProperties,
    serialize: (value: any) => any,
  ): SerializedTreeNodeProperties<T> {
    const { branches } = properties;
    return {
      branches: branches.map((b) => ({
        match: b.param === MISSING_PARAM_NAME ? undefined : serialize(b.match),
        param: b.param,
        node: serialize(b.node),
      })),
    };
  },
  deserialize<T>(
    data: SerializedTreeNodeProperties<T>,
    deserialize: (value: any) => any,
  ): TreeNodeProperties {
    return {
      branches: data.branches.map((b) => {
        const deserializedNode = deserialize(b.node);
        if (b.param === MISSING_PARAM_NAME) {
          return { param: MISSING_PARAM_NAME, node: deserializedNode, match: types.any };
        }
        return { param: b.param, node: deserializedNode, match: deserialize(b.match) };
      }),
    };
  },
  getType(properties: TreeNodeProperties, getType: (value: any) => string): string {
    return `${TreeNodeType.name}({ ${(properties.branches as Array<any>)
      .map(
        (branch) =>
          `${
            typeof branch.match === 'string'
              ? branch.match
              : branch.match.name
              ? `[${branch.match.name}]`
              : '*'
          }: ${getType(branch.node)}`,
      )
      .join(', ')} })`;
  },
});

/**
 * Creates a new instance of a [[tree]] node, which is a node defining a single tree level.
 * It implements the `NodeType.getChild` method which enables the use of paths when traversing a Muster graph.
 *
 * In most cases, trees are defined as an array of string matchers, with every tree having
 * a unique name matcher. See the "**Simple tree**" example.
 *
 * [[tree]] also allows for dynamic tree names that use the [[match]] helper to generate
 * a typed matcher. See the "**Tree matchers**" example for more information.
 *
 * This node is serializable.
 *
 *
 * @example **Simple trees**
 * ```js
 * import { tree, value } from '@dws/muster';
 *
 * const myTree = tree({
 *   firstName: value('Bob'),
 *   lastName: value('Builder'),
 * });
 * ```
 * In this example we have created a tree with two string-based tree matchers:
 * - `firstName`
 * - `lastName`
 *
 * The content of each tree can be any [[NodeDefinition]]. In this example, both of these trees
 * contain [[value]]s.
 *
 * To access the contents of the `firstName` tree we'd first have to place it in a muster graph.
 * ```js
 * import muster, { tree, value } from '@dws/muster';
 *
 * const myTree = tree({
 *   firstName: value('Bob'),
 *   lastName: value('Builder'),
 * });
 *
 * const app = muster(myTree);
 * ```
 * As it happens, we chose to place our tree in the root of the muster graph.
 * Then we can just make a query for first name:
 * ```js
 * import muster, { tree, ref, value } from '@dws/muster';
 *
 * const myTree = tree({
 *   firstName: value('Bob'),
 *   lastName: value('Builder'),
 * });
 *
 * const app = muster(myTree);
 *
 * const firstNameValue = await app.resolve(ref('firstName'));
 * // firstNameValue === 'Bob'
 * ```
 *
 * See the [[muster]] helper documentation for more information on how to create an instance of muster.
 *
 *
 * @example **Nested trees**
 * ```js
 * import muster, { tree, ref, value } from '@dws/muster';
 *
 * const app = muster(tree({
 *   currentUser: tree({
 *     firstName: value('Bob'),
 *     lastName: value('Builder'),
 *   }),
 * }));
 *
 * const firstNameValue = await app.resolve(ref('currentUser', 'firstName'));
 * // firstNameValue === 'Bob'
 * ```
 * As mentioned before, the content [[tree]]'s tree can be any [[NodeDefinition]]. This allows
 * for the creation of nested trees.
 *
 * In this example we have created a tree `currentUser` which contains a tree with two leaves:
 * `firstName` and `lastName`.
 *
 * To access `firstName` from the `currentUser` we can use a [[ref]] and just specify the full
 * path: `ref('currentUser', 'firstName')`.
 *
 *
 * @example **Computed trees**
 * ```js
 * import muster, { tree, computed, ref, value } from '@dws/muster';
 *
 * const app = muster(tree({
 *   name: value('Bob'),
 *   currentUser: computed([ref('name')], (name) =>
 *     tree({
 *       firstName: value(name),
 *     }),
 *   ),
 * }));
 *
 * const firstName = await app.resolve(ref('currentUser', 'firstName'));
 * // firstName === 'Bob'
 * ```
 * Trees in muster do not have to be defined at the time of creation of the muster instance.
 * New trees can be created as a result of resolving different [[NodeDefinition]]s. In this example
 * we have created a dynamic tree from a [[computed]].
 *
 * See the [[computed]] documentation for more information about computed nodes.
 *
 *
 * @example **Tree matchers**
 * ```js
 * import muster, { tree, match, param, ref, types } from '@dws/muster';
 *
 * const app = muster(tree({
 *  [match(types.string, 'treeName')]: param('treeName'),
 * }));
 *
 * const hello = await app.resolve(ref('hello'));
 * // hello === 'hello'
 *
 * const world = await app.resolve(ref('world'));
 * world === 'world'
 *
 * const stringOfNumbers = await app.resolve(ref('123'));
 * // stringOfNumbers === '123'
 *
 * const numeric = await app.resolve(ref(123));
 * // numeric === 'Invalid child name: 123'
 * ```
 * So far we've defined trees with pre-defined, static names. [[tree]] enables one more
 * way of defining trees: using a tree matcher. See [[match]] for more information on
 * matcher syntax and [[types]] about supported muster type matchers.
 *
 * In this example we've created a tree with a matcher allowing for every `string` path.
 * The content of this tree is a [[param]]. See the [[param]] documentation for more
 * information about that node.
 *
 * Below the application definition we tried to retrieve four tree names:
 * - `string 'hello'` - returned `value('hello')`
 * - `string 'world'` - returned `value('world')`
 * - `string '123'` - returned `value('123')`
 * - `number 123` - returned an error as the numeric name was not matched by this type matcher
 *
 * Note the tree matcher has two arguments:
 * - `types.string`
 * - `'treeName'`
 * The second argument defines the name of the parameter to define on the resolution context when
 * the tree name gets matched by this matcher.
 *
 * This parameter can then be used in every node belonging to that tree.
 *
 *
 * @example **Shape matchers**
 * ```js
 * import muster, { match, param, ref, tree, types, value } from '@dws/muster';
 *
 * const app = muster({
 *   [match(types.shape({ name: types.string }), 'obj')]: param('obj'),
 * });
 *
 * const test = await app.resolve(ref(value({ name: 'test name' })));
 * // test === { name: 'test name' }
 *
 * const testWithExtra = await app.resolve(
 *   ref(value({ name: 'test name', extra: 'extra prop' })),
 * );
 * // testWithExtra === { name: 'test name', extra: 'extra prop' }
 *
 * const notFoundNode = await app.resolve(ref(value({ extra: 'extra prop' })));
 * // notFoundNode === 'Invalid child name: {extra: "extra prop"})'
 * ```
 * Tree matchers need not operate only on primitive types. With the use of a [[shape]] matcher
 * we can define more complex matchers allowing more data to be squeezed into a single path entry.
 * See [[match]] documentation for more information.
 *
 *
 * @example **Using tree parameters**
 * ```js
 * import muster, { computed, match, param, ref, tree, types, value } from '@dws/muster';
 *
 * const app = muster({
 *   users: tree({
 *     [match(types.number, 'userId')]: computed([param('userId')], (userId) => {
 *       // Synchronously retrieve the user from some data source
 *       // or in our case - return a test tree
 *       return tree({
 *         id: value(userId),
 *         firstName: value(`User ${userId}`),
 *       });
 *     }),
 *   }),
 * });
 *
 * const userId = await app.resolve(ref('users', 1, 'id'));
 * const userFirstName = await app.resolve(ref('users', 1, 'firstName'));
 * // userId === 1
 * // userFirstName === 'User 1'
 *
 * const invalidName = await app.resolve(ref('users', 'testId', 'firstName'));
 * // invalidName === 'Invalid child key: testId'
 * ```
 * Tree matchers are a good way of creating gateways between muster and an external API.
 *
 * To handle asynchronous requests one could replace the [[computed]] with a [[fromPromise]]
 * and request the data asynchronously
 */
export function tree(
  branches:
    | TreeNodeProperties['branches']
    | {
        [id: string]: NodeDefinition;
      },
): TreeNodeDefinition {
  return createNodeDefinition(TreeNodeType as any, {
    branches: Array.isArray(branches) ? branches : parseBranches(branches),
  });
}

function parseBranches(branches: { [id: string]: NodeDefinition }): Array<BranchDefinition> {
  return [
    // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
    ...Object.getOwnPropertySymbols(branches).map(
      (key) => [key, branches[key as any]] as [symbol, any],
    ),
    ...toPairs(branches),
  ].map(([id, branch]) => {
    if (id in MATCHERS) {
      return {
        // TODO: Remove the `as any` cast once https://github.com/Microsoft/TypeScript/issues/1863 is resolved
        ...MATCHERS[id as any],
        node: branch,
      };
    }
    return {
      match: id,
      param: undefined,
      node: branch,
    };
  });
}

export function isTreeNodeDefinition(value: NodeDefinition): value is TreeNodeDefinition {
  return value.type === TreeNodeType;
}

export function match(predicate: KeyMatcher, param?: string): string {
  const matcherHash = generateMatcherKey(predicate, param);
  MATCHERS[matcherHash] = { match: predicate, param };
  return matcherHash;
}

export function isMatcherKey(name: string): boolean {
  return name.startsWith('$$match:');
}

export function hasMatcherKeyId(name: string): boolean {
  return !name.endsWith(':');
}

export function getMatcherKeyId(name: string): string | undefined {
  const idString = name.substr(name.lastIndexOf(':') + 1);
  return idString ? JSON.parse(idString) : undefined;
}

function generateMatcherKey(predicate: KeyMatcher, param: string | undefined): string {
  return `$$match:${hash.func(predicate)}:${param ? `${JSON.stringify(param)}` : ''}`;
}

export function getParamContextId(param: string): string {
  return `${PARAM_NAME_PREFIX}${param}`;
}

export function isParamContextId(contextId: string | symbol): contextId is string {
  return typeof contextId === 'string' && contextId.startsWith(PARAM_NAME_PREFIX);
}

export function parseContextIdParamName(contextId: string | symbol): string | undefined {
  return contextId && isParamContextId(contextId)
    ? contextId.slice(PARAM_NAME_PREFIX.length)
    : undefined;
}

export function getParams(context: Context): Params {
  const contextValues = getContextValues(context);
  return fromPairs(
    Object.keys(contextValues)
      .filter(isParamContextId)
      .map(
        (contextKey) =>
          [
            parseContextIdParamName(contextKey),
            (contextValues[contextKey].definition as ValueNodeDefinition<ChildKey>).properties
              .value,
          ] as [string, ChildKey],
      ),
  );
}

export function getBranchNames(tree: TreeNode | TreeNodeDefinition): Array<string> {
  const treeDefinition: TreeNodeDefinition = isGraphNode(tree) ? tree.definition : tree;
  return treeDefinition.properties.branches
    .map((branch) => branch.match)
    .filter((name) => typeof name === 'string');
}

export function getBranchByName(
  tree: TreeNode | TreeNodeDefinition,
  name: string,
): NodeDefinition | undefined {
  const treeDefinition: TreeNodeDefinition = isGraphNode(tree) ? tree.definition : tree;
  const branch = treeDefinition.properties.branches.find((branch) => branch.match === name);
  return branch && branch.node;
}

function findBranchByKey(
  branches: Array<BranchDefinition>,
  key: any,
): BranchDefinition | undefined {
  const stringKey = typeof key === 'number' ? `${key}` : key;
  // tslint:disable-next-line:no-increment-decrement
  for (let index = 0; index < branches.length; index++) {
    const branch = branches[index];
    if (typeof branch.match === 'function') {
      if (branch.match(key)) return branch;
    } else if (branch.match === stringKey) {
      return branch;
    }
  }
  return undefined;
}
