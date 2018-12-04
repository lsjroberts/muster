# Muster Worker

## Introduction 

Nodes for running a Muster Graph in a standalone `Worker` thread.

## Usage

Create a worker script, standalone from your app, and configure your worker's graph in it. Run `workerConnect` to enable worker messaging.

```javascript
import muster from '@dws/muster';
import { workerConnect } from '@dws/muster-worker';

const graph = muster({
  // ...
});

workerConnect(graph, self);
```

In your app, use the `worker` to create a connection to the worker's graph. You'll need to pass in the path to your deployed worker script.

```javascript
import muster, { ref } from '@dws/muster';
import { worker } from '@dws/muster-worker';

const clientApp = muster({
  worker: worker('./my.worker.js'),
  // ...
});
```

For hints on how to configure `webpack` to build and deploy your worker script, see the repo's [webpack config](webpack.config.js).

## Install

With [npm](https://npmjs.org/) installed, run

```bash
$ npm install @dws/muster-worker
```

## License

MIT
