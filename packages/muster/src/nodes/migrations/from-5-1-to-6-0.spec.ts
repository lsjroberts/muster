import createMigrationTester from '../../test/create-migration-tester';
import migration from './from-5-1-to-6-0'; // tslint:disable-line:import-name-case-insensitive

const testMigration = createMigrationTester(migration);

describe('Migration from Muster 5.1 to 6.0', () => {
  testMigration('GIVEN a partial node', {
    before: {
      $type: 'partial',
      data: {
        context: { name: 'test name' },
        dependencies: [{ $type: 'value', data: { value: 'test dep' } }],
        target: { $type: 'value', data: { value: 'test target' } },
      },
    },
    after: {
      $type: 'inject-dependencies',
      data: {
        context: { name: 'test name' },
        dependencies: [{ $type: 'value', data: { value: 'test dep' } }],
        target: { $type: 'value', data: { value: 'test target' } },
      },
    },
  });
  describe('items() -> entries()', () => {
    testMigration('GIVEN an items node with no children or transforms', {
      before: {
        $type: 'items',
        data: {
          children: undefined,
          transforms: undefined,
        },
      },
      after: {
        $type: 'entries',
        data: {
          children: undefined,
        },
      },
    });
    testMigration('GIVEN an items node with object children and no transforms', {
      before: {
        $type: 'items',
        data: {
          children: {
            $type: 'fields',
            data: {
              fields: {
                foo: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'foo' } }, children: undefined },
                },
                bar: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'bar' } }, children: undefined },
                },
                baz: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'baz' } }, children: undefined },
                },
              },
            },
          },
          transforms: undefined,
        },
      },
      after: {
        $type: 'entries',
        data: {
          children: {
            $type: 'fields',
            data: {
              fields: {
                foo: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'foo' } }, children: undefined },
                },
                bar: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'bar' } }, children: undefined },
                },
                baz: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'baz' } }, children: undefined },
                },
              },
            },
          },
        },
      },
    });
    testMigration('GIVEN an items node with list children and no transforms', {
      before: {
        $type: 'items',
        data: {
          children: {
            $type: 'items',
            data: {
              children: undefined,
              transforms: undefined,
            },
          },
          transforms: undefined,
        },
      },
      after: {
        $type: 'entries',
        data: {
          children: {
            $type: 'entries',
            data: {
              children: undefined,
            },
          },
        },
      },
    });
    testMigration('GIVEN an items node with nested list children and no transforms', {
      before: {
        $type: 'items',
        data: {
          children: {
            $type: 'items',
            data: {
              children: {
                foo: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'foo' } }, children: undefined },
                },
                bar: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'bar' } }, children: undefined },
                },
                baz: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'baz' } }, children: undefined },
                },
              },
              transforms: undefined,
            },
          },
          transforms: undefined,
        },
      },
      after: {
        $type: 'entries',
        data: {
          children: {
            $type: 'entries',
            data: {
              children: {
                foo: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'foo' } }, children: undefined },
                },
                bar: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'bar' } }, children: undefined },
                },
                baz: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'baz' } }, children: undefined },
                },
              },
            },
          },
        },
      },
    });
    testMigration('GIVEN an items node with transforms but no children', {
      before: {
        $type: 'items',
        data: {
          children: undefined,
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
        },
      },
      after: {
        $type: 'withTransforms',
        data: {
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
          fields: {
            $type: 'entries',
            data: {
              children: undefined,
            },
          },
        },
      },
    });
    testMigration('GIVEN an items node with object children and transforms', {
      before: {
        $type: 'items',
        data: {
          children: {
            $type: 'fields',
            data: {
              fields: {
                foo: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'foo' } }, children: undefined },
                },
                bar: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'bar' } }, children: undefined },
                },
                baz: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'baz' } }, children: undefined },
                },
              },
            },
          },
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
        },
      },
      after: {
        $type: 'withTransforms',
        data: {
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
          fields: {
            $type: 'entries',
            data: {
              children: {
                $type: 'fields',
                data: {
                  fields: {
                    foo: {
                      $type: 'key',
                      data: {
                        key: { $type: 'value', data: { value: 'foo' } },
                        children: undefined,
                      },
                    },
                    bar: {
                      $type: 'key',
                      data: {
                        key: { $type: 'value', data: { value: 'bar' } },
                        children: undefined,
                      },
                    },
                    baz: {
                      $type: 'key',
                      data: {
                        key: { $type: 'value', data: { value: 'baz' } },
                        children: undefined,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    testMigration('GIVEN an items node with list children and transforms', {
      before: {
        $type: 'items',
        data: {
          children: {
            $type: 'items',
            data: {
              children: undefined,
              transforms: undefined,
            },
          },
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
        },
      },
      after: {
        $type: 'withTransforms',
        data: {
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
          fields: {
            $type: 'entries',
            data: {
              children: {
                $type: 'entries',
                data: {
                  children: undefined,
                },
              },
            },
          },
        },
      },
    });
    testMigration('GIVEN an items node with nested list children and transforms', {
      before: {
        $type: 'items',
        data: {
          children: {
            $type: 'items',
            data: {
              children: {
                foo: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'foo' } }, children: undefined },
                },
                bar: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'bar' } }, children: undefined },
                },
                baz: {
                  $type: 'key',
                  data: { key: { $type: 'value', data: { value: 'baz' } }, children: undefined },
                },
              },
              transforms: [
                { $type: 'take', data: { numItems: { $type: 'value', data: { value: 1 } } } },
              ],
            },
          },
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
        },
      },
      after: {
        $type: 'withTransforms',
        data: {
          transforms: [
            { $type: 'take', data: { numItems: { $type: 'value', data: { value: 3 } } } },
            { $type: 'count', data: {} },
          ],
          fields: {
            $type: 'entries',
            data: {
              children: {
                $type: 'withTransforms',
                data: {
                  transforms: [
                    { $type: 'take', data: { numItems: { $type: 'value', data: { value: 1 } } } },
                  ],
                  fields: {
                    $type: 'entries',
                    data: {
                      children: {
                        foo: {
                          $type: 'key',
                          data: {
                            key: { $type: 'value', data: { value: 'foo' } },
                            children: undefined,
                          },
                        },
                        bar: {
                          $type: 'key',
                          data: {
                            key: { $type: 'value', data: { value: 'bar' } },
                            children: undefined,
                          },
                        },
                        baz: {
                          $type: 'key',
                          data: {
                            key: { $type: 'value', data: { value: 'baz' } },
                            children: undefined,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  testMigration('GIVEN a takeFirst node', {
    before: {
      $type: 'takeFirst',
      data: {
        someProperty: 'some value',
      },
    },
    after: {
      $type: 'firstItem',
      data: {
        someProperty: 'some value',
      },
    },
  });

  testMigration('GIVEN a firstItem node', {
    before: {
      $type: 'firstItem',
      data: {
        someProperty: 'some value',
      },
    },
    after: {
      $type: 'head',
      data: {
        someProperty: 'some value',
      },
    },
  });

  testMigration('GIVEN a takeLast node', {
    before: {
      $type: 'takeLast',
      data: {
        someProperty: 'some value',
      },
    },
    after: {
      $type: 'lastItem',
      data: {
        someProperty: 'some value',
      },
    },
  });

  testMigration('GIVEN a takeNth node', {
    before: {
      $type: 'takeNth',
      data: {
        someProperty: 'some value',
      },
    },
    after: {
      $type: 'nthItem',
      data: {
        someProperty: 'some value',
      },
    },
  });

  testMigration('GIVEN a sortOrder node with iterator that takes an index', {
    before: {
      $type: 'sortOrder',
      data: {
        descending: true,
        iteratee: {
          $type: 'fn',
          data: {
            argIds: ['item', 'index'],
            body: {
              $type: 'eq',
              data: {
                left: {
                  $type: 'context',
                  data: {
                    name: 'index',
                  },
                },
                right: {
                  $type: 'value',
                  data: {
                    value: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
    after: {
      $type: 'sortOrder',
      data: {
        descending: true,
        iteratee: {
          $type: 'fn',
          data: {
            argIds: ['item'],
            body: {
              $type: 'eq',
              data: {
                left: {
                  $type: 'value',
                  data: {
                    value: 0,
                  },
                },
                right: {
                  $type: 'value',
                  data: {
                    value: 1,
                  },
                },
              },
            },
            hasNamedArgs: false,
          },
        },
      },
    },
    afterDowngrade: {
      $type: 'sortOrder',
      data: {
        descending: true,
        iteratee: {
          $type: 'fn',
          data: {
            argIds: ['item', '$$dummyItemIndex'],
            body: {
              $type: 'eq',
              data: {
                left: {
                  $type: 'value',
                  data: {
                    value: 0,
                  },
                },
                right: {
                  $type: 'value',
                  data: {
                    value: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  testMigration('GIVEN a collection node with no transforms', {
    before: {
      $type: 'collection',
      data: {
        source: {
          $type: 'array',
          data: {
            items: [],
          },
        },
        transforms: [],
      },
    },
    after: {
      $type: 'array',
      data: {
        items: [],
      },
    },
    afterDowngrade: {
      $type: 'array',
      data: {
        items: [],
      },
    },
  });

  testMigration('GIVEN a collection node with takeFirst transform', {
    before: {
      $type: 'collection',
      data: {
        source: {
          $type: 'array',
          data: {
            items: [],
          },
        },
        transforms: [{ $type: 'takeFirst' }],
      },
    },
    after: {
      $type: 'applyTransforms',
      data: {
        target: {
          $type: 'array',
          data: {
            items: [],
          },
        },
        transforms: [{ $type: 'firstItem' }],
      },
    },
  });

  testMigration('GIVEN a query node', {
    before: {
      $type: 'query',
      data: {
        keys: { $type: 'value', data: { value: 'test key' } },
        root: { $type: 'root' },
      },
    },
    after: {
      $type: 'legacyQuery',
      data: {
        keys: { $type: 'value', data: { value: 'test key' } },
        root: { $type: 'root' },
      },
    },
  });

  testMigration('GIVEN an fn node', {
    before: {
      $type: 'fn',
      data: {
        argIds: ['arg1', 'arg2'],
        body: { $type: 'root' },
      },
    },
    after: {
      $type: 'fn',
      data: {
        argIds: ['arg1', 'arg2'],
        body: { $type: 'root' },
        hasNamedArgs: false,
      },
    },
  });
});
