import { Observable, ObservableLike, tap } from '@dws/muster-observable';
import times from 'lodash/times';
import muster, {
  action,
  applyTransforms,
  array,
  arrayList,
  batchRequestsMiddleware,
  call,
  computed,
  context,
  count,
  createCaller,
  defer,
  dispatch,
  entries,
  eq,
  error,
  extend,
  fields,
  filter,
  first,
  firstItem,
  fn,
  format,
  fromPromise,
  fromStreamMiddleware,
  get,
  getItemsOperation,
  gt,
  head,
  ifPending,
  invalidate,
  invalidateOn,
  isPending,
  key,
  last,
  lastItem,
  length,
  lengthOperation,
  map,
  match,
  mod,
  Muster,
  nil,
  NodeDefinition,
  NOT_FOUND,
  nth,
  nthItem,
  ok,
  param,
  push,
  query,
  querySet,
  querySetCallOperation,
  querySetGetChildOperation,
  querySetGetItemsOperation,
  querySetOperation,
  ref,
  relative,
  resolveOperation,
  root,
  scope,
  series,
  set,
  slice,
  startsWith,
  toNode,
  TreeNodeDefinition,
  types,
  value,
  valueOf,
  variable,
  withErrorPath,
  withTransforms,
} from '../..';
import { mockFn, MockSubscriber, operation, runScenario } from '../../test';
import { proxy } from './proxy';

const RESOLVE_OPERATION = resolveOperation({
  acceptNil: true,
  allowErrors: false,
  allowPending: false,
});

