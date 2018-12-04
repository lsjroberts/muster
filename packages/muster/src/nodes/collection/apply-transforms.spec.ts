import muster, {
  array,
  computed,
  context,
  entries,
  eq,
  fn,
  format,
  get,
  gt,
  key,
  KeyNodeDefinition,
  match,
  nil,
  NodeDefinition,
  NodeLike,
  param,
  query,
  ref,
  root,
  scope,
  set,
  startsWith,
  strlen,
  toNode,
  tree,
  types,
  value,
  ValueNodeDefinition,
  variable,
  withTransforms,
} from '../..';
import runScenario, { operation } from '../../test/run-scenario';
import { FieldsNodeProperties } from '../graph/fields';
import { applyTransforms } from './apply-transforms';
import { first } from './keys/first';
import { last } from './keys/last';
import { length } from './keys/length';
import { nth } from './keys/nth';
import { count } from './transforms/count';
import { filter } from './transforms/filter';
import { map } from './transforms/map';
import { slice } from './transforms/slice';
import { ascending, descending, sort } from './transforms/sort';

describe('collections', () => {
  runScenario({
    description: 'applyTransforms()',
    operations: [
      operation({
        description: 'GIVEN collection with transforms',
        input: query(
          applyTransforms(array(['foo', 'bar', 'baz']), [map(fn((item) => strlen(item)))]),
          entries(),
        ),
        expected: value([3, 3, 3]),
      }),

      operation({
        description: 'GIVEN nested collections with transforms combined from different scopes',
        input: query(
          scope(
            applyTransforms(
              scope(
                applyTransforms(array(['foo', 'bar', 'baz']), [
                  map(
                    fn((item) =>
                      format('${item}, inner: ${inner}', {
                        item,
                        inner: context('inner'),
                      }),
                    ),
                  ),
                ]),
                { inner: 'value:inner' },
              ),
              [
                map(
                  fn((item) =>
                    format('${item}, outer: ${outer}', {
                      item,
                      outer: context('outer'),
                    }),
                  ),
                ),
              ],
            ),
            { outer: 'value:outer' },
          ),
          entries(),
        ),
        expected: value([
          'foo, inner: value:inner, outer: value:outer',
          'bar, inner: value:inner, outer: value:outer',
          'baz, inner: value:inner, outer: value:outer',
        ]),
      }),
      operation({
        description: 'GIVEN collection with multiple transforms on the same query',
        input: query(
          { items: array(['foo', 'bar', 'baz']) },
          {
            identity: key('items', entries()),
            mapped: key('items', withTransforms([map(fn((item) => strlen(item)))], entries())),
            filtered: key(
              'items',
              withTransforms([filter(fn((item) => startsWith('b', item)))], entries()),
            ),
          },
        ),
        expected: value({
          identity: ['foo', 'bar', 'baz'],
          mapped: [3, 3, 3],
          filtered: ['bar', 'baz'],
        }),
      }),
    ],
  });
});

