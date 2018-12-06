import fromPairs from 'lodash/fromPairs';
import isEqual from 'lodash/isEqual';
import zip from 'lodash/zip';
import { getChildOperation, supportsGetChildOperation } from '../../operations/get-child';
import { getItemsOperation, supportsGetItemsOperation } from '../../operations/get-items';
import { resolveOperation } from '../../operations/resolve';
import {
  GraphNode,
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
import {
  getInvalidTypeError,
  getInvalidTypeErrorMessage,
} from '../../utils/get-invalid-type-error';
import * as graphTypes from '../../utils/graph-types';
import pascalCase from '../../utils/pascal-case';
import { DisposeCallback } from '../../utils/store';
import { toNode } from '../../utils/to-node';
import * as types from '../../utils/types';
import { valueOf } from '../../utils/value-of';
import withScopeFrom from '../../utils/with-scope-from';
import { isArrayNodeDefinition } from '../collection/array';
import {
  CatchErrorNodeDefinition,
  CatchErrorNodeType,
  isCatchErrorNodeDefinition,
} from './catch-error';
import {
  CreateCallerNodeDefinition,
  CreateCallerNodeType,
  isCreateCallerNodeDefinition,
} from './create-caller';
import {
  CreateSetterNodeDefinition,
  CreateSetterNodeType,
  isCreateSetterNodeDefinition,
} from './create-setter';
import { DeferNodeDefinition, DeferNodeType, isDeferNodeDefinition } from './defer';
import { EmptyItemNodeType } from './empty-item';
import { EntriesNodeDefinition, EntriesNodeType, isEntriesNodeDefinition } from './entries';
import { error, ErrorNodeType, isErrorNodeDefinition } from './error';
import {
  fields,
  FieldSetDefinition,
  FieldsNodeDefinition,
  FieldsNodeType,
  isFieldsNodeDefinition,
} from './fields';
import {
  isIsPendingNodeDefinition,
  IsPendingNodeDefinition,
  IsPendingNodeType,
} from './is-pending';
import { isKeyNodeDefinition, KeyNodeDefinition, KeyNodeType } from './key';
import { isNilNodeDefinition, NilNodeType } from './nil';
import { pending, PendingNodeType } from './pending';
import { querySet, QuerySetChild, QuerySetNodeDefinition } from './query-set';
import { querySetCatchError } from './query-set-catch-error';
import { querySetDefer } from './query-set-defer';
import { querySetGetChildOperation } from './query-set-get-child-operation';
import { querySetGetItemsOperation } from './query-set-get-items-operation';
import { querySetIsPending } from './query-set-is-pending';
import { querySetOperation } from './query-set-operation';
import { isQuoteNodeDefinition, QuoteNodeType } from './quote';
import { isValueNodeDefinition, toValue, ValueNodeDefinition, ValueNodeType } from './value';
import {
  isWithTransformsNodeDefinition,
  WithTransformsNodeDefinition,
  WithTransformsNodeType,
} from './with-transforms';

/**
 * An instance of the [[query]] node.
 * See the [[query]] documentation to find out more.
 */
export interface QueryNode extends StatefulGraphNode<'query', QueryNodeProperties> {}

/**
 * A definition of the [[query]] node.
 * See the [[query]] documentation to find out more.
 */
export interface QueryNodeDefinition extends StatefulNodeDefinition<'query', QueryNodeProperties> {}

export interface QueryNodeProperties {
  keys: NodeDefinition;
  root: NodeDefinition;
}

export interface QueryNodeState {
  result: NodeDefinition | GraphNode;
}

export interface QueryNodeData {
  disposeQuerySetSubscription: DisposeCallback | undefined;
}

/**
 * The implementation of the [[query]] node.
 * See the [[query]] documentation to learn more.
 */
export const QueryNodeType: StatefulNodeType<'query', QueryNodeProperties> = createNodeType<
  'query',
  QueryNodeProperties,
  QueryNodeState,
  QueryNodeData
>('query', {
  shape: {
    keys: graphTypes.nodeDefinition,
    root: graphTypes.nodeDefinition,
  },
  state: {
    result: types.oneOfType([graphTypes.graphNode, graphTypes.nodeDefinition]),
  },
  getInitialState(): QueryNodeState {
    return {
      result: pending(),
    };
  },
  operations: {
    evaluate: {
      run(
        node: QueryNode,
        operation: never,
        dependencies: never,
        context: never,
        state: QueryNodeState,
      ): NodeDefinition | GraphNode {
        return state.result;
      },
      onSubscribe(
        this: NodeExecutionContext<QueryNodeState, QueryNodeData>,
        node: QueryNode,
      ): void {
        let previousResponse: NodeDefinition | undefined;
        try {
          const { keys, root } = node.definition.properties;
          const { querySet, responseAssembler } = buildQuerySetForQuery(root, keys);
          this.setData({
            disposeQuerySetSubscription: node.scope.store.subscribe(
              withScopeFrom(node, querySet),
              resolveOperation(),
              (response) => {
                if (ErrorNodeType.is(response) || PendingNodeType.is(response)) {
                  this.setState({
                    result: response,
                  });
                  return;
                }
                const newResponse = safelyGetValueFromResponse(response, responseAssembler);
                if (previousResponse && newResponse.type === previousResponse.type) {
                  if (
                    isValueNodeDefinition(newResponse) &&
                    isValueNodeDefinition(previousResponse) &&
                    isEqual(newResponse.properties.value, previousResponse.properties.value)
                  ) {
                    return;
                  }
                }
                previousResponse = newResponse;
                this.setState({
                  result: newResponse,
                });
              },
            ),
          });
        } catch (ex) {
          this.setState({
            result: isErrorNodeDefinition(ex) ? ex : error(ex),
          });
        }
      },
      onUnsubscribe(this: NodeExecutionContext<QueryNodeState, QueryNodeData>): void {
        const { disposeQuerySetSubscription } = this.getData();
        disposeQuerySetSubscription && disposeQuerySetSubscription();
      },
    },
  },
});

function safelyGetValueFromResponse(
  response: GraphNode,
  responseAssembler: ResponseAssembler,
): NodeDefinition {
  try {
    return responseAssembler(response.definition);
  } catch (ex) {
    return isErrorNodeDefinition(ex) ? ex : error(ex);
  }
}

/**
 * Creates an instance of a [[query]] node, which is a node used to request values from multiple [[NodeDefinition]]s at a time.
 * This node is used internally by Muster-React when creating bindings between components and the graph.
 * See Muster-React for more information.
 *
 * By default, the [[query]] waits for every field to resolve to a non-dynamic node.
 * This behaviour can be modified through the use of the [[isPending]] and the [[defer]].
 *
 * A [[query]] resolves into a [[tree]], an [[array]] or a [[value]] (depending on
 * the type of the query made). These can be easily converted into plain JS objects
 * with the [[valueOf]] helper. This conversion is reversible through the use of
 * [[toNode]] helper.
 *
 *
 * @example **Basic query**
 * ```js
 * import muster, { key, query, root, valueOf } from '@dws/muster';
 *
 * const app = muster({
 *   firstName: 'Rosalind',
 *   lastName: 'Franklin',
 *   dateOfBirth: 1948,
 * });
 *
 * const user = await app.resolve(query(root(), {
 *   userFirstName: key('firstName'),
 *   lastName: key('lastName'),
 * }));
 * // user = {
 * //   userFirstName: 'Rosalind',
 * //   lastName: 'Franklin',
 * // }
 * ```
 * This example shows how to use a [[query]] to request two [[NodeDefinition]] at the same
 * time. The `query` call consists of: the first argument which defines the graph starting point from which
 * query should begin the traversal; and the second argument, an object (implicitly cast to a [[fields]]) which
 * defines a map of fields to retrieve from the graph. The name of each property in that map
 * corresponds to the name in the output [[tree]]. Note that this name does not have to be the same
 * as the name in the [[key]] on the right of that property. Take the `firstName` graph node
 * and its corresponding `userFirstName` name in the query. The ability to override the name of a
 * node is useful especially when a given [[NodeDefinition]] can be accessed in more than one way.
 * This behaviour is used extensively by the [[proxy]], and by extension the [[remote]], when
 * building a query to a remote node.
 *
 * The [[key]] used in this query defines the name of a given node in the graph. Additionally, the
 * [[key]] can define a map of child nodes to retrieve from that node. See the "**Getting values of
 * nested nodes**" example for more information.
 *
 * A [[query]] resolves into a combination of [[tree]]s, [[array]]s and [[value]]s.
 * This means an output of one query can be used as an input for another [[NodeDefinition]] and even
 * another [[query]].
 *
 *
 * @example **Getting async values**
 * ```js
 * import muster, { fromPromise, key, query, root } from '@dws/muster';
 *
 * let resolvePromise1;
 * const app = muster({
 *   name: 'sync name',
 *   asyncName: fromPromise(() =>
 *     new Promise((res) => resolvePromise1 = res)
 *       .then(() => 'async name'),
 *   ),
 * });
 *
 * console.log('Making the query');
 * app.resolve(query(root(), {
 *   name: key('name'),
 *   asyncName: key('asyncName'),
 * })).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Resolving the promise');
 * resolvePromise1();
 *
 * // Console output:
 * // Making the query
 * // Resolving the promise
 * // {
 * //   name: 'sync name',
 * //   asyncName: 'async name',
 * // }
 * ```
 * The [[query]] by default waits for every part of the query to resolve to a non-pending and
 * non-dynamic value. This example demonstrates this behaviour with the help of [[fromPromise]].
 * Note that the query output gets logged only once - after the promise is resolved. Muster can
 * also mark certain parts of the query with [[defer]]s. This instructs Muster
 * to return the query result even if that part of the query is loading. See the "**Defer part of the
 * query**" example for more information.
 *
 *
 * @example **Getting values of nested nodes**
 * ```js
 * import muster, { key, query, root } from '@dws/muster';
 *
 * const app = muster({
 *   user: {
 *     firstName: 'Rosalind',
 *     lastName: 'Franklin',
 *   },
 * });
 *
 * const user = await app.resolve(query(root(), {
 *   user: key('user', {
 *     firstName: key('firstName'),
 *   }),
 * }));
 * // user = {
 * //   user: {
 * //     firstName: 'Rosalind',
 * //   },
 * // }
 * ```
 * The [[query]] can extract values from nested [[NodeDefinition]]s. As shown
 * in the previous example, the [[query]] factory function performs an implicit conversion to a
 * [[fields]]. This saves developers from having to explicitly write unnecessarily verbose code.
 * The same functionality is available in the [[key]]. When the factory is
 * called with a pure JS object, it will recursively cast it to a [[fields]].
 *
 * Sometimes, the second argument to the [[key]] won't be a pure JS object. For
 * example, when a developer wants to get items from a collection. [[fields]] lets the
 * query know that a target [[NodeDefinition]] is expected to be a container-like node. This assumption
 * breaks apart when requesting a collection. To request items from collections, one has to make a
 * query with an [[entries]] instead of a [[fields]]. See the "**Getting atomic items from a
 * collection**" example to find out more.
 *
 *
 * @example **Getting atomic items from a collection**
 * ```js
 * import muster, { entries, key, query, root } from '@dws/muster';
 *
 * const app = muster({
 *   numbers: [1, 2, 3, 4],
 * });
 *
 * const numbers = await app.resolve(query(root(), {
 *   numbers: key('numbers', entries()),
 * }));
 * // numbers = {
 * //   numbers: [1, 2, 3, 4],
 * // }
 * ```
 * An [[entries]] can be provided instead of a [[fields]] to instruct the [[query]] to retrieve
 * all items from a given graph node. In this example, we had it easy: every item is an atomic
 * value. The fun with [[query]]s and collections does not end here. See the "**Getting specific
 * fields from items**" example to learn more about selecting certain fields from items.
 *
 *
 * @example **Getting specific fields from items**
 * ```js
 * import muster, { entries, key, query, ref } from '@dws/muster';
 *
 * const app = muster({
 *   books: [
 *     { name: 'The Expeditionary Force', author: 'Craig Alanson' },
 *     { name: 'Fear The Sky', author: 'Stephen Moss' },
 *     { name: 'After It Happened', author: 'Devon Ford' },
 *   ],
 * });
 *
 * const bookNames = await app.resolve(query(ref('books'), entries({
 *   name: key('name'),
 * })));
 * // bookNames = [
 * //   { name: 'The Expeditionary Force' },
 * //   { name: 'Fear The Sky' },
 * //   { name: 'After It Happened' },
 * // ]
 * ```
 * In this example, apart from getting just a selected field from each item in the collection, we
 * demonstrated another feature of the [[query]]: changing its starting point.
 * In all previous examples, we've used a [[root]] as the starting point of the query, but this time
 * to make the output shorter we've changed it to a `books` collection.
 *
 *
 * @example **Creating setters**
 * ```js
 * import muster, {
 *   createSetter,
 *   key,
 *   query,
 *   root,
 *   variable,
 * } from '@dws/muster';
 *
 * const app = muster({
 *   name: variable('initial'),
 * });
 *
 * console.log('Making a query for `name`');
 * app.resolve(query(root(), { name: key('name') })).subscribe((result) => {
 *   console.log(result);
 * });
 *
 * console.log('Making a query for setter function');
 * const result = await app.resolve(query(root(), {
 *   setName: createSetter('name'),
 * }));
 *
 * console.log('Calling a setter');
 * result.setName('updated');
 *
 * // Console output:
 * // Making a query for `name`
 * // initial
 * // Making a query for setter function
 * // Calling a setter
 * // updated
 * ```
 * This example shows how a [[query]] can be used when there's a need for imperative call
 * to a set method. This setter function can be used, for example,
 * when integrating with view frameworks such as React, Vue etc.
 * Muster-React uses this way of creating setters extensively. Similarly, there's a
 * [[createCaller]] node which allows for imperative calls to actions.
 *
 * [[createSetter]]s and [[createCaller]]s should be used only when the output of the query
 * is used outside the "Muster world". Inside Muster code, using [[call]]s
 * [[apply]]s and [[set]]s is recommended for these kinds of actions.
 *
 *
 * @example **Defer part of a query**
 * ```js
 * import muster, { defer, fromPromise, key, query, root } from '@dws/muster';
 *
 * let resolvePromise2;
 * const app = muster({
 *   name: 'sync name',
 *   asyncName: fromPromise(() =>
 *     new Promise((res) => resolvePromise2 = res)
 *       .then(() => 'async name'),
 *   ),
 * });
 *
 * console.log('Requesting the query');
 * app.resolve(query(root(), {
 *   name: key('name'),
 *   asyncName: defer('asyncName'),
 * })).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Resolving the promise');
 * resolvePromise2();
 *
 * // Console output:
 * // Requesting the query
 * // {
 * //   name: 'sync name',
 * //   asyncName: null,
 * // }
 * // Resolving the promise
 * // {
 * //   name: 'sync name',
 * //   asyncName: 'async name',
 * // }
 * ```
 * This example demonstrates how to instruct a [[query]] to return the output of its query
 * even if a given [[NodeDefinition]] is in a pending state. The query is built with a
 * [[defer]]. This example uses a shorthand syntax for the `defer(...)` node.
 * Internally, the node converts the argument to a [[key]]:
 * ```js
 * import { defer, key } from '@dws/muster';
 *
 * defer('asyncName');
 * // is equivalent to
 * defer(key('name'));
 * ```
 * The [[defer]] also enables the defer part of the query to return a previously loaded
 * (stale) value of the target node. See the "**Defer with previous value**" example for more
 * information.
 *
 *
 * @example **Check if defer part of the query is loading**
 * ```js
 * import muster, {
 *   defer,
 *   fromPromise,
 *   isPending,
 *   key,
 *   query,
 *   root,
 * } from '@dws/muster';
 *
 * let resolvePromise3;
 * const app = muster({
 *   name: 'sync name',
 *   asyncName: fromPromise(() =>
 *     new Promise((res) => resolvePromise3 = res)
 *       .then(() => 'async name'),
 *   ),
 * });
 *
 * console.log('Requesting the query');
 * app.resolve(query(root(), {
 *   name: key('name'),
 *   asyncName: defer('asyncName'),
 *   isLoadingAsyncName: isPending('asyncName'),
 * })).subscribe((res) => {
 *   console.log(res);
 * });
 *
 * console.log('Resolving the promise');
 * resolvePromise3();
 *
 * // Console output:
 * // Requesting the query
 * // {
 * //   name: 'sync name',
 * //   asyncName: null,
 * //   isLoadingAsyncName: true,
 * // }
 * // Resolving the promise
 * // {
 * //   name: 'sync name',
 * //   asyncName: 'async name',
 * //   isLoadingAsyncName: false,
 * // }
 * ```
 * This example presents the use of the [[isPending]]. When used in a query, this node checks if
 * a part of the query is currently loading. Similarly to the [[defer]],
 * the [[isPending]] factory function implicitly converts its argument to a [[key]].
 * ```js
 * import { isPending, key } from '@dws/muster';
 *
 * isPending('asyncName');
 * // is equivalent to
 * isPending(key('asyncName'))
 * ```
 */
export function query(
  root: NodeLike,
  keys: NodeDefinition | FieldSetDefinition,
): QueryNodeDefinition {
  return createNodeDefinition(QueryNodeType, {
    keys: isNodeDefinition(keys) ? keys : fields(keys),
    root: toNode(root),
  });
}

export function isQueryNodeDefinition(value: NodeDefinition): value is QueryNodeDefinition {
  return value.type === QueryNodeType;
}

type ResponseAssembler = (response: NodeDefinition) => NodeDefinition;

interface QuerySetWithResponseAssembler {
  querySet: QuerySetNodeDefinition;
  responseAssembler: ResponseAssembler;
}

function buildQuerySetForQuery(
  root: NodeDefinition,
  keys: NodeDefinition,
): QuerySetWithResponseAssembler {
  const childrenWithResponseAssembler = buildQuerySetChildrenForQueryChild(keys);
  return {
    querySet: querySet(root, childrenWithResponseAssembler.querySetChildren, {
      bubbleErrorsToTop: true,
    }),
    responseAssembler: (response) =>
      toValue(childrenWithResponseAssembler.responseAssembler(response)),
  };
}

type ResponsePartAssembler = (responsePart: NodeDefinition) => any;

interface QuerySetChildrenWithResponseAssembler {
  querySetChildren: Array<QuerySetChild>;
  responseAssembler: ResponsePartAssembler;
}

function buildQuerySetChildrenForQueryChild(
  node: NodeDefinition,
): QuerySetChildrenWithResponseAssembler {
  if (isFieldsNodeDefinition(node)) {
    return buildQuerySetChildrenForFieldsNode(node);
  }
  if (isEntriesNodeDefinition(node) || isWithTransformsNodeDefinition(node)) {
    return buildQuerySetChildrenForEntriesNode(node);
  }
  throw getInvalidTypeError('Invalid query child', {
    expected: [FieldsNodeType, EntriesNodeType, WithTransformsNodeType],
    received: node,
  });
}

function buildQuerySetChildrenForFieldsNode(
  node: FieldsNodeDefinition,
): QuerySetChildrenWithResponseAssembler {
  const { fields } = node.properties;
  const keys = Object.keys(fields);
  const children = keys.map((key) => buildQuerySetChildForQueryKey(fields[key]));
  return {
    querySetChildren: children.map((child) => child.querySetChild),
    responseAssembler(response) {
      // Something must have gone wrong if this is not an array node
      if (!isArrayNodeDefinition(response)) return valueOf(response);
      const childrenResponses = response.properties.items.map((childResponse, index) =>
        children[index].responseAssembler(childResponse),
      );
      return fromPairs(zip(keys, childrenResponses));
    },
  };
}

function buildQuerySetChildrenForEntriesNode(
  node: EntriesNodeDefinition | WithTransformsNodeDefinition,
): QuerySetChildrenWithResponseAssembler {
  const { children, transforms } = getTransformsAndChildrenForEntries(node);
  const operation = getItemsOperation(transforms);
  if (!children) {
    return {
      querySetChildren: [
        querySetGetItemsOperation({
          children: [
            querySetOperation(
              resolveOperation({
                acceptNil: true,
                allowErrors: false,
                allowPending: false,
                until: untilIsFullyResolvedNode,
              }),
            ),
          ],
          operation,
        }),
      ],
      responseAssembler(response) {
        // Something must have gone wrong if this is not an array node
        if (isNilNodeDefinition(response)) return [];
        if (!isArrayNodeDefinition(response)) return valueOf(response);
        const items = response.properties.items[0];
        // Something must have gone wrong if this is not an array node
        if (isNilNodeDefinition(items)) return [];
        if (!isArrayNodeDefinition(items)) return valueOf(items);
        return items.properties.items.map((item) => {
          if (!isArrayNodeDefinition(item)) return valueOf(item);
          return valueOf(item.properties.items[0]);
        });
      },
    };
  }
  const querySetChildren = buildQuerySetChildrenForQueryChild(children);
  return {
    querySetChildren: [
      querySetGetItemsOperation({
        children: querySetChildren.querySetChildren,
        operation,
      }),
    ],
    responseAssembler(response) {
      // Something must have gone wrong if this is not an array node
      if (isNilNodeDefinition(response)) return [];
      if (!isArrayNodeDefinition(response)) return response;
      const items = response.properties.items[0];
      // Something must have gone wrong if this is not an array node
      if (isNilNodeDefinition(items)) return [];
      if (!isArrayNodeDefinition(items)) return items;
      return items.properties.items.map(querySetChildren.responseAssembler);
    },
  };
}

interface TransformsAndChildren {
  children: NodeDefinition | undefined;
  transforms: Array<NodeDefinition> | undefined;
}

function getTransformsAndChildrenForEntries(
  node: EntriesNodeDefinition | WithTransformsNodeDefinition,
): TransformsAndChildren {
  if (isWithTransformsNodeDefinition(node)) {
    return {
      children: node.properties.fields.properties.children,
      transforms: node.properties.transforms,
    };
  }
  return {
    children: node.properties.children,
    transforms: undefined,
  };
}

interface QuerySetChildWithResponseAssembler {
  querySetChild: QuerySetChild;
  responseAssembler: ResponsePartAssembler;
}

function buildQuerySetChildForQueryKey(node: NodeDefinition): QuerySetChildWithResponseAssembler {
  if (isKeyNodeDefinition(node)) {
    return buildQuerySetChildForKey(node);
  }
  if (isCreateCallerNodeDefinition(node) || isCreateSetterNodeDefinition(node)) {
    return buildQuerySetChildForCallerOrSetterNode(node);
  }
  if (isCatchErrorNodeDefinition(node)) {
    return buildQuerySetChildForCatchError(node);
  }
  if (isDeferNodeDefinition(node)) {
    return buildQuerySetChildForDefer(node);
  }
  if (isIsPendingNodeDefinition(node)) {
    return buildQuerySetChildForIsPending(node);
  }
  throw getInvalidTypeError('Invalid query key', {
    expected: [
      KeyNodeType,
      CreateCallerNodeType,
      CreateSetterNodeType,
      CatchErrorNodeType,
      DeferNodeType,
      IsPendingNodeType,
    ],
    received: node,
  });
}

function buildQuerySetChildForKey(node: KeyNodeDefinition): QuerySetChildWithResponseAssembler {
  const { children, key } = node.properties;
  if (!isValueNodeDefinition(key)) {
    throw error(
      getInvalidTypeError('Query does not support non-value keys', {
        expected: [ValueNodeType],
        received: key,
      }),
    );
  }
  const operation = getChildOperation((key as ValueNodeDefinition<string>).properties.value);
  if (!children) {
    return {
      querySetChild: querySetGetChildOperation(operation),
      responseAssembler(response) {
        if (
          !isValueNodeDefinition(response) &&
          !isQuoteNodeDefinition(response) &&
          !isNilNodeDefinition(response)
        ) {
          if (supportsGetItemsOperation(response)) {
            throw 'Invalid query: missing list item fields';
          }
          if (supportsGetChildOperation(response)) {
            throw 'Invalid query: missing child fields';
          }
          throw getInvalidTypeErrorMessage(
            `${pascalCase(response.type.name)} node cannot be resolved to a value`,
            {
              expected: [ValueNodeType, QuoteNodeType, NilNodeType],
              received: response,
            },
          );
        }
        return valueOf(response as any);
      },
    };
  }
  const querySetChildren = buildQuerySetChildrenForQueryChild(children);
  return {
    querySetChild: querySetGetChildOperation(operation, querySetChildren.querySetChildren),
    responseAssembler: querySetChildren.responseAssembler,
  };
}

function buildQuerySetChildForCallerOrSetterNode(
  node: CreateCallerNodeDefinition | CreateSetterNodeDefinition,
): QuerySetChildWithResponseAssembler {
  return {
    querySetChild: node,
    responseAssembler: valueOf,
  };
}

function buildQuerySetChildForCatchError(
  node: CatchErrorNodeDefinition,
): QuerySetChildWithResponseAssembler {
  const { fallbackGenerator, target } = node.properties;
  const targetWithResponseAssembler = buildQuerySetChildForQueryKey(target);
  return {
    querySetChild: querySetCatchError(fallbackGenerator, targetWithResponseAssembler.querySetChild),
    responseAssembler: targetWithResponseAssembler.responseAssembler,
  };
}

function buildQuerySetChildForDefer(node: DeferNodeDefinition): QuerySetChildWithResponseAssembler {
  const { fallbackGenerator, target } = node.properties;
  const targetWithResponseAssembler = buildQuerySetChildForQueryKey(target);
  return {
    querySetChild: querySetDefer(fallbackGenerator, targetWithResponseAssembler.querySetChild),
    responseAssembler: targetWithResponseAssembler.responseAssembler,
  };
}

function buildQuerySetChildForIsPending(
  node: IsPendingNodeDefinition,
): QuerySetChildWithResponseAssembler {
  const targetWithResponseAssembler = buildQuerySetChildForQueryKey(node.properties.target);
  return {
    querySetChild: querySetIsPending(targetWithResponseAssembler.querySetChild),
    responseAssembler: valueOf,
  };
}

const untilIsFullyResolvedNode = {
  predicate(node: GraphNode): boolean {
    return (
      ValueNodeType.is(node) ||
      QuoteNodeType.is(node) ||
      ErrorNodeType.is(node) ||
      EmptyItemNodeType.is(node) ||
      NilNodeType.is(node)
    );
  },
  errorMessage(node: GraphNode): string {
    if (supportsGetItemsOperation(node)) {
      return 'Invalid query: missing list item fields';
    }
    if (supportsGetChildOperation(node)) {
      return 'Invalid query: missing child fields';
    }
    return getInvalidTypeErrorMessage(
      `${pascalCase(node.definition.type.name)} node cannot be resolved to a value`,
      {
        expected: [ValueNodeType, QuoteNodeType, EmptyItemNodeType],
        received: node.definition,
      },
    );
  },
};
