---
id: muster-server
title: Muster on the Server
---

One of the best features of Muster is the seamless client-server communication with the help of a **Muster-Server** package. By default Muster comes bundled with a set of nodes that enable communication with remote instances of Muster. One of these nodes - `remote()` (actually a `proxy()` with the `xhrMiddleware()` node) - enables communication using `POST` requests. The fact that Muster treats synchronous and asynchronous nodes in the same way means that there's no difference between accessing nodes defined in the application graph, and accessing nodes that are living on the server. 

In this tutorial we're going to cover the basics of defining a graph on the server, and interacting with that graph from the client.

## First server-side Muster graph

The following example uses [Express.js](http://expressjs.com/) as a Node.js web framework. Muster also comes with a package `muster-server` which exposes an *Express.js* middleware that exposes Muster graph under a set path.

```javascript
import muster from '@dws/muster';
import { musterExpress } from '@dws/muster-server';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

// Create simple muster graph
const musterApp = muster({
  greeting: 'Hello, server world!',
});

// Create the express.js app
const app = express();
// Enable CORS
app.use(cors({ origin: true, credentials: true }));
// Enable parsing JSON body
app.use(bodyParser.json());
// Bind Muster to path '/'
app.use('/', musterExpress(musterApp));
// Start express.js server on port 8080
app.listen(8080);
``` 

The example above includes a fair bit of boilerplate code, which deals with setting up the Express.js server. Firstly, because Muster uses JSON as a format for communicating between client and server, we need to import a `body-parser` library, and bind it to our Express.js app. Second thing we have to do is setup some simple [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), which is done with the help of the `cors` library. Finally we create a muster graph that is going to be exposed under the `/` path.



## Connecting client to the server   

As mentioned in the **introduction**, by default Muster uses `POST` requests to communicate with the server. This means that all communication between client and the server must be initiated by the client.

In this part of the tutorial we're going to make a simple client-side application that connects to the graph-server we made in the previous section. Before we get into writing the code let's make an assumption that the server we just wrote is running, and is accessible under `http://localhost:8080/`.
```js
import muster, { remote } from '@dws/muster';

const clientApp = muster({
  // The following node creates a connection to the server
  server: remote('http://localhost:8080/'),
});

await clientApp.resolve(ref('server', 'greeting'));
// === 'Hello, server world!'
```
Well, that was easy! Note that we only have one branch in our client app - `server`. This branch works like a gateway to the remote instance of muster, and all operations done against it will be redirected to the root of the server graph. In our case we resolved a `ref('server', 'greeting')`. In process of resolving that node Muster will realise that `greeting` should be requested from the server, and it will relay `ref('greeting')` to be resolved on the server.



## Requesting nested paths from the server

In the previous examples we've covered resolving a simple ref against a server. In this example I'm going to show you that accessing nested paths works in the same way as accessing nested paths locally.

### server.js
```js
import muster from '@dws/muster';
import { musterExpress } from '@dws/muster-server';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

// Create simple muster graph
const musterApp = muster({
  user: {
    firstName: 'Kate',
    lastName: 'Smith',
  },
});

// Create the express.js app
const app = express();
// Enable CORS
app.use(cors({ origin: true, credentials: true }));
// Enable parsing JSON body
app.use(bodyParser.json());
// Bind Muster to path '/'
app.use('/', musterExpress(musterApp));
// Start express.js server on port 8080
app.listen(8080);
``` 

### client.js
```js
import muster, { remote } from '@dws/muster';

const clientApp = muster({
  // The following node creates a connection to the server
  server: remote('http://localhost:8080/'),
});

await clientApp.resolve(ref('server', 'user', 'firstName'));
// === 'Kate'
```
Note that the ref looks exactly the same as if the `server`->`user`->`firstName` was a locally available tree. This makes it easier to migrate the code that was prototyped on the client-side into the server, as your client code doesn't care where the data come from, as long as the path in the graph is the same.


## Using branch matchers on the server

This example shows that you can also create branch matchers on the server-side, just like you do on the client-side:

### server.js
```js
import muster, { computed, match, param, types } from '@dws/muster';
import { musterExpress } from '@dws/muster-server';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

// Create simple muster graph
const musterApp = muster({
  greet: {
    [match(types.string, 'userName')]: computed(
      [param('userName')],
      (userName) => `Hello, ${userName}!`, 
    ),
  },
});

// Create the express.js app
const app = express();
// Enable CORS
app.use(cors({ origin: true, credentials: true }));
// Enable parsing JSON body
app.use(bodyParser.json());
// Bind Muster to path '/'
app.use('/', musterExpress(musterApp));
// Start express.js server on port 8080
app.listen(8080);
```

### client.js
```js
import muster, { remote } from '@dws/muster';

const clientApp = muster({
  // The following node creates a connection to the server
  server: remote('http://localhost:8080/'),
});

await clientApp.resolve(ref('server', 'greet', 'Kate Jonson'));
// === Hello, Kate Jonson!
```

> **Note:** There's no limit as to which Muster nodes you can use on the server. 



## Web Sockets

Aside from being able to host Muster as part of Express.js app, Muster has an ability to establish connection through a WebSocket. In this section I'm going to guide you through the process of creating both client and server apps that are able to communicate with each-other using web socket streams.


### server.js

First, let's start by making a server application. For this we're going to need to import `socketConnect` from `'@dws/muster-server'`, create a new HTTP server, and make a WebSocket server. Each new incoming connection should then be passed through to the `socketConnect` utility, along with the instance of Muster application. This utility will handle the lifecycle of the connection so that you don't have to do that yourself.

```javascript
import muster from '@dws/muster';
import { socketConnect } from '@dws/muster-server';
import http from 'http';
import WebSocket from 'ws';

const musterApp = muster({
  greeting: 'Hello, server world!',
});

// Create the HTTP server
const httpServer = http.createServer();
// Create the WebSocket server based on the HTTP server
const webSocketServer = new WebSocket.Server({ server: httpServer });
// Add WS connection listener
webSocketServer.on('connection', (ws) => {
  // Hand over the web socket connection to socketConnect
  socketConnect(musterApp, ws);
});
// Start the HTTP server
httpServer.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${httpServer.address().port}`);
});
```

### client.js

The next step is to create a client application that connects to the newly created server. The process is very similar to connecting to Express.js server, but with a few small differences. Originally we imported the `remote` node from `'@dws/muster'`. However, that node only supports connection with Express.js-based servers. Changing that import to `import { remote } from '@dws/muster-remote';` will cause a more powerful version of the `remote` node to be loaded. By default that freshly imported node will delegate its logic to `remote` node from `'@dws/muster'`. To enable the web sockets you must call it with a `{ useSockets: true }` option:

```javascript
import muster, { ref } from '@dws/muster';
import { remote } from '@dws/muster-remote';