describe('proxy()', () => {
  describe('GIVEN an external Muster instance containing a single root path', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster('foo');
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND the remote root is requested',
          input: ref('remote'),
          expected: value('foo'),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing nested paths', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        title: 'Address book',
        ui: {
          settings: {
            lang: 'en',
            currency: {
              default: 'GBP',
              thousandsSeparator: ',',
              decimalsSeparator: '.',
            },
          },
        },
        users: [
          ref('usersById', 'alice'),
          ref('usersById', 'bob'),
          ref('usersById', 'chas'),
          ref('usersById', 'dave'),
        ],
        usersById: {
          alice: {
            id: 0,
            name: 'Alice',
            friends: [ref('usersById', 'bob'), ref('usersById', 'chas')],
          },
          bob: {
            id: 1,
            name: 'Bob',
            friends: [ref('usersById', 'alice'), ref('usersById', 'dave')],
          },
          chas: {
            id: 2,
            name: 'Chas',
            friends: [ref('usersById', 'alice'), ref('usersById', 'dave')],
          },
          dave: {
            id: 3,
            name: 'Dave',
            friends: [ref('usersById', 'bob'), ref('usersById', 'chas')],
          },
        },
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware((req) => remoteMuster.resolve(req, { raw: true }))]),
          myCollection: ref('remote', 'users'),
          myIfPendingCollection: ifPending(() => array([]), ref('remote', 'users')),
          ifPendingUiSettings: ifPending(
            toNode({ settings: { lang: 'PENDING' } }),
            ref('remote', 'ui'),
          ),
        }),
      operations: [
        operation({
          description: 'AND a top-level remote path is requested',
          input: ref('remote', 'title'),
          expected: value('Address book'),
        }),
        operation({
          description: 'AND a deeply nested remote path is requested',
          input: ref('remote', 'ui', 'settings', 'lang'),
          expected: value('en'),
        }),
        operation({
          description: 'AND a nested query is requested',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  title: key('title'),
                  ui: key(
                    'ui',
                    fields({
                      settings: key(
                        'settings',
                        fields({
                          lang: key('lang'),
                          currency: key(
                            'currency',
                            fields({
                              thousandsSeparator: key('thousandsSeparator'),
                              decimalsSeparator: key('decimalsSeparator'),
                            }),
                          ),
                        }),
                      ),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              title: 'Address book',
              ui: {
                settings: {
                  lang: 'en',
                  currency: {
                    thousandsSeparator: ',',
                    decimalsSeparator: '.',
                  },
                },
              },
            },
          }),
        }),
        operation({
          description: 'AND a nested query is requested with remapped keys',
          input: query(
            root(),
            fields({
              one: key(
                'remote',
                fields({
                  two: key('title'),
                  three: key(
                    'ui',
                    fields({
                      four: key(
                        'settings',
                        fields({
                          five: key('lang'),
                          six: key(
                            'currency',
                            fields({
                              seven: key('thousandsSeparator'),
                              eight: key('decimalsSeparator'),
                            }),
                          ),
                        }),
                      ),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            one: {
              two: 'Address book',
              three: {
                four: {
                  five: 'en',
                  six: {
                    seven: ',',
                    eight: '.',
                  },
                },
              },
            },
          }),
        }),
        operation({
          description: 'AND a remote collection length is requested',
          input: ref('remote', 'users', length()),
          expected: value(4),
        }),
        operation({
          description: 'AND a remote collection item field is requested',
          input: ref('remote', 'users', nth(1), 'name'),
          expected: value('Bob'),
        }),
        operation({
          description: 'AND a remote collection length and first item name is requested',
          input: computed(
            [ref('remote', 'users', length()), ref('remote', 'users', first(), 'name')],
            (length: number, firstItemName: string) =>
              `Length: ${length}, [0] Name: ${firstItemName}`,
          ),
          expected: value('Length: 4, [0] Name: Alice'),
        }),
        operation({
          description: 'AND a view on a remote collection is requested via query traversal',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  users: key(
                    'users',
                    entries({
                      name: key('name'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              users: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Chas' }, { name: 'Dave' }],
            },
          }),
        }),
        operation({
          description: 'AND a view on a remote collection is requested via a ref to the iterator',
          input: query(
            ref('remote', 'users'),
            entries({
              name: key('name'),
            }),
          ),
          expected: value([{ name: 'Alice' }, { name: 'Bob' }, { name: 'Chas' }, { name: 'Dave' }]),
        }),
        operation({
          description: 'AND a view on a remote collection is requested with remapped keys',
          input: query(
            ref('remote', 'users'),
            entries({
              foo: key('name'),
            }),
          ),
          expected: value([{ foo: 'Alice' }, { foo: 'Bob' }, { foo: 'Chas' }, { foo: 'Dave' }]),
        }),
        operation({
          description: 'AND a view of a collection is requested with remapped keys',
          input: query(
            ref('remote', 'users'),
            entries({
              name1: key('name'),
            }),
          ),
          expected: value([
            { name1: 'Alice' },
            { name1: 'Bob' },
            { name1: 'Chas' },
            { name1: 'Dave' },
          ]),
        }),
        operation({
          description: 'AND a view of a nested collection is requested with remapped keys',
          input: query(
            ref('remote', 'users'),
            entries({
              name1: key('name'),
              friends1: key(
                'friends',
                entries({
                  name2: key('name'),
                }),
              ),
            }),
          ),
          expected: value([
            {
              name1: 'Alice',
              friends1: [{ name2: 'Bob' }, { name2: 'Chas' }],
            },
            {
              name1: 'Bob',
              friends1: [{ name2: 'Alice' }, { name2: 'Dave' }],
            },
            {
              name1: 'Chas',
              friends1: [{ name2: 'Alice' }, { name2: 'Dave' }],
            },
            {
              name1: 'Dave',
              friends1: [{ name2: 'Bob' }, { name2: 'Chas' }],
            },
          ]),
        }),
        operation({
          description: 'AND a view on a nested remote collection is requested with remapped keys',
          input: query(
            ref('remote', 'users'),
            entries({
              name1: key('name'),
              friends1: key(
                'friends',
                entries({
                  name2: key('name'),
                  friends2: key(
                    'friends',
                    entries({
                      name3: key('name'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value([
            {
              name1: 'Alice',
              friends1: [
                {
                  name2: 'Bob',
                  friends2: [{ name3: 'Alice' }, { name3: 'Dave' }],
                },
                {
                  name2: 'Chas',
                  friends2: [{ name3: 'Alice' }, { name3: 'Dave' }],
                },
              ],
            },
            {
              name1: 'Bob',
              friends1: [
                {
                  name2: 'Alice',
                  friends2: [{ name3: 'Bob' }, { name3: 'Chas' }],
                },
                {
                  name2: 'Dave',
                  friends2: [{ name3: 'Bob' }, { name3: 'Chas' }],
                },
              ],
            },
            {
              name1: 'Chas',
              friends1: [
                {
                  name2: 'Alice',
                  friends2: [{ name3: 'Bob' }, { name3: 'Chas' }],
                },
                {
                  name2: 'Dave',
                  friends2: [{ name3: 'Bob' }, { name3: 'Chas' }],
                },
              ],
            },
            {
              name1: 'Dave',
              friends1: [
                {
                  name2: 'Bob',
                  friends2: [{ name3: 'Alice' }, { name3: 'Dave' }],
                },
                {
                  name2: 'Chas',
                  friends2: [{ name3: 'Alice' }, { name3: 'Dave' }],
                },
              ],
            },
          ]),
        }),
        operation({
          description: 'AND a query with mixed child and iterator collection item access',
          input: computed(
            [
              ref('remote', 'users', length()),
              ref('remote', 'users', first(), 'name'),
              query(
                ref('remote', 'users'),
                entries({
                  name: key('name'),
                }),
              ),
            ],
            (...results: Array<any>) => value(results),
          ),
          expected: value([
            4,
            'Alice',
            [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Chas' }, { name: 'Dave' }],
          ]),
        }),
        operation({
          description: 'AND a query with mixed nested fields and nested collections',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  ui: key(
                    'ui',
                    fields({
                      settings: key(
                        'settings',
                        fields({
                          lang: key('lang'),
                        }),
                      ),
                    }),
                  ),
                  users: key(
                    'users',
                    entries({
                      name: key('name'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              ui: {
                settings: {
                  lang: 'en',
                },
              },
              users: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Chas' }, { name: 'Dave' }],
            },
          }),
        }),
        operation({
          description: 'AND a deeply nested collection path is requested',
          input: ref('remote', 'users', first(), 'friends', first(), 'friends', nth(1), 'name'),
          expected: value('Dave'),
        }),
        operation({
          description: 'AND a query with deeply nested collections is requested',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  users: key(
                    'users',
                    entries({
                      name: key('name'),
                      friends: key(
                        'friends',
                        entries({
                          name: key('name'),
                          friends: key(
                            'friends',
                            entries({
                              name: key('name'),
                            }),
                          ),
                        }),
                      ),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              users: [
                {
                  name: 'Alice',
                  friends: [
                    {
                      name: 'Bob',
                      friends: [{ name: 'Alice' }, { name: 'Dave' }],
                    },
                    {
                      name: 'Chas',
                      friends: [{ name: 'Alice' }, { name: 'Dave' }],
                    },
                  ],
                },
                {
                  name: 'Bob',
                  friends: [
                    {
                      name: 'Alice',
                      friends: [{ name: 'Bob' }, { name: 'Chas' }],
                    },
                    {
                      name: 'Dave',
                      friends: [{ name: 'Bob' }, { name: 'Chas' }],
                    },
                  ],
                },
                {
                  name: 'Chas',
                  friends: [
                    {
                      name: 'Alice',
                      friends: [{ name: 'Bob' }, { name: 'Chas' }],
                    },
                    {
                      name: 'Dave',
                      friends: [{ name: 'Bob' }, { name: 'Chas' }],
                    },
                  ],
                },
                {
                  name: 'Dave',
                  friends: [
                    {
                      name: 'Bob',
                      friends: [{ name: 'Alice' }, { name: 'Dave' }],
                    },
                    {
                      name: 'Chas',
                      friends: [{ name: 'Alice' }, { name: 'Dave' }],
                    },
                  ],
                },
              ],
            },
          }),
        }),
        operation({
          description: 'AND a remote collection is requested through a ref',
          input: query(
            root(),
            fields({
              myCollection: key(
                'myCollection',
                entries(
                  fields({
                    id: key('id'),
                    name: key('name'),
                  }),
                ),
              ),
            }),
          ),
          expected: value({
            myCollection: [
              { id: 0, name: 'Alice' },
              { id: 1, name: 'Bob' },
              { id: 2, name: 'Chas' },
              { id: 3, name: 'Dave' },
            ],
          }),
        }),
        operation({
          description: 'AND a remote collection is requested through `if-pending`',
          input: query(root(), {
            myCollection: key(
              'myIfPendingCollection',
              entries({
                id: key('id'),
                name: key('name'),
              }),
            ),
          }),
          expected: [
            value({
              myCollection: [],
            }),
            value({
              myCollection: [
                { id: 0, name: 'Alice' },
                { id: 1, name: 'Bob' },
                { id: 2, name: 'Chas' },
                { id: 3, name: 'Dave' },
              ],
            }),
          ],
        }),
        operation({
          description: 'AND a remote branch is requested through `if-pending`',
          input: query(
            root(),
            fields({
              ui: key(
                'ifPendingUiSettings',
                fields({
                  settings: key(
                    'settings',
                    fields({
                      lang: key('lang'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: [
            value({
              ui: {
                settings: {
                  lang: 'PENDING',
                },
              },
            }),
            value({
              ui: {
                settings: {
                  lang: 'en',
                },
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing undefined leaves', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        id: 1,
        name: undefined,
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND the undefined leaves are requested among other paths',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  id: key('id'),
                  name: key('name'),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              id: 1,
              name: undefined,
            },
          }),
          assert: ([firstResponse]) => {
            const response = valueOf(firstResponse);
            expect('name' in response.remote).toBe(true);
          },
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing undefined collection leaves', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        items: [
          { id: 0, name: 'foo' },
          { id: 1, name: 'bar' },
          { id: 2, name: undefined },
          { id: 3, name: 'baz' },
        ],
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        {
          description: 'AND the undefined leaves are requested among other paths',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  items: key(
                    'items',
                    entries(
                      fields({
                        id: key('id'),
                        name: key('name'),
                      }),
                    ),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              items: [
                { id: 0, name: 'foo' },
                { id: 1, name: 'bar' },
                { id: 2, name: undefined },
                { id: 3, name: 'baz' },
              ],
            },
          }),
          assert: ([firstResponse]) => {
            const response = valueOf(firstResponse as TreeNodeDefinition);
            expect('name' in response.remote.items[2]).toBe(true);
          },
        },
      ],
    });
  });

  describe('GIVEN an external Muster instance containing a collection', () => {
    const ITEMS_COUNT = 10;

    function generateItems(): Array<any> {
      return Array(ITEMS_COUNT)
        .fill({})
        .map(generateItem);
    }

    function generateItem(item: any, index: number): any {
      item.id = index + 1;
      item.name = `item ${index}`;
      return item;
    }

    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        items: generateItems(),
      });
    });

    runScenario({
      description: 'AND the proxy connected to the remote instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          localItems: ref('remote', 'items'),
        }),
      operations: [
        operation({
          description: 'WHEN requesting items from the `localItems`',
          input: query(
            root(),
            fields({
              localItems: key(
                'localItems',
                entries(
                  fields({
                    id: key('id'),
                    name: key('name'),
                  }),
                ),
              ),
            }),
          ),
          expected: value({
            localItems: generateItems(),
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing a collection', () => {
    const testItems = [
      { id: 1, name: 'First', description: 'Description of first' },
      { id: 2, name: 'Second', description: 'Description of second' },
      { id: 3, name: 'Third', description: 'Description of third' },
      { id: 4, name: 'Fourth', description: 'Description of fourth' },
      { id: 5, name: 'Fifth', description: 'Description of fifth' },
    ];

    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        items: testItems.map(value),
        itemsAsBranches: testItems,
      });
    });

    runScenario({
      description: 'AND a proxy node calling a mock resolver',
      graph: () =>
        muster({
          two: value(2),
          zero: value(0),
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get all items from a collection',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  items: key('items', entries()),
                }),
              ),
            }),
          ),
          expected: value({
            remote: { items: testItems },
          }),
        }),
        operation({
          description: 'WHEN making a query to get all items as branches',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  itemsAsBranches: key(
                    'itemsAsBranches',
                    entries({
                      id: key('id'),
                      name: key('name'),
                      description: key('description'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              itemsAsBranches: testItems,
            },
          }),
        }),
        operation({
          description: 'WHEN making a query to get the items twice with different fields',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  itemsIds: key('itemsAsBranches', entries({ id: key('id') })),
                  itemNames: key(
                    'itemsAsBranches',
                    entries({
                      name: key('name'),
                      description: key('description'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              itemsIds: testItems.map(({ id }) => ({ id })),
              itemNames: testItems.map(({ name, description }) => ({ name, description })),
            },
          }),
        }),
        operation({
          description: 'WHEN making a query to get the items with transforms',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  evenItems: key(
                    'itemsAsBranches',
                    withTransforms(
                      [filter((item) => eq(mod(get(item, value('id')), value(2)), value(0)))],
                      entries({ id: key('id') }),
                    ),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              evenItems: [{ id: 2 }, { id: 4 }],
            },
          }),
        }),
        operation({
          description: 'WHEN making a query to get the items with transforms containing refs',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  evenItems: key(
                    'itemsAsBranches',
                    withTransforms(
                      [filter((item) => eq(mod(get(item, value('id')), ref('two')), ref('zero')))],
                      entries({ id: key('id') }),
                    ),
                  ),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              evenItems: [{ id: 2 }, { id: 4 }],
            },
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing non-string paths', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        [match(types.shape({ foo: types.string }), 'id')]: param('id'),
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          filter: value({ foo: 'bar' }),
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND a remote path is requested',
          input: ref('remote', ref('filter')),
          expected: value({ foo: 'bar' }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing a collection of primitive values', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        users: ['Alice', 'Bob', 'Chas', 'Dave'],
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          filter: value({ foo: 'bar' }),
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND the items is fetched',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  users: key('users', entries()),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              users: ['Alice', 'Bob', 'Chas', 'Dave'],
            },
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing a collection of value objects', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        users: [
          value({ name: 'Alice' }),
          value({ name: 'Bob' }),
          value({ name: 'Chas' }),
          value({ name: 'Dave' }),
        ],
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          filter: value({ foo: 'bar' }),
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND the items is fetched',
          input: query(
            root(),
            fields({
              remote: key(
                'remote',
                fields({
                  users: key('users', entries()),
                }),
              ),
            }),
          ),
          expected: value({
            remote: {
              users: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Chas' }, { name: 'Dave' }],
            },
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing callable nodes', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        foo: action((arg1: string, arg2: string, arg3: string) => [arg1, arg2, arg3].join(':')),
      });
    });

    runScenario({
      description: 'AND a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND a remote function is called',
          input: call(ref('remote', 'foo'), ['bar', 'baz', 'qux']),
          expected: value('bar:baz:qux'),
        }),
      ],
    });
  });

  describe('Given an external Muster instance containing settable nodes', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        foo: variable('value:foo'),
        bar: variable('value:bar'),
        baz: variable('value:baz'),
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND a remote variable is updated',
          input: set(ref('remote', 'foo'), 'updated:foo'),
          expected: value('updated:foo'),
          operations: [
            operation({
              description: 'AND the remote variable is retrieved',
              input: ref('remote', 'foo'),
              expected: value('updated:foo'),
            }),
          ],
        }),
        operation({
          description: 'AND a subscription is created for a remote variable',
          input: ref('remote', 'foo'),
          expected: value('value:foo'),
          operations: (subscriber: () => MockSubscriber) => [
            operation({
              description: 'AND a remote variable is updated',
              before: () => {
                jest.clearAllMocks();
              },
              input: set(ref('remote', 'foo'), 'updated:foo'),
              expected: value('updated:foo'),
              assert: () => {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('updated:foo'));
              },
              operations: [
                operation({
                  description: 'AND the remote variable is retrieved',
                  input: ref('remote', 'foo'),
                  expected: value('updated:foo'),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance that returns a top-level error with metadata', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster(error('foo', { data: { foo: 'bar' } }));
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND the remote root is requested',
          input: ref('remote'),
          expected: withErrorPath(error('foo', { data: { foo: 'bar' } }), {
            path: ['remote'],
            remotePath: [],
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance that returns a nested error', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        foo: error('bar', { data: { foo: 'bar' } }),
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND a remote leaf is requested',
          input: ref('remote', 'foo'),
          expected: withErrorPath(error('bar', { data: { foo: 'bar' } }), {
            path: ['remote', 'foo'],
            remotePath: ['foo'],
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance that returns a nested error', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        deeply: {
          nested: {
            foo: error('bar', { data: { foo: 'bar' } }),
          },
        },
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND a remote leaf is requested',
          input: ref('remote', 'deeply', 'nested', 'foo'),
          expected: withErrorPath(error('bar', { data: { foo: 'bar' } }), {
            path: ['remote', 'deeply', 'nested', 'foo'],
            remotePath: ['deeply', 'nested', 'foo'],
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance that returns a nested ref to an error', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        foo: ref('bar'),
        bar: error('baz', { data: { foo: 'bar' } }),
      });
    });

    runScenario({
      description: 'GIVEN a proxy node that relays queries to the external Muster instance',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'AND a remote leaf is requested',
          input: ref('remote', 'foo'),
          expected: withErrorPath(error('baz', { data: { foo: 'bar' } }), {
            path: ['remote', 'foo'],
            remotePath: ['bar'],
          }),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        foo: 'value:foo',
      });
    });

    let successCallback: jest.Mock<NodeDefinition>;
    let errorCallback: jest.Mock<NodeDefinition>;
    runScenario({
      description: 'AND a local action that depends on a remote value',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          action: action(function*() {
            return yield ref('remote', 'foo');
          }),
        }),
      operations: [
        operation({
          description: 'AND an action createCaller is created',
          input: query(
            root(),
            fields({
              callAction: createCaller('action'),
            }),
          ),
          expected: value({
            callAction: expect.any(Function),
          }),
          operations: (subscriber, results: () => Array<NodeDefinition>) => [
            operation({
              description: 'AND the action is called from outside Muster',
              before: async () => {
                successCallback = jest.fn();
                errorCallback = jest.fn();
                const result = valueOf(results()[0]);
                await result.callAction().then(successCallback, errorCallback);
              },
              assert: () => {
                expect(successCallback).toHaveBeenCalledTimes(1);
                expect(successCallback).toHaveBeenCalledWith('value:foo');
                expect(errorCallback).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing collection', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        items: [1, 2, 3],
      });
    });

    runScenario({
      description: 'AND a local instance of muster connected to the remote',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get the items from the remote',
          input: query(ref('remote', 'items'), entries()),
          expected: value([1, 2, 3]),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing collection', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        items: [1, 2, 3],
      });
    });

    runScenario({
      description: 'AND the local graph contains a scoped link to remote collection',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          scope: scope(
            {
              linkedItems: context('items'),
            },
            { items: ref('remote', 'items') },
          ),
        }),
      operations: [
        operation({
          description: 'WHEN making the query for items from scope',
          input: query(ref('scope', 'linkedItems'), entries()),
          expected: value([1, 2, 3]),
        }),
      ],
    });
  });

  describe('GIVEN an external Muster instance containing settable node', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        myVariable: variable('initial value'),
      });
    });

    runScenario({
      description: 'WHEN the local graph contains a scoped link to remote variable',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          scope: scope(
            {
              linkedVariable: context('remoteVariable'),
            },
            { remoteVariable: ref('remote', 'myVariable') },
          ),
        }),
      operations: [
        operation({
          description: 'AND the query is asking for items from scoped items',
          input: set(ref('scope', 'linkedVariable'), 'updated value'),
          expected: value('updated value'),
        }),
      ],
    });
  });

  describe('Error handling', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        returnsError: error('This one returns error'),
        computedError: computed([], () => error('Computed error')),
        dependencyError: computed([ref('returnsError')], () => ''),
        nested: {
          returnsError: error('This one returns error'),
          computedError: computed([], () => error('Computed error')),
          dependencyError: computed([ref('returnsError')], () => ''),
        },
      });
    });

    runScenario({
      description: 'GIVEN a remote instance returning an error every time a query is made',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          brokenRemote: proxy([
            fromStreamMiddleware((value) => Observable.of(error('Some remote error'))),
          ]),
        }),
      operations: [
        operation({
          description: 'AND the request is made to a broken instance leaf',
          input: ref('brokenRemote', 'leaf'),
          expected: withErrorPath(error('Some remote error'), { path: ['brokenRemote', 'leaf'] }),
        }),
        operation({
          description: 'AND the request is made to a broken instance nested leaf',
          input: ref('brokenRemote', 'nested', 'leaf'),
          expected: withErrorPath(error('Some remote error'), {
            path: ['brokenRemote', 'nested', 'leaf'],
          }),
        }),
        operation({
          description: 'AND the request is made to incorrect node',
          input: ref('remote', 'incorrect'),
          expected: withErrorPath(error('Invalid child key: "incorrect"', { code: NOT_FOUND }), {
            path: ['remote', 'incorrect'],
            remotePath: [],
          }),
        }),
        operation({
          description: 'AND the request is made to a node returning error',
          input: ref('remote', 'returnsError'),
          expected: withErrorPath(error('This one returns error'), {
            path: ['remote', 'returnsError'],
            remotePath: ['returnsError'],
          }),
        }),
        operation({
          description: 'AND the request is made to a node returning computed error',
          input: ref('remote', 'computedError'),
          expected: withErrorPath(error('Computed error'), {
            path: ['remote', 'computedError'],
            remotePath: ['computedError'],
          }),
        }),
        operation({
          description: 'AND the request is made to a node returning dependency error',
          input: ref('remote', 'dependencyError'),
          expected: withErrorPath(error('This one returns error'), {
            path: ['remote', 'dependencyError'],
            remotePath: ['returnsError'],
          }),
        }),
        operation({
          description: 'AND the request is made to a nested node returning error',
          input: ref('remote', 'nested', 'returnsError'),
          expected: withErrorPath(error('This one returns error'), {
            path: ['remote', 'nested', 'returnsError'],
            remotePath: ['nested', 'returnsError'],
          }),
        }),
        operation({
          description: 'AND the request is made to a nested node returning computed error',
          input: ref('remote', 'nested', 'computedError'),
          expected: withErrorPath(error('Computed error'), {
            path: ['remote', 'nested', 'computedError'],
            remotePath: ['nested', 'computedError'],
          }),
        }),
        operation({
          description: 'AND the request is made to a nested node returning dependency error',
          input: ref('remote', 'nested', 'dependencyError'),
          expected: withErrorPath(error('This one returns error'), {
            path: ['remote', 'nested', 'dependencyError'],
            remotePath: ['returnsError'],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing an error node', () => {
    let remoteMuster: Muster;

    beforeEach(() => {
      remoteMuster = muster({
        something: error('A remote error'),
      });
    });

    runScenario({
      description: 'AND a local instance is connected to the remote',
      graph: () =>
        muster({
          proxy: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN a query asks for the remote node',
          input: query(
            root(),
            fields({
              proxy: key(
                'proxy',
                fields({
                  something: key('something'),
                }),
              ),
            }),
          ),
          expected: withErrorPath(error('A remote error'), {
            path: ['proxy', 'something'],
            remotePath: ['something'],
          }),
        }),
        operation({
          description: 'WHEN a query asks for the remote node',
          input: query(
            root(),
            fields({
              proxy: key(
                'proxy',
                fields({
                  something: key(
                    'something',
                    fields({
                      nested: key('nested'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: withErrorPath(error('A remote error'), {
            path: ['proxy', 'something', 'nested'],
            remotePath: ['something'],
          }),
        }),
        operation({
          description: 'WHEN a query asks for the remote node',
          input: query(
            root(),
            fields({
              proxy: key(
                'proxy',
                fields({
                  something: key(
                    'something',
                    fields({
                      nested: key(
                        'nested',
                        fields({
                          items: key(
                            'items',
                            entries({
                              name: key('name'),
                            }),
                          ),
                        }),
                      ),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: withErrorPath(error('A remote error'), {
            path: ['proxy', 'something', 'nested', 'items'],
            remotePath: ['something'],
          }),
        }),
        operation({
          description: 'WHEN a query asks for a remote collection which errors',
          input: query(
            root(),
            fields({
              proxy: key(
                'proxy',
                fields({
                  something: key('something', entries()),
                }),
              ),
            }),
          ),
          expected: withErrorPath(error('A remote error'), {
            path: ['proxy', 'something'],
            remotePath: ['something'],
          }),
        }),
        operation({
          description: 'WHEN a query asks for some fields from a remote collection which errors',
          input: query(
            root(),
            fields({
              proxy: key(
                'proxy',
                fields({
                  something: key(
                    'something',
                    entries({
                      name: key('name'),
                    }),
                  ),
                }),
              ),
            }),
          ),
          expected: withErrorPath(error('A remote error'), {
            path: ['proxy', 'something'],
            remotePath: ['something'],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection', () => {
    let remoteMuster: Muster;

    beforeEach(() => {
      remoteMuster = muster({
        items: ['foo', 'bar', 'baz'],
      });
    });

    runScenario({
      description: 'AND a local instance is connected to the remote instance',
      graph: () =>
        muster({
          proxy: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          items: ref('proxy', 'items'),
          filteredItems: applyTransforms(ref('items'), [filter((item) => startsWith('b', item))]),
          firstItem: get(ref('items'), first()),
          secondItem: get(ref('items'), nth(1)),
          lastItem: get(ref('items'), last()),
          numItems: get(ref('items'), length()),
          numFilteredItems: get(ref('filteredItems'), length()),
        }),
      operations: [
        operation({
          description: 'AND a query requests multiple transformed versions of the collection',
          input: query(root(), {
            items: entries(),
            filteredItems: entries(),
            firstItem: true,
            secondItem: true,
            lastItem: true,
            numItems: true,
            numFilteredItems: true,
          }),
          expected: value({
            items: ['foo', 'bar', 'baz'],
            filteredItems: ['bar', 'baz'],
            firstItem: 'foo',
            secondItem: 'bar',
            lastItem: 'baz',
            numItems: 3,
            numFilteredItems: 2,
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing nested errors within a collection', () => {
    let remoteMuster: Muster;

    beforeEach(() => {
      remoteMuster = muster({
        items: [
          { valid: 'value:foo', invalid: error('error:foo') },
          { valid: 'value:bar', invalid: error('error:bar') },
          { valid: 'value:baz', invalid: error('error:baz') },
        ],
      });
    });

    runScenario({
      description: 'AND a local instance is connected to the remote instance',
      graph: () =>
        muster({
          proxy: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation.skip({
          description: 'AND a query is made for the collection items',
          input: query(ref('proxy'), {
            items: entries({
              valid: true,
              invalid: true,
            }),
          }),
          expected: value({
            items: [
              {
                valid: 'value:foo',
                invalid: withErrorPath(error('error:foo'), {
                  path: ['proxy', 'items', 'invalid'],
                  remotePath: ['items', 'invalid'],
                }),
              },
              {
                valid: 'value:bar',
                invalid: withErrorPath(error('error:bar'), {
                  path: ['proxy', 'items', 'invalid'],
                  remotePath: ['items', 'invalid'],
                }),
              },
              {
                valid: 'value:baz',
                invalid: withErrorPath(error('error:baz'), {
                  path: ['proxy', 'items', 'invalid'],
                  remotePath: ['items', 'invalid'],
                }),
              },
            ],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing deeply nested errors within a collection', () => {
    let remoteMuster: Muster;

    beforeEach(() => {
      remoteMuster = muster({
        items: [
          [
            { valid: 'value:foo:1', invalid: error('error:foo:1') },
            { valid: 'value:bar:1', invalid: error('error:bar:1') },
          ],
          [
            { valid: 'value:foo:2', invalid: error('error:foo:2') },
            { valid: 'value:bar:2', invalid: error('error:bar:2') },
          ],
        ],
      });
    });

    runScenario({
      description: 'AND a local instance is connected to the remote instance',
      graph: () =>
        muster({
          proxy: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation.skip({
          description: 'AND a query is made for the collection items',
          input: query(ref('proxy'), {
            items: entries(
              entries({
                valid: true,
                invalid: true,
              }),
            ),
          }),
          expected: value({
            items: [
              [
                {
                  valid: 'value:foo:1',
                  invalid: withErrorPath(error('error:foo:1'), {
                    path: ['proxy', 'items', 'invalid'],
                    remotePath: ['items', 'invalid'],
                  }),
                },
                {
                  valid: 'value:bar:1',
                  invalid: withErrorPath(error('error:bar:1'), {
                    path: ['proxy', 'items', 'invalid'],
                    remotePath: ['items', 'invalid'],
                  }),
                },
              ],
              [
                {
                  valid: 'value:foo:2',
                  invalid: withErrorPath(error('error:foo:2'), {
                    path: ['proxy', 'items', 'invalid'],
                    remotePath: ['items', 'invalid'],
                  }),
                },
                {
                  valid: 'value:bar:2',
                  invalid: withErrorPath(error('error:bar:2'), {
                    path: ['proxy', 'items', 'invalid'],
                    remotePath: ['items', 'invalid'],
                  }),
                },
              ],
            ],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection of numbers', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          numbers: [1, 2, 3],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: invalidateOn('refresh', proxy([fromStreamMiddleware(mockRemoteResolve)])),
          filteredNumbers: applyTransforms(ref('remote', 'numbers'), [
            filter((item) => gt(item, 1)),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get filtered list of numbers',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('filteredNumbers'), entries()),
          expected: value([2, 3]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('numbers', [
                  querySetGetItemsOperation({
                    operation: getItemsOperation([filter(mockFn((item) => gt(item, 1)))]),
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the filteredItems gets invalidated',
              before() {
                jest.clearAllMocks();
              },
              input: dispatch('refresh'),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('numbers', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([filter(mockFn((item) => gt(item, 1)))]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                    ]),
                  ]),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection of trees', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: invalidateOn('refresh', proxy([fromStreamMiddleware(mockRemoteResolve)])),
          filteredItems: applyTransforms(ref('remote', 'items'), [
            filter((item) => gt(get(item, 'id'), 1)),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get filtered list of items',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('filteredItems'),
            entries({
              id: true as true,
              name: true as true,
            }),
          ),
          expected: value([{ id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('items', [
                  querySetGetItemsOperation({
                    operation: getItemsOperation([
                      filter(mockFn((item) => gt(get(item, 'id'), 1))),
                    ]),
                    children: [
                      querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                      querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                    ],
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the filteredItems gets invalidated',
              before() {
                jest.clearAllMocks();
              },
              input: dispatch('refresh'),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => gt(get(item, 'id'), 1))),
                        ]),
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                          querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                      }),
                    ]),
                  ]),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a deeply nested collection of trees', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          deeply: {
            nested: {
              items: [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
                { id: 3, name: 'Item 3' },
              ],
            },
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: invalidateOn('refresh', proxy([fromStreamMiddleware(mockRemoteResolve)])),
          filteredItems: applyTransforms(ref('remote', 'deeply', 'nested', 'items'), [
            filter((item) => gt(get(item, 'id'), 1)),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get filtered list of items',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('filteredItems'),
            entries({
              id: true as true,
              name: true as true,
            }),
          ),
          expected: value([{ id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('deeply', [
                  querySetGetChildOperation('nested', [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => gt(get(item, 'id'), 1))),
                        ]),
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                          querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                      }),
                    ]),
                  ]),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the filteredItems gets invalidated',
              before() {
                jest.clearAllMocks();
              },
              input: dispatch('refresh'),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('deeply', [
                      querySetGetChildOperation('nested', [
                        querySetGetChildOperation('items', [
                          querySetGetItemsOperation({
                            operation: getItemsOperation([
                              filter(mockFn((item) => gt(get(item, 'id'), 1))),
                            ]),
                            children: [
                              querySetGetChildOperation('name', [
                                querySetOperation(RESOLVE_OPERATION),
                              ]),
                              querySetGetChildOperation('id', [
                                querySetOperation(RESOLVE_OPERATION),
                              ]),
                            ],
                          }),
                        ]),
                      ]),
                    ]),
                  ]),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection of trees with dynamic filter', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          filteredItems: applyTransforms(ref('remote', 'items'), [
            filter((item) => gt(get(item, 'id'), ref('minId'))),
          ]),
          minId: variable(1),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get filtered list of items',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('filteredItems'),
            entries({
              id: true as true,
              name: true as true,
            }),
          ),
          expected: value([{ id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('items', [
                  querySetGetItemsOperation({
                    operation: getItemsOperation([
                      filter(mockFn((item) => gt(get(item, 'id'), 1))),
                    ]),
                    children: [
                      querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                      querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                    ],
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the filter changes',
              before() {
                jest.clearAllMocks();
              },
              input: set('minId', 2),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => gt(get(item, 'id'), 2))),
                        ]),
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                          querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                      }),
                    ]),
                  ]),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a deeply nested collection of trees with dynamic filter', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          deeply: {
            nested: {
              items: [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
                { id: 3, name: 'Item 3' },
              ],
            },
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          filteredItems: applyTransforms(ref('remote', 'deeply', 'nested', 'items'), [
            filter((item) => gt(get(item, 'id'), ref('minId'))),
          ]),
          minId: variable(1),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get filtered list of items',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('filteredItems'),
            entries({
              id: true as true,
              name: true as true,
            }),
          ),
          expected: value([{ id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('deeply', [
                  querySetGetChildOperation('nested', [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => gt(get(item, 'id'), 1))),
                        ]),
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                          querySetGetChildOperation('id', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                      }),
                    ]),
                  ]),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the filter changes',
              before() {
                jest.clearAllMocks();
              },
              input: set('minId', 2),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('deeply', [
                      querySetGetChildOperation('nested', [
                        querySetGetChildOperation('items', [
                          querySetGetItemsOperation({
                            operation: getItemsOperation([
                              filter(mockFn((item) => gt(get(item, 'id'), 2))),
                            ]),
                            children: [
                              querySetGetChildOperation('name', [
                                querySetOperation(RESOLVE_OPERATION),
                              ]),
                              querySetGetChildOperation('id', [
                                querySetOperation(RESOLVE_OPERATION),
                              ]),
                            ],
                          }),
                        ]),
                      ]),
                    ]),
                  ]),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection within a variable', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    beforeEach(() => {
      remoteMuster = muster({
        items: variable(array(['foo', 'bar', 'baz'])),
        addItem: action(function*(item) {
          const existingItems = yield query(ref('items'), entries());
          return series([set('items', array([...existingItems, item])), ok()]);
        }),
      });
      mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
    });

    runScenario({
      description: 'AND a local instance is connected to the remote instance',
      graph: () =>
        muster({
          proxy: invalidateOn('refresh', proxy([fromStreamMiddleware(mockRemoteResolve)])),
          items: ref('proxy', 'items'),
          filteredItems: applyTransforms(ref('items'), [filter((item) => startsWith('b', item))]),
          firstItem: get(ref('items'), first()),
          secondItem: get(ref('items'), nth(1)),
          lastItem: get(ref('items'), last()),
          numItems: get(ref('items'), length()),
          numFilteredItems: get(ref('filteredItems'), length()),
        }),
      operations: [
        operation({
          description: 'WHEN calling remote `addItem` action',
          before() {
            jest.clearAllMocks();
          },
          input: call(ref('proxy', 'addItem'), [value('qux')]),
          expected: ok(),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('addItem', [querySetCallOperation([value('qux')])]),
              ]),
            );
          },
          operations: [
            operation({
              description: 'AND a query for the collection is made',
              before() {
                jest.clearAllMocks();
              },
              input: query(ref('items'), entries()),
              expected: value(['foo', 'bar', 'baz', 'qux']),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                    ]),
                  ]),
                );
              },
            }),
            operation({
              description: 'AND a query for multiple versions of the collection is made',
              before() {
                jest.clearAllMocks();
              },
              input: query(root(), {
                items: entries(),
                filteredItems: entries(),
                firstItem: true,
                secondItem: true,
                lastItem: true,
                numItems: true,
                numFilteredItems: true,
              }),
              expected: value({
                items: ['foo', 'bar', 'baz', 'qux'],
                filteredItems: ['bar', 'baz'],
                firstItem: 'foo',
                secondItem: 'bar',
                lastItem: 'qux',
                numItems: 4,
                numFilteredItems: 2,
              }),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => startsWith('b', item))),
                          count(),
                          firstItem(),
                        ]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                      querySetGetItemsOperation({
                        operation: getItemsOperation([lastItem(), firstItem()]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                      querySetGetItemsOperation({
                        operation: getItemsOperation([nthItem(1), firstItem()]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                      querySetGetItemsOperation({
                        operation: getItemsOperation([firstItem(), firstItem()]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => startsWith('b', item))),
                        ]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                      querySetGetItemsOperation({
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                      querySetOperation(lengthOperation()),
                    ]),
                  ]),
                );
              },
            }),
          ],
        }),
        operation({
          description: 'AND a query requests the unfiltered items',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('items'), entries()),
          expected: value(['foo', 'bar', 'baz']),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('items', [
                  querySetGetItemsOperation({
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the remote collection is updated',
              before() {
                jest.clearAllMocks();
              },
              input: series([call(ref('proxy', 'addItem'), [value('qux')]), dispatch('refresh')]),
              expected: ok(),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(2);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                    ]),
                    querySetGetChildOperation('addItem', [querySetCallOperation([value('qux')])]),
                  ]),
                );
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                    ]),
                  ]),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value(['foo', 'bar', 'baz', 'qux']));
              },
            }),
          ],
        }),
        operation({
          description: 'AND a query requests the filtered items',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('filteredItems'), entries()),
          expected: value(['bar', 'baz']),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('items', [
                  querySetGetItemsOperation({
                    operation: getItemsOperation([filter(mockFn((item) => startsWith('b', item)))]),
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the remote collection is updated',
              before() {
                jest.clearAllMocks();
              },
              input: series([call(ref('proxy', 'addItem'), [value('qux')]), dispatch('refresh')]),
              expected: ok(),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(2);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => startsWith('b', item))),
                        ]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                    ]),
                    querySetGetChildOperation('addItem', [querySetCallOperation([value('qux')])]),
                  ]),
                );
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('items', [
                      querySetGetItemsOperation({
                        operation: getItemsOperation([
                          filter(mockFn((item) => startsWith('b', item))),
                        ]),
                        children: [querySetOperation(RESOLVE_OPERATION)],
                      }),
                    ]),
                  ]),
                );
                expect(subscriber().next).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
        operation({
          description: 'AND a query requests multiple transformed versions of the collection',
          before() {
            jest.clearAllMocks();
          },
          input: query(root(), {
            items: entries(),
            filteredItems: entries(),
            firstItem: true,
            secondItem: true,
            lastItem: true,
            numItems: true,
            numFilteredItems: true,
          }),
          expected: value({
            items: ['foo', 'bar', 'baz'],
            filteredItems: ['bar', 'baz'],
            firstItem: 'foo',
            secondItem: 'bar',
            lastItem: 'baz',
            numItems: 3,
            numFilteredItems: 2,
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            // One thing to note here is that the order of these child operations is not important
            // but Jest seems to take it very seriously...
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('items', [
                  querySetGetItemsOperation({
                    operation: getItemsOperation([
                      filter(mockFn((item) => startsWith('b', item))),
                      count(),
                      firstItem(),
                    ]),
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                  querySetGetItemsOperation({
                    operation: getItemsOperation([lastItem(), firstItem()]),
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                  querySetGetItemsOperation({
                    operation: getItemsOperation([nthItem(1), firstItem()]),
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                  querySetGetItemsOperation({
                    operation: getItemsOperation([firstItem(), firstItem()]),
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                  querySetGetItemsOperation({
                    operation: getItemsOperation([filter(mockFn((item) => startsWith('b', item)))]),
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                  querySetGetItemsOperation({
                    children: [querySetOperation(RESOLVE_OPERATION)],
                  }),
                  querySetOperation(lengthOperation()),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the collection is updated',
              before() {
                jest.clearAllMocks();
              },
              input: series([call(ref('proxy', 'addItem'), [value('qux')]), dispatch('refresh')]),
              expected: ok(),
              assert: () => {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(2);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenLastCalledWith(
                  value({
                    items: ['foo', 'bar', 'baz', 'qux'],
                    filteredItems: ['bar', 'baz'],
                    firstItem: 'foo',
                    secondItem: 'bar',
                    lastItem: 'qux',
                    numItems: 4,
                    numFilteredItems: 2,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the collection is unsubscribed and retrieved again',
                  before: () => {
                    subscriber().subscription.unsubscribe();
                  },
                  input: query(root(), {
                    items: entries(),
                    filteredItems: entries(),
                    firstItem: true,
                    secondItem: true,
                    lastItem: true,
                    numItems: true,
                    numFilteredItems: true,
                  }),
                  expected: value({
                    items: ['foo', 'bar', 'baz', 'qux'],
                    filteredItems: ['bar', 'baz'],
                    firstItem: 'foo',
                    secondItem: 'bar',
                    lastItem: 'qux',
                    numItems: 4,
                    numFilteredItems: 2,
                  }),
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing an action that errors', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        err: error('Boom!', { data: { hello: 'world' } }),
        action: action(function*() {
          yield ref('err');
        }),
      });
    });

    runScenario({
      description: 'AND the local instance of muster with connection to the remote',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN calling the remote action',
          input: call(ref('remote', 'action')),
          expected: withErrorPath(error('Boom!', { data: { hello: 'world' } }), {
            path: ['remote', 'action'],
            remotePath: ['action'],
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection of values', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        items: ['first', 'second', 'third', 'fourth'],
      });
    });

    runScenario({
      description: 'AND the local instance of muster requests the paginated items',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          items: applyTransforms(ref('remote', 'items'), [
            slice({
              offset: ref('offset'),
              length: ref('pageSize'),
            }),
          ]),
          offset: variable(0),
          pageSize: variable(1),
        }),
      operations: [
        operation({
          description: 'WHEN the collection gets requested',
          input: query(root(), {
            items: key('items', entries()),
          }),
          expected: value({
            items: ['first'],
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the offset gets updated',
              before() {
                jest.clearAllMocks();
              },
              input: set('offset', 1),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    items: ['second'],
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });

    let mockResolve: jest.Mock<Promise<NodeDefinition>>;
    runScenario({
      description: 'AND the local instance of muster connected to the remote',
      before() {
        mockResolve = jest.fn((val) => remoteMuster.resolve(val, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockResolve)]),
          items: applyTransforms(ref('remote', 'items'), [firstItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN the collection is requested',
          input: query(root(), {
            remote: key('remote', {
              items: key('items', entries()),
            }),
          }),
          expected: value({
            remote: {
              items: ['first', 'second', 'third', 'fourth'],
            },
          }),
          assert() {
            // Check if there was only one request to the list
            expect(mockResolve).toHaveBeenCalledTimes(1);
          },
        }),
        operation({
          description: 'WHEN the first item is requested from the collection',
          input: ref('remote', 'items', first()),
          expected: value('first'),
          assert() {
            // Check if there was only one request to the list
            expect(mockResolve).toHaveBeenCalledTimes(1);
          },
        }),
        operation({
          description: 'WHEN the first item is requested from the collection',
          input: query(root(), {
            items: key('items', entries()),
          }),
          expected: value({
            items: ['first'],
          }),
          assert() {
            // Check if there was only one request to the list
            expect(mockResolve).toHaveBeenCalledTimes(1);
          },
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing collection of branches', () => {
    let remoteMuster: Muster;
    beforeEach(() => {
      remoteMuster = muster({
        items: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
      });
    });

    let mockResolve: jest.Mock<Promise<NodeDefinition>>;
    runScenario({
      description: 'AND the local instance of muster connected to the remote',
      before() {
        mockResolve = jest.fn((val) => remoteMuster.resolve(val, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockResolve)]),
          items: applyTransforms(ref('remote', 'items'), [firstItem()]),
        }),
      operations: [
        operation({
          description: 'WHEN the collection is requested',
          input: query(root(), {
            remote: key('remote', {
              items: key(
                'items',
                entries({
                  name: key('name'),
                }),
              ),
            }),
          }),
          expected: value({
            remote: {
              items: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
            },
          }),
          assert() {
            // Check if there was only one request to the list
            expect(mockResolve).toHaveBeenCalledTimes(1);
          },
        }),
        operation({
          description: 'WHEN the first item is requested from the collection',
          input: query(ref('remote', 'items', first()), {
            name: key('name'),
          }),
          expected: value({ name: 'first' }),
          assert() {
            // Check if there was only one request to the list
            expect(mockResolve).toHaveBeenCalledTimes(1);
          },
        }),
        operation({
          description: 'WHEN the first item is requested through a local ',
          input: query(root(), {
            items: key(
              'items',
              entries({
                name: key('name'),
              }),
            ),
          }),
          expected: value({
            items: [{ name: 'first' }],
          }),
          assert() {
            // Check if there was only one request to the list
            expect(mockResolve).toHaveBeenCalledTimes(1);
          },
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing an action and a value', () => {
    let remoteMuster: Muster;
    runScenario({
      description: 'AND the local instance connected to that remote',
      before() {
        remoteMuster = muster({
          action: action(() => value('act')),
          value: value('val'),
        });
      },
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN the request is made for both values from the server',
          input: computed(
            [call(['remote', 'action']), ref('remote', 'value')],
            (actionResponse: string, valueResponse: string) => `${actionResponse}:${valueResponse}`,
          ),
          expected: value('act:val'),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing an async field', () => {
    let remoteMuster: Muster;
    let resolvePromise: () => void;
    runScenario({
      description: 'AND the local instance is connected to that remote',
      before() {
        remoteMuster = muster({
          [match(types.string, 'name')]: fromPromise((props: any) =>
            new Promise((res) => (resolvePromise = res)).then(() => value(`remote ${props.name}`)),
          ),
        });
      },
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          name: variable('initial'),
          asyncName: ref('remote', ref('name')),
        }),
      operations: [
        operation({
          description:
            'WHEN the query is made for the remote with the use of isPending and deferred',
          input: query(root(), {
            asyncName: defer('asyncName'),
            isLoadingAsyncName: isPending('asyncName'),
          }),
          expected: value({
            asyncName: undefined,
            isLoadingAsyncName: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promise resolves',
              async before() {
                jest.clearAllMocks();
                resolvePromise();
                await Promise.resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    asyncName: 'remote initial',
                    isLoadingAsyncName: false,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the name changes',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        asyncName: 'remote initial',
                        isLoadingAsyncName: true,
                      }),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the promise resolves',
                      async before() {
                        jest.clearAllMocks();
                        resolvePromise();
                        await Promise.resolve();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            asyncName: 'remote updated',
                            isLoadingAsyncName: false,
                          }),
                        );
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing an async items', () => {
    let remoteMuster: Muster;
    let promisesToResolve: Array<() => void>;
    let resolvePromises: () => void;
    runScenario({
      description: 'AND the local instance is connected to that remote',
      before() {
        promisesToResolve = [];
        resolvePromises = () => {
          promisesToResolve.forEach((resolve) => resolve());
          promisesToResolve = [];
        };
        remoteMuster = muster({
          [match(types.string, 'name')]: fromPromise((props: any) =>
            new Promise((res) => promisesToResolve.push(res)).then(() =>
              array([`${props.name} 1`, `${props.name} 2`]),
            ),
          ),
        });
      },
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          name: variable('initial'),
          asyncItems: ref('remote', ref('name')),
        }),
      operations: [
        operation({
          description:
            'WHEN the query is made for the remote with the use of isPending and deferred',
          input: query(root(), {
            asyncItems: defer(key('asyncItems', entries())),
            isLoadingAsyncItems: isPending(key('asyncItems', entries())),
          }),
          expected: value({
            asyncItems: [],
            isLoadingAsyncItems: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promise resolves',
              async before() {
                jest.clearAllMocks();
                resolvePromises();
                await Promise.resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    asyncItems: ['initial 1', 'initial 2'],
                    isLoadingAsyncItems: false,
                  }),
                );
              },
              operations: [
                operation({
                  description: 'AND the name changes',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set('name', 'updated'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value({
                        asyncItems: ['initial 1', 'initial 2'],
                        isLoadingAsyncItems: true,
                      }),
                    );
                  },
                  operations: [
                    operation({
                      description: 'AND the promise resolves',
                      async before() {
                        jest.clearAllMocks();
                        resolvePromises();
                        await Promise.resolve();
                      },
                      assert() {
                        expect(subscriber().next).toHaveBeenCalledTimes(1);
                        expect(subscriber().next).toHaveBeenCalledWith(
                          value({
                            asyncItems: ['updated 1', 'updated 2'],
                            isLoadingAsyncItems: false,
                          }),
                        );
                      },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster graph containing two async branches', () => {
    let remoteMuster: Muster;
    let resolveFirst: () => void;
    let resolveSecond: () => void;
    runScenario({
      description: 'AND the local instance is connected to that remote',
      before() {
        remoteMuster = muster({
          first: fromPromise(() => new Promise((res) => (resolveFirst = res)).then(() => 'first')),
          second: fromPromise(() =>
            new Promise((res) => (resolveSecond = res)).then(() => 'second'),
          ),
        });
      },
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          first: ref('remote', 'first'),
          second: ref('remote', 'second'),
        }),
      operations: [
        operation({
          description: 'WHEN making a query for remote first and second',
          input: ifPending(
            () => value('PENDING'),
            query(root(), {
              first: key('first'),
              second: key('second'),
            }),
          ),
          expected: value('PENDING'),
          operations: (subscriber) => [
            operation({
              description: 'AND the promises get resolved',
              async before() {
                jest.clearAllMocks();
                resolveFirst();
                resolveSecond();
                await Promise.resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    first: 'first',
                    second: 'second',
                  }),
                );
              },
            }),
          ],
        }),
        operation({
          description: 'WHEN making a deferred query for remote first and second',
          input: query(root(), {
            first: defer('first'),
            second: defer('second'),
          }),
          expected: value({
            first: undefined,
            second: undefined,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promises resolve',
              async before() {
                jest.clearAllMocks();
                resolveFirst();
                resolveSecond();
                await Promise.resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    first: 'first',
                    second: 'second',
                  }),
                );
              },
            }),
          ],
        }),
        operation({
          description:
            'WHEN making a query for remote first and second while watching if query is pending',
          input: query(root(), {
            first: defer('first'),
            second: defer('second'),
            isLoadingFirst: isPending('second'),
          }),
          expected: value({
            first: undefined,
            second: undefined,
            isLoadingFirst: true,
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promises resolve',
              async before() {
                jest.clearAllMocks();
                resolveFirst();
                resolveSecond();
                await Promise.resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    first: 'first',
                    second: 'second',
                    isLoadingFirst: false,
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph containing an async value', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    let resolve: () => void;

    runScenario({
      description: 'AND a local graph connected to the remote',
      before() {
        remoteMuster = muster(
          fromPromise(() => new Promise((r) => (resolve = r)).then(() => 'value')),
        );
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          valueOrFallback: ifPending(() => value('fallback value'), ref('remote')),
        }),
      operations: [
        operation({
          description: 'WHEN the remote value is requested',
          input: ref('valueOrFallback'),
          expected: value('fallback value'),
          operations: (subscriber) => [
            operation({
              description: 'AND the remote value is resolved',
              before() {
                jest.clearAllMocks();
                resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value('value'));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph containing an async tree', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    let resolve: () => void;

    runScenario({
      description: 'AND a local graph connected to the remote',
      before() {
        remoteMuster = muster(
          fromPromise(() =>
            new Promise((r) => (resolve = r)).then(() =>
              toNode({ first: 'first', second: 'second' }),
            ),
          ),
        );
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          valueOrFallback: ifPending(
            () => toNode({ first: 'fallback first', second: 'fallback second' }),
            ref('remote'),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the remote value is requested',
          input: query(ref('valueOrFallback'), {
            first: key('first'),
            second: key('second'),
          }),
          expected: value({
            first: 'fallback first',
            second: 'fallback second',
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the remote value is resolved',
              before() {
                jest.clearAllMocks();
                resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    first: 'first',
                    second: 'second',
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote muster graph containing async branches', () => {
    let remoteMuster: Muster;
    let resolveFirst: () => void;
    let resolveSecond: () => void;

    beforeEach(() => {
      remoteMuster = muster({
        first: fromPromise(() => new Promise((r) => (resolveFirst = r)).then(() => 'first value')),
        second: fromPromise(() =>
          new Promise((r) => (resolveSecond = r)).then(() => 'second value'),
        ),
      });
    });

    runScenario({
      description: 'AND the local graph connected to the remote graph',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
          first: ref('remote', 'first'),
          second: ref('remote', 'second'),
        }),
      operations: [
        operation({
          description: 'WHEN the query for `first` is sent',
          input: ifPending(
            () => value('PENDING'),
            query(root(), {
              first: key('first'),
            }),
          ),
          expected: value('PENDING'),
          operations: (firstSubscriber) => [
            operation({
              description: 'AND the query for `second` is sent',
              input: ifPending(
                () => value('PENDING'),
                query(root(), {
                  second: key('second'),
                }),
              ),
              expected: value('PENDING'),
              operations: (secondSubscriber) => [
                operation({
                  description: 'AND both queries get resolved',
                  async before() {
                    jest.clearAllMocks();
                    resolveFirst();
                    resolveSecond();
                    await Promise.resolve();
                  },
                  assert() {
                    expect(secondSubscriber().next).toHaveBeenCalledTimes(1);
                    expect(secondSubscriber().next).toHaveBeenCalledWith(
                      value({
                        second: 'second value',
                      }),
                    );
                    expect(firstSubscriber().next).toHaveBeenCalledTimes(1);
                    expect(firstSubscriber().next).toHaveBeenCalledWith(
                      value({
                        first: 'first value',
                      }),
                    );
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph containing an async number collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    let resolve: () => void;
    let queuedResolveFunctions: Array<() => void>;

    runScenario({
      description: 'AND a local graph connected to the remote',
      before() {
        queuedResolveFunctions = [];
        resolve = () => {
          queuedResolveFunctions.forEach((resolve) => resolve());
          queuedResolveFunctions = [];
        };
        remoteMuster = muster(
          fromPromise(() =>
            new Promise((r) => queuedResolveFunctions.push(r)).then(() => toNode([1, 2, 3])),
          ),
        );
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          valueOrFallback: ifPending(() => toNode([]), ref('remote')),
        }),
      operations: [
        operation({
          description: 'WHEN the remote value is requested',
          input: query(ref('valueOrFallback'), entries()),
          expected: value([]),
          operations: (subscriber) => [
            operation({
              description: 'AND the remote value is resolved',
              before() {
                jest.clearAllMocks();
                resolve();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([1, 2, 3]));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing an async collection', () => {
    let remoteMuster: Muster;
    let promisesToResolve: Array<() => void> = [];
    const resolvePromises = () => {
      promisesToResolve.forEach((res) => res());
      promisesToResolve = [];
    };

    beforeEach(() => {
      promisesToResolve = [];
      remoteMuster = muster({
        [match(types.string, 'name')]: fromPromise((props: any) =>
          new Promise((res) => promisesToResolve.push(res)).then(() =>
            array([`${props.name} 1`, `${props.name} 2`]),
          ),
        ),
      });
    });

    runScenario({
      description: 'AND the local instance of muster connected to the remote',
      graph: () =>
        muster({
          remote: proxy([
            fromStreamMiddleware((value) => remoteMuster.resolve(value, { raw: true })),
          ]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a query with a list of the items',
          input: ifPending(
            (prev: any) => prev || value('PENDING'),
            query(ref('remote'), {
              first: key('first', entries()),
            }),
          ),
          expected: value('PENDING'),
          operations: (subscriber) => [
            operation({
              description: 'AND the promises resolve',
              before() {
                jest.clearAllMocks();
                resolvePromises();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    first: ['first 1', 'first 2'],
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection with refs', () => {
    let remoteMuster: Muster;
    let mockStreamFactory: jest.Mock<ObservableLike<NodeDefinition>>;
    let mockResponseCallback: jest.Mock<void>;

    beforeEach(() => {
      remoteMuster = muster({
        globalName: 'global name',
        items: [{ name: ref('globalName') }],
      });
      mockResponseCallback = jest.fn();
      mockStreamFactory = jest.fn((req) =>
        tap(mockResponseCallback, remoteMuster.resolve(req, { raw: true })),
      );
    });

    runScenario({
      description: 'AND the local instance connected to the remote',
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockStreamFactory)]),
          items: ref('remote', 'items'),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the items',
          input: query(
            ref('items'),
            entries({
              name: key('name'),
            }),
          ),
          expected: value([{ name: 'global name' }]),
          assert() {
            expect(mockStreamFactory).toHaveBeenCalledTimes(1);
            expect(mockResponseCallback).toHaveBeenCalledTimes(1);
          },
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection', () => {
    let remoteMuster: Muster;
    let mockStreamFactory: jest.Mock<ObservableLike<NodeDefinition>>;

    beforeEach(() => {
      remoteMuster = muster({
        items: [
          { name: 'name 1', description: 'description 1' },
          { name: 'name 2', description: 'description 2' },
        ],
      });
      mockStreamFactory = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
    });

    runScenario({
      description: 'AND a local instance connected to remote',
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockStreamFactory)]),
        }),
      operations: [
        operation({
          description: 'WHEN the first query requests only names',
          input: query(root(), {
            remote: key('remote', {
              items: key(
                'items',
                entries({
                  name: key('name'),
                }),
              ),
            }),
          }),
          expected: value({
            remote: {
              items: [{ name: 'name 1' }, { name: 'name 2' }],
            },
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the second query requests items with only descriptions',
              before() {
                jest.clearAllMocks();
              },
              input: query(root(), {
                remote: key('remote', {
                  items: key(
                    'items',
                    entries({
                      description: key('description'),
                    }),
                  ),
                }),
              }),
              expected: value({
                remote: {
                  items: [{ description: 'description 1' }, { description: 'description 2' }],
                },
              }),
              assert() {
                expect(subscriber().next).not.toHaveBeenCalled();
              },
            }),
          ],
        }),
      ],
    });
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let mockStreamFactory: jest.Mock<ObservableLike<NodeDefinition>>;
    return {
      description: 'GIVEN a local muster instance connected to a remote muster instance',
      before: () => {
        remoteMuster = muster(nil());
        mockStreamFactory = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockStreamFactory)]),
        }),
      operations: [
        operation({
          description: 'AND a subscription is created to a remote path',
          input: ref('remote', 'foo'),
          expected: value(undefined),
          before() {
            jest.clearAllMocks();
          },
          assert() {
            expect(mockStreamFactory).toHaveBeenCalledTimes(1);
          },
          operations: [
            operation({
              description: 'AND the remote path is invalidated',
              input: invalidate(ref('remote', 'foo')),
              expected: ok(),
              before() {
                jest.clearAllMocks();
              },
              assert() {
                expect(mockStreamFactory).toHaveBeenCalledTimes(0);
              },
            }),
          ],
        }),
        // TODO: This used to work before the performance improvement, but now the stream factory is called
        // TODO: It's not a serious problem, as it shouldn't affect apps using Muster, but it's just different from
        // TODO: how it used to work.
        operation.skip({
          description: 'WHEN a remote path is invalidated without an active subscription',
          before() {
            jest.clearAllMocks();
          },
          input: invalidate(ref('remote', 'foo')),
          expected: ok(),
          assert() {
            // There's no point fetching something just to discard it immediately afterwards, so
            // there's no need to send anything (the client can't trigger a 'remote invalidation')
            expect(mockStreamFactory).toHaveBeenCalledTimes(0);
          },
        }),
      ],
    };
  });

  describe('GIVEN a remote instance of muster containing a collection of collections', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance of muster connected to the remote',
      before() {
        remoteMuster = muster({
          items: [[1, 2, 3], [4, 5, 6]],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting a collection of collections',
          input: query(root(), {
            remote: key('remote', {
              items: key('items', entries(entries())),
            }),
          }),
          expected: value({
            remote: {
              items: [[1, 2, 3], [4, 5, 6]],
            },
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a nested collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local instance of muster connected to the remote',
      before() {
        remoteMuster = muster({
          nested: [{ items: [1, 2, 3] }, { items: [4, 5, 6] }],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN a query is made for a nested collection',
          input: query(root(), {
            remote: key('remote', {
              nested: key(
                'nested',
                entries({
                  items: key('items', entries()),
                }),
              ),
            }),
          }),
          expected: value({
            remote: {
              nested: [{ items: [1, 2, 3] }, { items: [4, 5, 6] }],
            },
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a slow loading collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    let promisesToResolve: Array<() => void>;
    let resolvePromises: () => void;

    runScenario({
      description: 'AND the local instance of muster connected to the remote',
      before() {
        promisesToResolve = [];
        resolvePromises = () => {
          promisesToResolve.forEach((res) => res());
        };
        remoteMuster = muster({
          nested: fromPromise(() =>
            new Promise((resolve) => promisesToResolve.push(resolve)).then(() =>
              toNode([{ name: 'name 1', items: [1, 2, 3] }, { name: 'name 2', items: [4, 5, 6] }]),
            ),
          ),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN a query is made for a nested collection',
          input: query(root(), {
            remote: key('remote', {
              nested: key(
                'nested',
                entries({
                  items: key('items', entries()),
                }),
              ),
            }),
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('nested', [
                  querySetGetItemsOperation({
                    children: [
                      querySetGetChildOperation('items', [
                        querySetGetItemsOperation({
                          children: [querySetOperation(RESOLVE_OPERATION)],
                          operation: getItemsOperation([]),
                        }),
                      ]),
                    ],
                    operation: getItemsOperation([]),
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND a second query is made for the same nested collection',
              before() {
                jest.clearAllMocks();
              },
              input: query(root(), {
                remote: key('remote', {
                  nested: key(
                    'nested',
                    entries({
                      name: key('name'),
                      items: key('items', entries()),
                    }),
                  ),
                }),
              }),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation('nested', [
                      querySetGetItemsOperation({
                        children: [
                          querySetGetChildOperation('items', [
                            querySetGetItemsOperation({
                              children: [querySetOperation(RESOLVE_OPERATION)],
                              operation: getItemsOperation([]),
                            }),
                          ]),
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                        operation: getItemsOperation([]),
                      }),
                    ]),
                  ]),
                );
              },
              operations: (subscriber2) => [
                operation({
                  description: 'AND the slow loading collection has finished loading',
                  async before() {
                    jest.clearAllMocks();
                    resolvePromises();
                  },
                  assert() {
                    expect(mockRemoteResolve).toHaveBeenCalledTimes(0);
                    expect(subscriber1().next).toHaveBeenCalledTimes(1);
                    expect(subscriber1().next).toHaveBeenCalledWith(
                      value({
                        remote: {
                          nested: [{ items: [1, 2, 3] }, { items: [4, 5, 6] }],
                        },
                      }),
                    );
                    expect(subscriber2().next).toHaveBeenCalledTimes(1);
                    expect(subscriber2().next).toHaveBeenCalledWith(
                      value({
                        remote: {
                          nested: [
                            { name: 'name 1', items: [1, 2, 3] },
                            { name: 'name 2', items: [4, 5, 6] },
                          ],
                        },
                      }),
                    );
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a tree', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND the local instance connected to the remote',
      before() {
        remoteMuster = muster({
          message: {
            title: 'Message title',
            content: 'Message content',
          },
          userInfo: {
            firstName: 'Bob',
            lastName: 'Builder',
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the message',
          before() {
            jest.clearAllMocks();
          },
          input: query(root(), {
            remote: key('remote', {
              message: key('message', {
                title: key('title'),
                content: key('content'),
              }),
            }),
          }),
          expected: value({
            remote: {
              message: {
                title: 'Message title',
                content: 'Message content',
              },
            },
          }),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          },
          operations: (subscriber1) => [
            operation({
              description: 'AND then requesting the last name',
              before() {
                jest.clearAllMocks();
              },
              input: query(root(), {
                remote: key('remote', {
                  userInfo: key('userInfo', {
                    firstName: key('firstName'),
                    lastName: key('lastName'),
                  }),
                }),
              }),
              expected: value({
                remote: {
                  userInfo: {
                    firstName: 'Bob',
                    lastName: 'Builder',
                  },
                },
              }),
              assert() {
                expect(subscriber1().next).not.toHaveBeenCalled();
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a collection (name and description)', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          items: [{ name: 'name 1', desc: 'desc 1' }, { name: 'name 2', desc: 'desc 2' }],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN requesting the list of names',
          input: query(
            ref('remote', 'items'),
            entries({
              name: key('name'),
            }),
          ),
          expected: value([{ name: 'name 1' }, { name: 'name 2' }]),
          operations: [
            operation({
              description: 'AND then requesting a list of names and descriptions',
              before() {
                jest.clearAllMocks();
              },
              input: query(
                ref('remote', 'items'),
                entries({
                  name: key('name'),
                  desc: key('desc'),
                }),
              ),
              expected: value([
                { name: 'name 1', desc: 'desc 1' },
                { name: 'name 2', desc: 'desc 2' },
              ]),
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing three nested leaves', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance of muster connected to the remote',
      before() {
        remoteMuster = muster({
          nested: {
            first: 'Hello',
            second: 'Muster',
            third: 'World',
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          items: arrayList([ref('remote', 'nested', 'first')]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query for a list of refs',
          input: query(ref('items'), entries()),
          expected: value(['Hello']),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND a ref for `second` is added to `items`',
              before() {
                jest.clearAllMocks();
              },
              input: push(ref('items'), ref('remote', 'nested', 'second')),
              // expected: ok(),
              assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value(['Hello', 'Muster']));
              },
              operations: [
                operation({
                  description: 'AND a ref for `third` is added to `items`',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: push(ref('items'), ref('remote', 'nested', 'third')),
                  expected: ok(),
                  assert() {
                    expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value(['Hello', 'Muster', 'World']),
                    );
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote graph containing a nil collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          items: nil(),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN making an entries query to `remote`.`items`',
          input: query(ref('remote', 'items'), entries()),
          expected: value([]),
        }),
      ],
    });
  });

  describe('GIVEN a remote collection containing branches', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          users: {
            one: arrayList([
              { name: 'One: Name 1', description: 'One: Description 1' },
              { name: 'One: Name 2', description: 'One: Description 2' },
            ]),
            two: arrayList([]),
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          selectedUser: variable('one'),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get items for currently selected user',
          input: query(
            ref('remote', 'users', ref('selectedUser')),
            entries({
              name: true,
              description: true,
            }),
          ),
          expected: value([
            { name: 'One: Name 1', description: 'One: Description 1' },
            { name: 'One: Name 2', description: 'One: Description 2' },
          ]),
          operations: (subscriber) => [
            operation({
              description: 'AND the selected user changes to `two`',
              before() {
                jest.clearAllMocks();
              },
              input: set(ref('selectedUser'), 'two'),
              expected: value('two'),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([]));
              },
              operations: [
                operation({
                  description: 'AND the selected user changes back to `one`',
                  before() {
                    jest.clearAllMocks();
                  },
                  input: set(ref('selectedUser'), 'one'),
                  expected: value('one'),
                  assert() {
                    expect(subscriber().next).toHaveBeenCalledTimes(1);
                    expect(subscriber().next).toHaveBeenCalledWith(
                      value([
                        { name: 'One: Name 1', description: 'One: Description 1' },
                        { name: 'One: Name 2', description: 'One: Description 2' },
                      ]),
                    );
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a branch matcher (push)', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance of muster connected to the remote',
      before() {
        remoteMuster = muster({
          [match(types.string, 'name')]: computed([param('name')], (name) => `Hello, ${name}`),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          names: arrayList(['first']),
          greetings: applyTransforms(ref('names'), [map((name) => ref('remote', name))]),
        }),
      operations: [
        operation({
          description: 'WHEN making a request to get the ',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('greetings'), entries()),
          expected: value(['Hello, first']),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the new item is added to the list of items',
              before() {
                jest.clearAllMocks();
              },
              input: push(ref('names'), 'second'),
              async assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value(['Hello, first', 'Hello, second']),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a branch matcher (call action)', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance of muster connected to the remote',
      before() {
        remoteMuster = muster({
          [match(types.string, 'name')]: computed([param('name')], (name) => `Hello, ${name}`),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          addName: action(function*(name) {
            yield push(ref('names'), name);
          }),
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          names: arrayList(['first']),
          greetings: applyTransforms(ref('names'), [map((name) => ref('remote', name))]),
        }),
      operations: [
        operation({
          description: 'WHEN making a request to get the ',
          before() {
            jest.clearAllMocks();
          },
          input: query(ref('greetings'), entries()),
          expected: value(['Hello, first']),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation('first', [querySetOperation(RESOLVE_OPERATION)]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the new item is added to the list of items',
              before() {
                jest.clearAllMocks();
              },
              input: call(ref('addName'), ['second']),
              async assert() {
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value(['Hello, first', 'Hello, second']),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance containing a collection behind a matcher', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          [match(types.shape({ name: types.string }), 'criteria')]: computed(
            [param('criteria')],
            (criteria) =>
              toNode([
                { name: `${criteria.name} 1` },
                { name: `${criteria.name} 2` },
                { name: `${criteria.name} 3` },
              ]),
          ),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          criteria: variable({ name: 'initial' }),
        }),
      operations: [
        operation({
          description: 'WHEN the collection is requested using one key',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('remote', ref('criteria')),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'initial 1' }, { name: 'initial 2' }, { name: 'initial 3' }]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation({ name: 'initial' }, [
                  querySetGetItemsOperation({
                    children: [
                      querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                    ],
                    operation: getItemsOperation([]),
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the criteria changes',
              before() {
                jest.clearAllMocks();
              },
              input: set(ref('criteria'), value({ name: 'updated' })),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([{ name: 'updated 1' }, { name: 'updated 2' }, { name: 'updated 3' }]),
                );
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation({ name: 'updated' }, [
                      querySetGetItemsOperation({
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                        operation: getItemsOperation([]),
                      }),
                    ]),
                  ]),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance containing a collection behind a matcher (scope)', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance exposes the collection through a scope',
      before() {
        remoteMuster = muster({
          [match(types.shape({ name: types.string }), 'criteria')]: computed(
            [param('criteria')],
            (criteria) =>
              toNode([
                { name: `${criteria.name} 1` },
                { name: `${criteria.name} 2` },
                { name: `${criteria.name} 3` },
              ]),
          ),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          scope: scope(
            {
              externalItems: context('items'),
              items: ref('externalItems', ref('criteria')),
              criteria: variable({ name: 'initial' }),
            },
            {
              items: ref('remote'),
            },
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the collection is requested using one key',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('scope', 'items'),
            entries({
              name: true,
            }),
          ),
          expected: value([{ name: 'initial 1' }, { name: 'initial 2' }, { name: 'initial 3' }]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation({ name: 'initial' }, [
                  querySetGetItemsOperation({
                    children: [
                      querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                    ],
                    operation: getItemsOperation([]),
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the criteria changes',
              before() {
                jest.clearAllMocks();
              },
              input: set(ref('scope', 'criteria'), value({ name: 'updated' })),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([{ name: 'updated 1' }, { name: 'updated 2' }, { name: 'updated 3' }]),
                );
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation({ name: 'updated' }, [
                      querySetGetItemsOperation({
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                        operation: getItemsOperation([]),
                      }),
                    ]),
                  ]),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance containing a collection behind a matcher (scope + extend)', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance exposes the collection through a scope',
      before() {
        remoteMuster = muster({
          [match(types.shape({ name: types.string }), 'criteria')]: computed(
            [param('criteria')],
            (criteria) =>
              toNode([
                { name: `${criteria.name} 1` },
                { name: `${criteria.name} 2` },
                { name: `${criteria.name} 3` },
              ]),
          ),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
          gateway: {
            externalItems: ref('remote'),
            items: ref('gateway', 'externalItems', ref('gateway', 'criteria')),
            criteria: variable({ name: 'initial' }),
          },
          scope: scope(
            extend(context('gateway'), {
              something: 'test',
            }),
            {
              gateway: ref('gateway'),
            },
          ),
        }),
      operations: [
        operation({
          description: 'WHEN the collection is requested using one key',
          before() {
            jest.clearAllMocks();
          },
          input: ifPending(
            () => value('pending'),
            query(
              ref('scope', 'items'),
              entries({
                name: true,
              }),
            ),
          ),
          expected: [
            value('pending'),
            value([{ name: 'initial 1' }, { name: 'initial 2' }, { name: 'initial 3' }]),
          ],
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
            expect(mockRemoteResolve).toHaveBeenCalledWith(
              querySet(root(), [
                querySetGetChildOperation({ name: 'initial' }, [
                  querySetGetItemsOperation({
                    children: [
                      querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                    ],
                    operation: getItemsOperation([]),
                  }),
                ]),
              ]),
            );
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the criteria changes',
              before() {
                jest.clearAllMocks();
              },
              input: set(ref('scope', 'criteria'), value({ name: 'updated' })),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(2);
                expect(subscriber().next).toHaveBeenCalledWith(value('pending'));
                expect(subscriber().next).toHaveBeenLastCalledWith(
                  value([{ name: 'updated 1' }, { name: 'updated 2' }, { name: 'updated 3' }]),
                );
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
                expect(mockRemoteResolve).toHaveBeenCalledWith(
                  querySet(root(), [
                    querySetGetChildOperation({ name: 'updated' }, [
                      querySetGetItemsOperation({
                        children: [
                          querySetGetChildOperation('name', [querySetOperation(RESOLVE_OPERATION)]),
                        ],
                        operation: getItemsOperation([]),
                      }),
                    ]),
                  ]),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance of muster containing a nested collection', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          categories: [
            {
              name: 'fruit',
              products: [{ id: 1, name: 'strawberry' }, { id: 2, name: 'banana' }],
            },
          ],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          categoryName: variable('fruit'),
          category: head(
            applyTransforms(ref('remote', 'categories'), [
              filter((category) => eq(get(category, 'name'), ref('categoryName'))),
            ]),
          ),
          productName: variable('banana'),
          product: head(
            applyTransforms(ref('category', 'products'), [
              filter((fruit) => eq(get(fruit, 'name'), ref('productName'))),
            ]),
          ),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get the selected product',
          input: query(ref('product'), {
            id: key('id'),
            name: key('name'),
          }),
          expected: value({
            id: 2,
            name: 'banana',
          }),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance containing a collection of items with variables', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          items: [
            {
              name: variable('First'),
            },
          ],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN the `name` is set on a first item',
          input: set(ref('remote', 'items', first(), 'name'), 'updated'),
          expected: value('updated'),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance containing a collection of items with actions', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          items: [
            {
              name: 'Item name',
              getName: action(function*() {
                return yield ref(relative('name'));
              }),
            },
          ],
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN the `name` is set on a first item',
          input: call(ref('remote', 'items', first(), 'getName')),
          expected: value('Item name'),
        }),
      ],
    });
  });

  describe('GIVEN a remote instance containing an arrayList', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        remoteMuster = muster({
          numbers: arrayList([1, 2, 3]),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN the list of numbers is requested',
          input: query(ref('remote', 'numbers'), entries()),
          expected: value([1, 2, 3]),
          operations: (subscriber) => [
            operation({
              description: 'AND a new item is pushed to the array of numbers',
              before() {
                jest.clearAllMocks();
              },
              input: push(ref('remote', 'numbers'), 4),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(value([1, 2, 3, 4]));
              },
            }),
          ],
        }),
      ],
    });
  });

  describe('GIVEN a remote instance containing two async nodes', () => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    let pendingPromises: Array<() => void>;

    function resolvePromises() {
      pendingPromises.forEach((resolve) => resolve());
      pendingPromises = [];
    }

    runScenario({
      description: 'AND a local instance connected to the remote',
      before() {
        pendingPromises = [];
        remoteMuster = muster({
          user: {
            first: fromPromise(() =>
              new Promise((resolve) => pendingPromises.push(resolve)).then(
                () => 'Remote first name',
              ),
            ),
            last: fromPromise(() =>
              new Promise((resolve) => pendingPromises.push(resolve)).then(
                () => 'Remote last name',
              ),
            ),
          },
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN making a query with first and last deferred',
          input: query(root(), {
            remote: {
              user: {
                first: defer(key('first')),
                last: defer(key('last')),
              },
            },
          }),
          expected: value({
            remote: {
              user: {
                first: undefined,
                last: undefined,
              },
            },
          }),
          operations: (subscriber) => [
            operation({
              description: 'AND the promises get resolved',
              before() {
                jest.clearAllMocks();
                resolvePromises();
              },
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value({
                    remote: {
                      user: {
                        first: 'Remote first name',
                        last: 'Remote last name',
                      },
                    },
                  }),
                );
              },
            }),
          ],
        }),
      ],
    });
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    return {
      description: 'GIVEN a remote graph with an fn with named arguments',
      before() {
        remoteMuster = muster({
          greetFn: fn(['name'], ({ name }) => format('Hello, ${name}!', { name })),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
        }),
      operations: [
        operation({
          description: 'WHEN calling the remote `greetFn`',
          input: call(['remote', 'greetFn'], { name: 'Bob' }),
          expected: value('Hello, Bob!'),
        }),
      ],
    };
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    return {
      description: 'GIVEN a remote collection of items (fromStream)',
      before() {
        remoteMuster = muster({
          items: times(5, (index) => ({
            id: index,
            name: `Item ${index}`,
          })),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([fromStreamMiddleware(mockRemoteResolve)]),
          items: applyTransforms(ref('remote', 'items'), [
            filter((item) => gt(get(item, 'id'), ref('minId'))),
          ]),
          minId: variable(-1),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get remote items',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('items'),
            entries({
              id: true as true,
              name: true as true,
            }),
          ),
          expected: value([
            { id: 0, name: 'Item 0' },
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
            { id: 3, name: 'Item 3' },
            { id: 4, name: 'Item 4' },
          ]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the filter changes',
              before() {
                jest.clearAllMocks();
              },
              input: set('minId', 2),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([{ id: 3, name: 'Item 3' }, { id: 4, name: 'Item 4' }]),
                );
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
      ],
    };
  });

  runScenario(() => {
    let remoteMuster: Muster;
    let mockRemoteResolve: jest.Mock<ObservableLike<NodeDefinition>>;
    return {
      description: 'GIVEN a remote collection of items (batchRequest + fromStream)',
      before() {
        remoteMuster = muster({
          items: times(5, (index) => ({
            id: index,
            name: `Item ${index}`,
          })),
        });
        mockRemoteResolve = jest.fn((req) => remoteMuster.resolve(req, { raw: true }));
      },
      graph: () =>
        muster({
          remote: proxy([batchRequestsMiddleware(), fromStreamMiddleware(mockRemoteResolve)]),
          items: applyTransforms(ref('remote', 'items'), [
            filter((item) => gt(get(item, 'id'), ref('minId'))),
          ]),
          minId: variable(-1),
        }),
      operations: [
        operation({
          description: 'WHEN making a query to get remote items',
          before() {
            jest.clearAllMocks();
          },
          input: query(
            ref('items'),
            entries({
              id: true as true,
              name: true as true,
            }),
          ),
          expected: value([
            { id: 0, name: 'Item 0' },
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
            { id: 3, name: 'Item 3' },
            { id: 4, name: 'Item 4' },
          ]),
          assert() {
            expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
          },
          operations: (subscriber) => [
            operation({
              description: 'AND the filter changes',
              before() {
                jest.clearAllMocks();
              },
              input: set('minId', 2),
              assert() {
                expect(subscriber().next).toHaveBeenCalledTimes(1);
                expect(subscriber().next).toHaveBeenCalledWith(
                  value([{ id: 3, name: 'Item 3' }, { id: 4, name: 'Item 4' }]),
                );
                expect(mockRemoteResolve).toHaveBeenCalledTimes(1);
              },
            }),
          ],
        }),
      ],
    };
  });
});
