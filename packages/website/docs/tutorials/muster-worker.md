---
id: muster-worker
title: Running Muster in a Worker
---

In a very similar fashion to [running Muster on a server](/muster/docs/tutorials/muster-server), you can create and run a Muster graph inside a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker), then connect your client app to it. Workers run in their own thread, separate from the main render thread, which can improve app performance (especially if your graph contains a lot of logic).

**N.B.** Using a worker is unlikely to make your app __faster__, but it can help with __UI responsiveness__. After all, any complex processing will still have to be performed somewhere, and if moved to a worker it will have the additional latency of cross-thread messaging on top. However, on multi-threaded systems the processing will be moved off the main (render) thread, allowing your app to remain responsive to user input and other events in the meantime.

> Workers are only available inside browsers - threading inside NodeJS apps is available using the experimental [`worker-threads`](https://nodejs.org/api/worker_threads.html) package and is not covered here. Likewise, Workers are not available (or required) with `react-native` - native mobile apps already separate background processing from the main render thread.

We'll be using [Webpack 4](https://webpack.js.org/) in this example to build a web app that communicates with a Worker. 

## Setup

You'll need to install a few things, if you don't have them in your project already.

```bash
npm i @dws/muster @dws/muster-observable @dws/muster-worker
# or
yarn add @dws/muster @dws/muster-observable @dws/muster-worker
```

And the Webpack bits and bobs:

```bash
npm i webpack html-webpack-plugin
# or
yarn add webpack html-webpack-plugin
```

## Creating the Worker Graph

Worker graphs are created the same way as any other graph, without restrictions on nodes. All we need to do is create a standalone worker file (or bundle, or `entry`) with our graph in it.

`src/app.worker.js`

```javascript
import { default as muster, fromStream, value } from '@dws/muster';
import { BehaviorSubject } from '@dws/muster-observable';
import { workerConnect } from '@dws/muster-worker';

let age = 1;
const subject = new BehaviorSubject(value(`Geoff is ${age}`));
setInterval(() => {
  subject.next(value(`Geoff is ${age++}`));
}, 5000);

const graph = muster({
  nameStream: fromStream(subject),
  // ...other graph configuration
});

workerConnect(graph, self);
```

In the code above, we're using a `muster-observable` Subject to create a stream of periodically updating values. The call to `workerConnect` at the end of the file enables the Worker listeners when the code is executed. The `self` parameter is the Worker's global context.

## Creating the Web Client

Set up a Muster client app as you would normally. You can use Muster React or a framework of your choice, but in this example we're going to stick with basic DOM manipulation.

`src/index.js`

```javascript
import muster, { ref } from '@dws/muster';
import { worker } from '@dws/muster-worker';

const app = muster({
  worker: worker('./app.worker.js'),
  // ...other graph configuration
});

app.resolve(ref('worker', 'nameStream')).subscribe((value) => {
  console.log(value);
  document.querySelector('#app').innerHTML = value;
});
``` 

This is a very simple file that creates and queries its graph on execution. Here we use the `worker` node (the client app is officially the "host" for the Worker script) and give it the local path to the deployed Worker script we created above.

> The path to the worker must be where the worker script is deployed at runtime. This may require some additional Webpack configuration (below).

## Build and deploy

Just about every web app these days has a build step, and this example is no exception. Here's a template Webpack config to support the assumptions we've made in the other files.

`webpack.config.js`

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    index: path.join(__dirname, 'src/index.js'),
    'app.worker': path.join(__dirname, 'src/app.worker.js')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      excludeChunks: ['app.worker']
    }),
  ],
};
```

The two things to note here are the two `entry` points in the config - one for the app at `index`, the other for the Worker - and the `HtmlWebpackPlugin` which `excludes` the Worker chunk. This is because the Worker script will be loaded by the Muster framework, so shouldn't be included in the app load by default. 

The `'app.worker'` entry will create a standalone bundle file for the Worker script and its dependencies. The path of the resulting file will be the path passed into the `worker` node above.  

We're also going to need an html template, as referenced from the `HtmlWebpackPlugin` options.

`src/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<h1>Worker Test</h1>
<p>How old is Geoff?</p>
<div id="app"></div>
</body>
</html>
``` 

The `#app` div is manipulated by our client app in `index.js`. This will allow us to watch Geoff age in real time.

## Running the app

Run `webpack` to compile the app, then inspect the contents of your `dist` folder. You should see a pair of javascript files and an `index.html`. You'll need to run a local http server to allow the app to load Worker script dynamically - just opening the resulting `index.html` as a `file://` url won't work. The quickest way to do this is with `http-server`.

```bash
npm i -D http-server
# or
yarn add -D http-server

# then
http-server dist
```

Then open the `localhost` link in a browser. You should see something like this:

![Muster Worker init](assets/worker-start.png)

If the Worker has installed and activated correctly, Geoff will soon begin to age at a rate of 1 year every 5 seconds. Shortly your screen should look something like this:

![Muster Worker running](assets/worker-end.png)

And if you open your developer tools, you should see a history of his ageing in the console:

![Muster Worker console history](assets/worker-console.png)

Congratulations! You have connected to an off-thread Muster Worker. Nice work.

## Collection transforms

One thing to bear in mind is how Muster handles collection transforms. Whether connecting to a Worker, a server via WebSockets or any other streaming connection, Muster will batch and transmit client-side transforms to be performed on collections stored on the server. This means, despite what you may expect, if you're planning to perform (for example) a lot of sorting and filtering on a data set stored on a Worker, you should **keep the transforms in your client graph** and pass in the reference to the worker graph as their target. Muster will determine the overall transform set and pass it to the worker to be performed there, then return the aggregated response. If all transforms are opaque to the client graph, it will not handle updates to loading state correctly.

### Wrong way

e.g. Encapsulated worker graph - **do not do this!**

```javascript
// app.worker.js
const graph = muster({
  items: fromPromise(() => getData().then((data) => toNode(data))),
  fromDate: variable('2018-01-01'),
  toDate: variable('2018-12-31'),
  selectedItems: applyTransforms(ref('items'), [
    filter((item) =>
      and(
        gte(get(item, 'date'), ref('fromDate')),
        lte(get(item, 'date'), ref('toDate')),
      ),
    ),
  ]),
});

// app.js
const graph = muster({
  worker: worker('./app.worker.js'),
});

// UI example
app.resolve(ref('worker', 'selectedItems')).subscribe((items) => {
  // update UI
}); 
```

The problem in this example is that changes to `fromDate` or `toDate` will force a recalculation of the `selectedItems` set, but this fact is opaque to the client, which can lead to loading state problems. A better approach is to keep the transforms and their underlying variables on the client and declare only the underlying items on the worker:  

### Right way

```javascript
// app.worker.js
const graph = muster({
  items: fromPromise(() => getData().then((data) => toNode(data))),
});

// app.js
const graph = muster({
  worker: worker('./app.worker.js'),
  fromDate: variable('2018-01-01'),
  toDate: variable('2018-12-31'),
  selectedItems: applyTransforms(ref('worker', 'items'), [
    filter((item) =>
      and(
        gte(get(item, 'date'), ref('fromDate')),
        lte(get(item, 'date'), ref('toDate')),
      ),
    ),
  ]),
});

// UI example
app.resolve(ref('selectedItems')).subscribe((items) => {
  // update UI
}); 
```

In this example, the `fromDate`, `toDate` and `selectedItems` fields are kept on the client, with a reference back to the worker's `items` collection. This allows the client to maintain awareness of any changes impacting the transforms, while still **ensuring that the transforms themselves are processed on the worker**. You should consider this best practice!
