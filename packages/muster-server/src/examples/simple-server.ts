import { default as muster, fromPromise } from '@dws/muster';
const bodyParser = require('body-parser');
import express from 'express';
import { musterExpress } from '..';

express()
  .use(bodyParser.json())
  .use(
    musterExpress(
      muster({
        name: 'Test name',
        willFail: fromPromise(() => Promise.resolve({ $type: 'trololololo' })),
      }),
    ),
  )
  .listen(9000, () => console.log('Listening at port 9000'));
