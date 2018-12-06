import muster, {
  apply,
  attachMetadata,
  entries,
  error,
  fields,
  fn,
  key,
  nil,
  NodeDefinition,
  query,
  ref,
  root,
  sanitize,
  value,
} from '@dws/muster';
const bodyParser = require('body-parser');
import express, { RequestHandler } from 'express';
const supertest = require('supertest');
import { musterExpress } from '.';

describe('musterExpress()', () => {
  describe('GIVEN a Muster instance with a simple graph definition', () => {
    let app: RequestHandler;
    beforeEach(() => {
      app = express()
        .use(bodyParser.json())
        .use(musterExpress(muster(value('foo'))));
    });

    describe('GIVEN a query for the root node', () => {
      let query: NodeDefinition;
      beforeEach(() => {
        query = root();
      });

      it('SHOULD return the correct headers', () => {
        return supertest(app)
          .post('/')
          .send(attachMetadata(sanitize(query)))
          .expect('Content-Type', 'application/json; charset=utf-8');
      });

      it('SHOULD return the correct response', () => {
        return supertest(app)
          .post('/')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect(attachMetadata(sanitize(value('foo'))));
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
      let query: NodeDefinition;
      beforeEach(() => {
        query = ref('foo', 'bar', 'baz');
      });

      it('SHOULD return the correct response', () => {
        return supertest(app)
          .post('/')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect(attachMetadata(sanitize(value('qux'))));
      });
    });

    describe('GIVEN a query for an invalid path', () => {
      let query: NodeDefinition;
      beforeEach(() => {
        query = ref('foo', 'bar', 'qux');
      });

      it('SHOULD return the correct response', () => {
        return supertest(app)
          .post('/')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect((res: any) => {
            expect(res.body).toEqual(
              attachMetadata({
                $type: 'error',
                data: {
                  code: 'NOT_FOUND',
                  error: {
                    message: 'Invalid child key: "qux"',
                    stack: expect.any(String),
                  },
                  path: ['foo', 'bar'],
                },
              }),
            );
          });
      });
    });
  });

  function typeError(typeName: string) {
    return (res: any) => {
      expect(res.body).toEqual(
        attachMetadata({
          $type: 'error',
          data: {
            error: {
              message: `Unrecognised node type: "${typeName}"`,
              stack: expect.any(String),
            },
          },
        }),
      );
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
          .send(attachMetadata(sanitize(value(true))))
          .expect(200)
          .expect(attachMetadata(sanitize(value(true)))));
    });

    describe('WHEN a request contains an error node node', () => {
      it('SHOULD return an error', () =>
        supertest(app)
          .post('/')
          .send(attachMetadata(sanitize(error('Boom!'))))
          .expect(400)
          .expect(typeError('error')));
    });

    describe('WHEN a request contains a computed node', () => {
      it('SHOULD return an error', () =>
        supertest(app)
          .post('/')
          .send(attachMetadata({ $type: 'computed' }))
          .expect(400)
          .expect(typeError('computed')));
    });

    describe('WHEN a request contains an apply node', () => {
      it('SHOULD return an error', () =>
        supertest(app)
          .post('/')
          .send(attachMetadata(sanitize(apply([value('asdf')], fn((item) => item)))))
          .expect(400)
          .expect(typeError('apply')));
    });

    describe('WHEN a request contains a valid query', () => {
      it('SHOULD return a correct value', () =>
        supertest(app)
          .post('/')
          .send(
            attachMetadata(
              sanitize(
                query(
                  root(),
                  fields({
                    something: key(
                      'something',
                      fields({
                        someList: key(
                          'someList',
                          entries({
                            someProp: key('someProp'),
                          }),
                        ),
                      }),
                    ),
                  }),
                ),
              ),
            ),
          )
          .expect(200));
    });
  });
});
