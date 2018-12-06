import muster, { attachMetadata, root, sanitize, value } from '@dws/muster';
const bodyParser = require('body-parser');
import express, { Express, NextFunction, Request, RequestHandler, Response } from 'express';
const supertest = require('supertest');
import { musterExpress } from '../';
import { session, sessionMiddleware } from './session';

function mockSession(session: object): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    (req as any).session = session;
    next();
  };
}

describe('session', () => {
  describe('GIVEN a muster-express instance with session middleware', () => {
    let app: Express;
    beforeEach(() => {
      app = express()
        .use(mockSession({ foo: 'bar' }))
        .use(bodyParser.json())
        .use(sessionMiddleware())
        .use(musterExpress(muster(session())));
    });

    it('SHOULD retrieve the session data', () => {
      const query = root();
      return supertest(app)
        .post('/')
        .send(attachMetadata(sanitize(query)))
        .expect(200)
        .expect(attachMetadata(sanitize(value({ foo: 'bar' }))));
    });
  });
});