describe('applyTransforms()', () => {
  runCollectionScenario({
    description: 'GIVEN a collection of branches with a map transform that emits primitives',
    input: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }],
    transforms: [map((item: NodeDefinition) => get(item, value('name')))],
    fields: undefined,
    expected: ['foo', 'bar', 'baz'],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with a map transform that emits branches',
    input: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }],
    transforms: [map((item: NodeDefinition) => ({ id: get(item, value('name')) }))],
    fields: {
      id: key('id'),
    },
    expected: [{ id: 'foo' }, { id: 'bar' }, { id: 'baz' }],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with a filter transform',
    input: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }, { name: 'bar' }, { name: 'foo' }],
    transforms: [filter((item: NodeDefinition) => eq(get(item, value('name')), 'bar'))],
    fields: {
      name: key('name'),
    },
    expected: [{ name: 'bar' }, { name: 'bar' }],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with an {offset, length} slice transform',
    input: [
      value('zero'),
      value('one'),
      value('two'),
      value('three'),
      value('four'),
      value('five'),
      value('six'),
      value('seven'),
      value('eight'),
      value('nine'),
    ],
    transforms: [
      slice({
        offset: value(3),
        length: value(5),
      }),
    ],
    fields: undefined,
    expected: ['three', 'four', 'five', 'six', 'seven'],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with a {from, to} slice transform',
    input: [
      value('zero'),
      value('one'),
      value('two'),
      value('three'),
      value('four'),
      value('five'),
      value('six'),
      value('seven'),
      value('eight'),
      value('nine'),
    ],
    transforms: [
      slice({
        from: value(3),
        to: value(5),
      }),
    ],
    fields: undefined,
    expected: ['three', 'four', 'five'],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with a {begin, end} slice transform',
    input: [
      value('zero'),
      value('one'),
      value('two'),
      value('three'),
      value('four'),
      value('five'),
      value('six'),
      value('seven'),
      value('eight'),
      value('nine'),
    ],
    transforms: [
      slice({
        begin: value(3),
        end: value(5),
      }),
    ],
    fields: undefined,
    expected: ['three', 'four'],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with an ascending sort transform',
    input: [
      value('zero'),
      value('one'),
      value('two'),
      value('three'),
      value('four'),
      value('five'),
      value('six'),
      value('seven'),
      value('eight'),
      value('nine'),
    ],
    transforms: [
      sort(
        ascending((item: NodeDefinition) =>
          computed([item], (value: string) =>
            value
              .split('')
              .reverse()
              .join(''),
          ),
        ),
      ),
    ],
    fields: undefined,
    expected: ['three', 'nine', 'one', 'five', 'seven', 'zero', 'two', 'four', 'eight', 'six'],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with multiple sort transforms',
    input: [
      value('zero'),
      value('one'),
      value('two'),
      value('three'),
      value('four'),
      value('five'),
      value('six'),
      value('seven'),
      value('eight'),
      value('nine'),
    ],
    transforms: [
      sort([
        descending((item: NodeDefinition) => computed([item], (value: string) => value.length)),
        ascending((item: NodeDefinition) => computed([item], (value: string) => value.charAt(0))),
        descending((item: NodeDefinition) =>
          computed([item], (value: string) => value.includes('v')),
        ),
      ]),
    ],
    fields: undefined,
    expected: ['eight', 'seven', 'three', 'five', 'four', 'nine', 'zero', 'one', 'six', 'two'],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with a descending sort transform',
    input: [
      value('zero'),
      value('one'),
      value('two'),
      value('three'),
      value('four'),
      value('five'),
      value('six'),
      value('seven'),
      value('eight'),
      value('nine'),
    ],
    transforms: [
      sort(
        descending((item: NodeDefinition) =>
          computed([item], (value: string) =>
            value
              .split('')
              .reverse()
              .join(''),
          ),
        ),
      ),
    ],
    fields: undefined,
    expected: ['six', 'eight', 'four', 'two', 'zero', 'seven', 'five', 'one', 'nine', 'three'],
  });

  runCollectionScenario({
    description: 'GIVEN a collection of branches with multiple combined transforms',
    input: [
      { name: 'one' },
      { name: 'two' },
      { name: 'three' },
      { name: 'four' },
      { name: 'five' },
      { name: 'six' },
      { name: 'seven' },
      { name: 'eight' },
      { name: 'nine' },
      { name: 'ten' },
    ],
    transforms: [
      map((item: NodeDefinition) => get(item, value('name'))),
      filter((item: NodeDefinition) =>
        computed([item], (itemValue) => itemValue.startsWith('t') || itemValue.startsWith('s')),
      ),
      slice({
        offset: value(1),
        length: value(3),
      }),
      sort(ascending()),
    ],
    fields: undefined,
    expected: ['seven', 'six', 'three'],
  });

  runScenario({
    description: 'GIVEN a collection of branches with a transform that depends on a variable',
    graph: () =>
      muster({
        pageOffset: variable(3),
        pageLength: value(5),
        items: applyTransforms(
          [
            value('zero'),
            value('one'),
            value('two'),
            value('three'),
            value('four'),
            value('five'),
            value('six'),
            value('seven'),
            value('eight'),
            value('nine'),
          ],
          [
            slice({
              offset: ref('pageOffset'),
              length: ref('pageLength'),
            }),
          ],
        ),
      }),
    operations: [
      {
        description: 'AND the collection items are retrieved',
        input: query(ref('items'), entries()),
        expected: value(['three', 'four', 'five', 'six', 'seven']),
        operations: (subscriber) => [
          {
            description: 'AND the variable is updated',
            before: () => jest.clearAllMocks(),
            input: set(ref('pageOffset'), 5),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(
                value(['five', 'six', 'seven', 'eight', 'nine']),
              );
            },
            operations: [
              {
                description: 'AND the subscription is unsubscribed',
                before: () => {
                  subscriber().subscription.unsubscribe();
                },
                operations: [
                  {
                    description: 'AND the collection items are retrieved',
                    input: query(ref('items'), entries()),
                    expected: value(['five', 'six', 'seven', 'eight', 'nine']),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  runScenario({
    description: 'GIVEN a scoped transform function and a scoped item',
    graph: () =>
      muster({
        props: {
          [match(types.string, 'key')]: map(
            fn((item) => computed([param('key')], (keyParam) => get(item, value(keyParam)))),
          ),
        },
        users: {
          [match(types.string, 'type')]: [
            { name: 'alice', role: param('type') },
            { name: 'bob', role: param('type') },
          ],
        },
        values: applyTransforms(ref('users', 'admin'), [ref('props', 'role')]),
      }),
    operations: [
      operation({
        description: 'GIVEN a request for the values',
        input: query(ref('values'), entries()),
        expected: value(['admin', 'admin']),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a scoped transform function and a scoped item',
    graph: () =>
      muster({
        items: [
          { name: { first: 'alice', last: 'bob' } },
          { name: { first: 'bob', last: 'alice' } },
        ],
        names: applyTransforms(ref('items'), [ref('filters', 'mapper')]),
        names2: applyTransforms(ref('items'), [ref('filters', 'mapper')]),
        filters: {
          mapper: map((item: NodeDefinition) => tree({ settable: variable('foo') })),
        },
      }),
    operations: [
      operation({
        description: 'GIVEN a request for the values',
        input: ref('names', first(), 'settable'),
        expected: value('foo'),
        operations: (subscriber) => [
          operation({
            description: 'AND one of the values is updated',
            before: () => {
              jest.clearAllMocks();
            },
            input: set(ref('names', first(), 'settable'), 'bar'),
            expected: value('bar'),
            assert: () => {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('bar'));
            },
            operations: [
              operation({
                description: 'AND both values are retrieved',
                input: query(
                  ref('names'),
                  entries({
                    settable: key('settable'),
                  }),
                ),
                expected: value([{ settable: 'bar' }, { settable: 'foo' }]),
              }),
              operation({
                description: 'AND the original stream is unsubscribed and resubscribed',
                before: () => {
                  subscriber().subscription.unsubscribe();
                },
                input: ref('names', first(), 'settable'),
                expected: value('bar'),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a muster graph containing a collection with variables',
    graph: () =>
      muster({
        items: [
          { id: 1, read: variable(false) },
          { id: 2, read: variable(false) },
          { id: 3, read: variable(false) },
        ],
        unreadItemsCount: get(
          applyTransforms(ref('items'), [
            filter((item: NodeDefinition) => eq(get(item, value('read')), false)),
            count(),
          ]),
          first(),
        ),
      }),
    operations: [
      operation({
        description: 'WHEN getting initial unread messages count',
        input: ref('unreadItemsCount'),
        expected: value(3),
        operations: (unreadCountSubscriber) => [
          operation({
            description: 'AND the first item is marked as read',
            input: set(['items', first(), 'read'], true),
            expected: value(true),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(unreadCountSubscriber().next).toHaveBeenCalledTimes(1);
              expect(unreadCountSubscriber().next).toHaveBeenCalledWith(value(2));
            },
            operations: [
              operation({
                description: 'AND the unread items count is requested for the second time',
                before() {
                  unreadCountSubscriber().subscription.unsubscribe();
                },
                input: ref('unreadItemsCount'),
                expected: value(2),
              }),
            ],
          }),
          operation({
            description: 'AND the last item is marked as read',
            input: set(['items', last(), 'read'], true),
            expected: value(true),
            before() {
              jest.clearAllMocks();
            },
            assert() {
              expect(unreadCountSubscriber().next).toHaveBeenCalledTimes(1);
              expect(unreadCountSubscriber().next).toHaveBeenCalledWith(value(2));
            },
            operations: [
              operation({
                description: 'AND the unread items count is requested for the second time',
                before() {
                  unreadCountSubscriber().subscription.unsubscribe();
                },
                input: ref('unreadItemsCount'),
                expected: value(2),
              }),
            ],
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a collection containing a filtered books',
    graph: () =>
      muster({
        books: applyTransforms(
          [
            { title: 'Casino Royale', author: 'Ian Fleming', year: 1953 },
            { title: 'Live and Let Die', author: 'Ian Fleming', year: 1954 },
            { title: 'The Big Four', author: 'Agatha Christie', year: 1927 },
          ],
          [filter((book: NodeDefinition) => gt(ref({ root: book, path: ['year'] }), 1930))],
        ),
      }),
    operations: [
      operation({
        description: 'WHEN the books list gets requested',
        input: query(ref('books'), entries({ title: key('title') })),
        expected: value([{ title: 'Casino Royale' }, { title: 'Live and Let Die' }]),
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a nil collection',
    graph: () =>
      muster({
        items: nil(),
      }),
    operations: [
      operation({
        description: 'WHEN requesting first item`s field from a nil collection',
        input: ref('items', first(), 'name'),
        expected: value(undefined),
      }),
    ],
  });
});

function runCollectionScenario(options: {
  description: string;
  only?: boolean;
  skip?: boolean;
  input: Array<NodeLike>;
  transforms: Array<NodeDefinition>;
  fields: FieldsNodeProperties['fields'] | undefined;
  expected: Array<any>;
}) {
  return (options.skip ? runScenario.skip : options.only ? runScenario.only : runScenario)({
    description: options.description,
    graph: () =>
      muster(applyTransforms(options.input.map((item) => toNode(item)), options.transforms)),
    operations: [
      {
        description: 'AND the whole collection is retrieved',
        input: query(root(), options.fields ? entries(options.fields) : entries()),
        expected: value(options.expected),
      },
      {
        description: 'AND the length of the collection is retrieved',
        input: ref(length()),
        expected: value(options.expected.length),
      },
      ...(options.expected.length > 0
        ? [
            {
              description: 'AND a single item is retrieved',
              input: options.fields
                ? ref(nth(options.expected.length - 1), getFirstFieldName(options.fields))
                : ref(nth(options.expected.length - 1)),
              expected: options.fields
                ? value(
                    options.expected[options.expected.length - 1][
                      getFirstFieldName(options.fields)
                    ],
                  )
                : value(options.expected[options.expected.length - 1]),
            },
          ]
        : []),
      {
        description: 'AND a missing item is retrieved',
        input: options.fields
          ? ref(nth(options.expected.length), getFirstFieldName(options.fields))
          : ref(nth(options.expected.length)),
        expected: value(undefined),
      },
    ],
  });
}

function getFirstFieldName(fields: FieldsNodeProperties['fields']): string {
  return ((fields[Object.keys(fields)[0]] as KeyNodeDefinition).properties
    .key as ValueNodeDefinition<any>).properties.value;
}