const port = process.env.PORT || '8999';
const clientApp = muster({
  server: remote(`http://localhost:${port}/`, { useSockets: true }),
});

await clientApp.resolve(ref('server', 'greeting'));
// === 'Hello, server world!'
``` 


## Streaming data from the server to the frontend

In the previous example we've created a simple client-server architecture which uses WebSockets for communication. Due to the simplicity of the example we can't really see the benefit of having a WebSocket connection compared to regular HTTP server.

Let's build on that example by adding some reactive behaviour. 


### server.js

```javascript
import muster, { format, ref, variable } from '@dws/muster';
import { socketConnect } from '@dws/muster-server';
import http from 'http';
import WebSocket from 'ws';

const musterApp = muster({
  name: variable('Jane'),
  greeting: format('Hello, ${name}!', {
    name: ref('name'),
  }),
});

// Create the HTTP server
const httpServer = http.createServer();
// Create the WebSocket server based on the HTTP server
const webSocketServer = new WebSocket.Server({ server: httpServer });
// Add WS connection listener
webSocketServer.on('connection', (ws) => {
  // Hand over the web socket connection to socketConnect
  socketConnect(musterApp, ws);
});
// Start the HTTP server
httpServer.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${httpServer.address().port}`);
});
```

This server code we've just created contains a Muster graph which computes a greeting with response to the change of the `name`.


### client.js

```javascript
import muster, { ref, set } from '@dws/muster';
import { remote } from '@dws/muster-remote';

const port = process.env.PORT || '8999';
const clientApp = muster({
  server: remote(`http://localhost:${port}/`, { useSockets: true }),
});

clientApp.resolve(ref('server', 'greeting')).subscribe((greeting) => {
  console.log(greeting);
});

console.log('Changing name to "Kate"');
await clientApp.resolve(set(ref('server', 'name'), 'Kate'));

console.log('Changing name to "Diana"');
await clientApp.resolve(set(ref('server', 'name'), 'Diana'));

// Console output:
// Hello, Jane!
// Changing name to "Kate"
// Hello, Kate!
// Changing name to "Diana"
// Hello, Diana!
``` 

Note that the console output contains a continuous stream of updates for the `greeting`. This would not be possible with a regular XHR-based connection.
With the use of the WebSockets the code we make behaves in the same way as it was run locally by preserving the streaming nature of Muster nodes.
