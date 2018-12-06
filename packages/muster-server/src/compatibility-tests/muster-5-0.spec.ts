import muster, { nil, value } from '@dws/muster';
const bodyParser = require('body-parser');
import express, { RequestHandler } from 'express';
const supertest = require('supertest');
import { musterExpress } from '..';

describe('musterExpress()', () => {
  describe('GIVEN a Muster instance with a simple graph definition', () => {
    let app: RequestHandler;
    beforeEach(() => {
      app = express()
        .use(bodyParser.json())
        .use(musterExpress(muster(value('foo'))));
    });

    describe('GIVEN a query for the root node', () => {
      let query: any;
      beforeEach(() => {
        query = { $type: 'root' };
      });

      it('SHOULD return the correct response', () => {
        return supertest(app)
          .post('/')
          .send(query)
          .expect(200)
          .expect({ $type: 'value', value: 'foo' });
      });
    });
  });

  describe('GIVEN a Muster instance with a nested graph definition', () => {
    let app: RequestHandler;
    beforeEach(() => {
      app = express()
        .use(bodyParser.json())
        .use(
          musterExpress(
            muster({
              foo: {
                bar: {
                  baz: value('qux'),
                },
              },
            }),
          ),
        );
    });

    describe('GIVEN a query for a deeply nested path', () => {
      let query: any;
      beforeEach(() => {
        query = {
          $type: 'ref',
          root: { $type: 'root' },
          path: [
            { $type: 'value', value: 'foo' },
            { $type: 'value', value: 'bar' },
            { $type: 'value', value: 'baz' },
          ],
        };
      });

      it('SHOULD return the correct response', () => {
        return supertest(app)
          .post('/')
          .send(query)
          .expect(200)
          .expect({ $type: 'value', value: 'qux' });
      });
    });

    describe('GIVEN a query for an invalid path', () => {
      let query: any;
      beforeEach(() => {
        query = {
          $type: 'ref',
          root: { $type: 'root' },
          path: [
            { $type: 'value', value: 'foo' },
            { $type: 'value', value: 'bar' },
            { $type: 'value', value: 'qux' },
          ],
        };
      });

      it('SHOULD return the correct response', () => {
        return supertest(app)
          .post('/')
          .send(query)
          .expect(200)
          .expect((res: any) => {
            expect(res.body).toEqual({
              $type: 'error',
              code: 'NOT_FOUND',
              error: {
                message: 'Invalid child key: "qux"',
                stack: expect.any(String),
              },
              path: ['foo', 'bar'],
            });
          });
      });
    });
  });

  function typeError(typeName: string) {
    return (res: any) => {
      expect(res.body).toEqual({
        $type: 'error',
        error: {
          message: `Unrecognised node type: "${typeName}"`,
          stack: expect.any(String),
        },
      });
    };
  }

  describe('GIVEN a muster express with default input sanitizer', () => {
    let app: RequestHandler;
    beforeEach(() => {
      app = express()
        .use(bodyParser.json())
        .use(musterExpress(muster(nil())));
    });

    describe('WHEN a request contains a value node', () => {
      it('SHOULD return a correct value', () =>
        supertest(app)
          .post('/')
          .send({ $type: 'value', value: true })
          .expect(200)
          .expect({ $type: 'value', value: true }));
    });

    describe('WHEN a request contains an error node node', () => {
      it('SHOULD return an error', () =>
        supertest(app)
          .post('/')
          .send({ $type: 'error', error: { message: 'Boom!' } })
          .expect(400)
          .expect(typeError('error')));
    });

    describe('WHEN a request contains a computed node', () => {
      it('SHOULD return an error', () =>
        supertest(app)
          .post('/')
          .send({ $type: 'computed' })
          .expect(400)
          .expect(typeError('computed')));
    });

    describe('WHEN a request contains an apply node', () => {
      it('SHOULD return an error', () =>
        supertest(app)
          .post('/')
          .send({
            $type: 'apply',
            args: [{ $type: 'value', value: 'asdf' }],
            fn: {
              $type: 'fn',
              argIds: ['$arg:1'],
              body: { $type: 'context', identifier: '$arg:1' },
            },
          })
          .expect(400)
          .expect(typeError('apply')));
    });

    describe('WHEN a request contains a valid query', () => {
      it('SHOULD return a correct value', () =>
        supertest(app)
          .post('/')
          .send({
            $type: 'query',
            root: { $type: 'root' },
            getters: {
              $type: 'fields',
              fields: {
                something: {
                  $type: 'key',
                  key: { $type: 'value', value: 'something' },
                  children: {
                    $type: 'fields',
                    fields: {
                      someList: {
                        $type: 'key',
                        key: { $type: 'value', value: 'someList' },
                        children: {
                          $type: 'items',
                          children: {
                            $type: 'fields',
                            fields: {
                              someProp: {
                                $type: 'key',
                                key: { $type: 'value', value: 'someProp' },
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
          })
          .expect(200)
          .expect({
            $type: 'tree',
            branches: {
              something: {
                $type: 'tree',
                branches: {
                  someList: {
                    $type: 'array',
                    nodes: [],
                  },
                },
              },
            },
          }));
    });
  });
});
