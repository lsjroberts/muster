import muster, { attachMetadata, ref, sanitize, toNode, value } from '@dws/muster';
const bodyParser = require('body-parser');
import express, { Express } from 'express';
const supertest = require('supertest');
import { musterExpress } from '../';
import { header, headerMiddleware } from './header';

describe('header', () => {
  describe('GIVEN a muster-express instance with header middleware', () => {
    let app: Express;
    beforeEach(() => {
      const testGraph = toNode({
        firstHeader: header('X-FIRST-HEADER'),
        secondHeader: header('secondHeader'),
        invalidHeader: header('THIS-DOES-NOT-EXIST'),
      });
      app = express()
        .use(bodyParser.json())
        .use(headerMiddleware())
        .use(musterExpress(muster(testGraph)));
    });

    describe('WHEN requesting the first header', () => {
      it('SHOULD retrieve the header data when name is all caps', () => {
        const query = ref('firstHeader');
        return supertest(app)
          .post('/')
          .set('X-FIRST-HEADER', 'test value')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect(attachMetadata(sanitize(value('test value'))));
      });

      it('SHOULD retrieve the header data when name is lowercase', () => {
        const query = ref('firstHeader');
        return supertest(app)
          .post('/')
          .set('x-first-header', 'test value')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect(attachMetadata(sanitize(value('test value'))));
      });
    });

    describe('WHEN requesting the second header', () => {
      it('SHOULD retrieve the header data when name is all caps', () => {
        const query = ref('secondHeader');
        return supertest(app)
          .post('/')
          .set('SECONDHEADER', 'Second test value')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect(attachMetadata(sanitize(value('Second test value'))));
      });

      it('SHOULD retrieve the header data when name is lowercase', () => {
        const query = ref('secondHeader');
        return supertest(app)
          .post('/')
          .set('secondheader', 'Second test value')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect(attachMetadata(sanitize(value('Second test value'))));
      });
    });

    describe('WHEN requesting invalid header', () => {
      it('SHOULD return an undefined', () => {
        const query = ref('invalidHeader');
        return supertest(app)
          .post('/')
          .send(attachMetadata(sanitize(query)))
          .expect(200)
          .expect(attachMetadata({ $type: 'value', data: {} }));
      });
    });
  });
});
