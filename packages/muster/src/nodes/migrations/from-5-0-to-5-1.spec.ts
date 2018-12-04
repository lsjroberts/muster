import createMigrationTester from '../../test/create-migration-tester';
import migration from './from-5-0-to-5-1'; // tslint:disable-line:import-name-case-insensitive

const testMigration = createMigrationTester(migration);

describe('Migration from Muster 5.0 to 5.1', () => {
  testMigration('GIVEN a simple value node', {
    before: { $type: 'value', value: 'Hello world' },
    after: { $type: 'value', data: { value: 'Hello world' } },
  });

  testMigration('GIVEN an empty tree node', {
    before: { $type: 'tree', branches: {} },
    after: {
      $type: 'tree',
      data: {
        branches: [],
      },
    },
  });

  testMigration('GIVEN a flat tree with value nodes', {
    before: {
      $type: 'tree',
      branches: {
        first: { $type: 'value', value: 'First leaf' },
        second: { $type: 'value', value: 'Second leaf' },
      },
    },
    after: {
      $type: 'tree',
      data: {
        branches: [
          {
            match: 'first',
            node: { $type: 'value', data: { value: 'First leaf' } },
          },
          {
            match: 'second',
            node: { $type: 'value', data: { value: 'Second leaf' } },
          },
        ],
      },
    },
  });

  testMigration('GIVEN an empty `multiple` node.', {
    before: { $type: 'multiple' },
    after: { $type: 'parallel', data: { operations: [] } },
    afterDowngrade: { $type: 'parallel', nodes: [] },
  });

  testMigration('GIVEN a `multiple` node with operations', {
    before: {
      $type: 'multiple',
      nodes: [{ $type: 'value', value: 'first' }, { $type: 'value', value: 'second' }],
    },
    after: {
      $type: 'parallel',
      data: {
        operations: [
          { $type: 'value', data: { value: 'first' } },
          { $type: 'value', data: { value: 'second' } },
        ],
      },
    },
    afterDowngrade: {
      $type: 'parallel',
      nodes: [{ $type: 'value', value: 'first' }, { $type: 'value', value: 'second' }],
    },
  });

  testMigration('GIVEN a `ref` node', {
    before: {
      $type: 'ref',
      root: { $type: 'root' },
      path: [
        { $type: 'value', value: 'foo' },
        { $type: 'value', value: 'bar' },
        { $type: 'value', value: 'baz' },
      ],
    },
    after: {
      $type: 'get',
      data: {
        key: { $type: 'value', data: { value: 'baz' } },
        subject: {
          $type: 'get',
          data: {
            key: { $type: 'value', data: { value: 'bar' } },
            subject: {
              $type: 'get',
              data: {
                key: { $type: 'value', data: { value: 'foo' } },
                subject: { $type: 'root', data: {} },
              },
            },
          },
        },
      },
    },
    afterDowngrade: {
      $type: 'get',
      childGetter: { $type: 'key', key: { $type: 'value', value: 'baz' } },
      subject: {
        $type: 'get',
        childGetter: { $type: 'key', key: { $type: 'value', value: 'bar' } },
        subject: {
          $type: 'get',
          childGetter: { $type: 'key', key: { $type: 'value', value: 'foo' } },
          subject: { $type: 'root' },
        },
      },
    },
  });

  testMigration('GIVEN an `apply` node', {
    before: {
      $type: 'apply',
      args: [{ $type: 'value', value: 'asdf' }],
      fn: {
        $type: 'fn',
        argIds: ['$arg:1'],
        body: { $type: 'context', identifier: '$arg:1' },
      },
    },
    after: {
      $type: 'apply',
      data: {
        args: [{ $type: 'value', data: { value: 'asdf' } }],
        target: {
          $type: 'fn',
          data: {
            argIds: ['$arg:1'],
            body: { $type: 'context', data: { name: '$arg:1' } },
          },
        },
      },
    },
  });

  testMigration('GIVEN a simple `query` node', {
    before: {
      $type: 'query',
      root: { $type: 'root' },
      getters: { $type: 'fields' },
    },
    after: {
      $type: 'query',
      data: {
        root: { $type: 'root', data: {} },
        keys: { $type: 'fields', data: {} },
      },
    },
  });

  testMigration('GIVEN a simple `array` node', {
    before: {
      $type: 'array',
      nodes: [{ $type: 'value', value: '1' }, { $type: 'value', value: '2' }],
    },
    after: {
      $type: 'array',
      data: {
        items: [{ $type: 'value', data: { value: '1' } }, { $type: 'value', data: { value: '2' } }],
      },
    },
  });
});
