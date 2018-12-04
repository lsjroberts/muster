import mapValues from 'lodash/mapValues';
import { createMigration } from './create-migration';
import { createMigrator, DEFAULT } from './create-migrator';
import { Migration } from './types';

type SerializedPrimitive = string | number | boolean | null | undefined;
interface SerializedArray extends Array<SerializedValue> {}
interface SerializedObject {
  [key: string]: SerializedValue;
}

type SerializedValue =
  | SerializedPrimitive
  | SerializedArray
  | SerializedObject
  | NodeBefore
  | NodeAfter;

interface NodeBefore {
  $type: string;
  data: {
    [key: string]: SerializedValue;
  };
}

interface NodeAfter {
  $type: string;
  data: {
    [key: string]: SerializedValue;
  };
}

const migrator = createMigrator<NodeBefore, NodeAfter>({
  [DEFAULT]: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: node.$type,
        data: traverse(node.data),
      };
    },
    upgrade(node, traverse): NodeAfter {
      return {
        $type: node.$type,
        data: traverse(node.data),
      };
    },
  },
  'inject-dependencies': {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'partial',
        data: traverse(node.data),
      };
    },
  },
  items: {
    upgrade(node, traverse): NodeAfter {
      if (Array.isArray(node.data.transforms) && node.data.transforms.length > 0) {
        return {
          $type: 'withTransforms',
          data: {
            transforms: traverse(node.data.transforms),
            fields: {
              $type: 'entries',
              data: {
                children: traverse(node.data.children),
              },
            },
          },
        };
      }
      return {
        $type: 'entries',
        data: {
          children: traverse(node.data.children),
        },
      };
    },
  },
  entries: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'items',
        data: {
          transforms: undefined,
          children: traverse(node.data.children),
        },
      };
    },
  },
  withTransforms: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'items',
        data: {
          transforms: traverse(node.data.transforms),
          children: traverse((node.data.fields as NodeAfter).data.children),
        },
      };
    },
  },
  partial: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'inject-dependencies',
        data: traverse(node.data),
      };
    },
  },
  takeFirst: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'firstItem',
        data: traverse(node.data),
      };
    },
  },
  firstItem: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'takeFirst',
        data: traverse(node.data),
      };
    },
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'head',
        data: traverse(node.data),
      };
    },
  },
  head: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'firstItem',
        data: traverse(node.data),
      };
    },
  },
  takeLast: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'lastItem',
        data: traverse(node.data),
      };
    },
  },
  lastItem: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'takeLast',
        data: traverse(node.data),
      };
    },
  },
  takeNth: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'nthItem',
        data: traverse(node.data),
      };
    },
  },
  nthItem: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'takeNth',
        data: traverse(node.data),
      };
    },
  },
  sortOrder: {
    downgrade(node, traverse): NodeBefore {
      const { iteratee, descending } = traverse(node.data);
      return {
        $type: 'sortOrder',
        data: {
          descending,
          iteratee: {
            $type: 'fn',
            data: {
              argIds: [...iteratee.data.argIds, '$$dummyItemIndex'],
              body: iteratee.data.body,
            },
          },
        },
      };
    },
    upgrade(node, traverse): NodeAfter {
      const { iteratee, descending } = traverse(node.data);
      const [itemArg, itemIndexArg] = iteratee.data.argIds;
      return {
        $type: 'sortOrder',
        data: {
          descending,
          iteratee: {
            $type: 'fn',
            data: {
              argIds: [itemArg],
              body: replaceContextWithValue(iteratee.data.body, itemIndexArg, 0),
              hasNamedArgs: false,
            },
          },
        },
      };
    },
  },
  collection: {
    upgrade(node, traverse): NodeAfter {
      const { source, transforms } = traverse(node.data);
      if (transforms.length === 0) return source;
      return {
        $type: 'applyTransforms',
        data: {
          target: source,
          transforms,
        },
      };
    },
  },
  applyTransforms: {
    downgrade(node, traverse): NodeBefore {
      const { target, transforms } = traverse(node.data);
      return {
        $type: 'collection',
        data: {
          source: target,
          transforms,
        },
      };
    },
  },
  legacyQuery: {
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'query',
        data: traverse(node.data),
      };
    },
  },
  query: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'legacyQuery',
        data: traverse(node.data),
      };
    },
  },
  fn: {
    upgrade(node, traverse): NodeAfter {
      return {
        $type: 'fn',
        data: {
          argIds: traverse(node.data.argIds),
          body: traverse(node.data.body),
          hasNamedArgs: false,
        },
      };
    },
    downgrade(node, traverse): NodeBefore {
      return {
        $type: 'fn',
        data: {
          argIds: traverse(node.data.argIds),
          body: traverse(node.data.body),
        },
      };
    },
  },
});

export default createMigration({
  match: '>=5.1.0 <6.0.0',
  migrator,
  versionAfterUpgrade: '6.0.0',
  versionAfterDowngrade: '5.1.0',
}) as Migration;

function replaceContextWithValue(obj: any, argName: string, value: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map((childObj) => replaceContextWithValue(childObj, argName, value));
  }
  if (typeof obj === 'object' && obj !== null) {
    if (typeof obj.$type === 'string' && obj.$type === 'context' && obj.data.name === argName) {
      return { $type: 'value', data: { value } };
    }
    return mapValues(obj, (childObj) => replaceContextWithValue(childObj, argName, value));
  }
  return obj;
}
