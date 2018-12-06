import mapValues from 'lodash/mapValues';
import toPairs from 'lodash/toPairs';
import { createMigration } from './create-migration';
import { createMigrator, DEFAULT } from './create-migrator';
import { Migration } from './types';

interface NodeBefore {
  $type: string;
  [key: string]: any;
}

interface NodeAfter {
  $type: string;
  data: {
    [key: string]: any;
  };
}

const migrator = createMigrator<NodeBefore, NodeAfter>({
  [DEFAULT]: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: node.$type,
        ...mapValues(node.data, traverse),
      };
    },
    upgrade(node, traverse): NodeAfter {
      const keys = Object.keys(node).filter((k) => k !== '$type');
      return {
        $type: node.$type,
        data: keys.reduce((data: any, key: string) => {
          data[key] = traverse(node[key]);
          return data;
        }, {}),
      };
    },
  },
  apply: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'apply',
        data: {
          args: traverse(node.args),
          target: traverse(node.fn),
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'apply',
        args: traverse(node.data.args),
        fn: traverse(node.data.target),
      };
    },
  },
  array: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'array',
        data: {
          items: traverse(node.nodes),
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'array',
        nodes: traverse(node.data.items),
      };
    },
  },
  branch: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'tree',
        data: {
          branches: (node.branches || []).map((branch: any) => ({
            match: branch.match,
            node: traverse(branch.node),
            param: branch.name,
          })),
        },
      };
    },
  },
  context: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'context',
        data: {
          name: node.identifier,
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'context',
        identifier: node.data.name,
      };
    },
  },
  decrement: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'subtract',
        operands: [traverse(node.data.operand), { $type: 'value', value: 1 }],
      };
    },
  },
  get: {
    upgrade(node, traverse): NodeAfter {
      // TODO: Handle the item placeholder (first, last, nth, ...)
      const key =
        node.childGetter.$type === 'key'
          ? traverse(node.childGetter.key)
          : traverse(node.childGetter); // TODO: Is this right?
      return {
        $type: 'get',
        data: {
          subject: traverse(node.subject),
          key,
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      // TODO: Handle the item placeholder (first, last, nth, ...)
      return {
        $type: 'get',
        childGetter: {
          $type: 'key',
          key: traverse(node.data.key),
        },
        subject: traverse(node.data.subject),
      };
    },
  },
  increment: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'add',
        operands: [traverse(node.data.operand), { $type: 'value', value: 1 }],
      };
    },
  },
  match: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'match-pattern',
        data: {
          regex: traverse(node.regex),
          subject: traverse(node.subject),
        },
      };
    },
  },
  'match-pattern': {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'match',
        regex: traverse(node.data.regex),
        subject: traverse(node.data.subject),
      };
    },
  },
  multiple: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'parallel',
        data: {
          operations: (node.nodes || []).map(traverse),
        },
      };
    },
  },
  parallel: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'parallel',
        nodes: traverse(node.data.operations),
      };
    },
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'parallel',
        data: {
          operations: traverse(node.nodes),
        },
      };
    },
  },
  param: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'param',
        data: {
          name: node.id,
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'param',
        id: node.data.name,
      };
    },
  },
  query: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'query',
        data: {
          root: traverse(node.root),
          keys: traverse(node.getters),
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'query',
        root: traverse(node.data.root),
        getters: traverse(node.data.keys),
      };
    },
  },
  ref: {
    upgrade(node, traverse): NodeAfter {
      // TODO: Handle the item placeholder (first, last, nth, ...)
      const toNestedGet = (target: any, path: Array<any>): any => {
        const [key, ...remaining] = path;
        const get = {
          $type: 'get',
          data: {
            subject: target,
            key: traverse(key),
          },
        };
        if (remaining.length === 0) return get;
        return toNestedGet(get, remaining);
      };
      return toNestedGet(traverse(node.root), node.path);
    },
  },
  series: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'series',
        data: {
          operations: traverse(node.nodes),
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'series',
        nodes: traverse(node.data.operations),
      };
    },
  },
  'sort-order': {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'sortOrder',
        data: {
          descending: node.descending,
          iteratee: traverse(node.iteratee),
        },
      };
    },
  },
  sortOrder: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'sort-order',
        descending: node.data.descending,
        iteratee: traverse(node.data.iteratee),
      };
    },
  },
  'take-first': {
    upgrade(node, traverse): NodeAfter {
      return { $type: 'takeFirst', data: {} };
    },
  },
  takeFirst: {
    downgrade(node, traverse): NodeBefore {
      return { $type: 'take-first' };
    },
  },
  'take-last': {
    upgrade(node, traverse): NodeAfter {
      return { $type: 'takeLast', data: {} };
    },
  },
  takeLast: {
    downgrade(node, traverse): NodeBefore {
      return { $type: 'take-last' };
    },
  },
  'take-nth': {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'takeNth',
        data: {
          index: traverse(node.index),
        },
      };
    },
  },
  takeNth: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'take-nth',
        index: traverse(node.data.index),
      };
    },
  },
  tree: {
    downgrade(node, traverse): NodeBefore {
      const branches = node.data.branches || [];
      const isSimpleTree = branches.every(
        (branch: any) => !(branch.match || '').startsWith('$$match:'),
      );
      if (isSimpleTree) {
        return {
          $type: 'tree',
          branches: branches.reduce((tree: any, branch: any) => {
            if (branch.match) {
              tree[branch.match] = traverse(branch.node);
            }
            return tree;
          }, {}),
        };
      }
      return {
        $type: 'tree',
        branches: (node.data.branches || []).map((branch: any) => ({
          match: branch.match,
          name: branch.param,
          node: traverse(branch.node),
        })),
      };
    },
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'tree',
        data: {
          branches: toPairs(node.branches).map(([name, node]) => ({
            match: name,
            node: traverse(node),
          })),
        },
      };
    },
  },
  'with-context': {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'withContext',
        data: {
          target: traverse(node.node),
          values: mapValues(node.context),
        },
      };
    },
  },
  withContext: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'with-context',
        node: traverse(node.data.target),
        context: mapValues(traverse),
      };
    },
  },
});

export default createMigration({
  match: '>=5.0.0 <5.1.0',
  migrator,
  versionAfterDowngrade: '5.0.0',
  versionAfterUpgrade: '5.1.0',
  unwrapMetadataAfterDowngrading: true,
}) as Migration;
