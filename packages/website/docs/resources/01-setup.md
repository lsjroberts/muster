---
id: setup
title: Setup
---

## Installation

To use Muster, you'll need to install it as a project dependency.

```bash
npm i @dws/muster
# or
yarn add @dws/muster
```

You can import Muster into any JavaScript or TypeScript file and begin building your graph.

```javascript
import muster from '@dws/muster';

const app = muster({
  greeting: 'Hello world',
});
```

You can query the graph and receive a promise or an observable subscription within your code.

```javascript
import muster, { ref } from '@dws/muster';

const app = muster({
  greeting: 'Hello world',
});

app.resolve(ref('greeting')).then((result) => 
  console.log(result)
);

// Console output:
// Hello world
```

> See the [Introduction to Muster](/muster/docs/learn/introduction.html) for more information on creating and querying graphs.

## View integration

If you're going to integrate with a view layer in a web app, you'll also want to install a framework integration. Currently only `Muster-React` is officially provided, but if you'd like to use another framework [please get in touch](/muster/help).

```bash
npm i @dws/muster-react
# or
yarn add @dws/muster-react
```

You can then use a `Provider` to make your Muster graph available to your components, and use a `Container` to describe each component's data requirements.

```jsx harmony
// ...
import muster, { Provider, simpleContainer } from '@dws/muster-react';

const app = muster({
  name: 'world',
});

const myContainer = simpleContainer({
  name: true,
});

const MyConnectedComponent = myContainer(MyComponent);

ReactDOM.render(
  <Provider muster={app}>
    <MyConnectedComponent />
  </Provider>,
  document.body,
);
```


> Head for the [Muster-React Tutorial](/muster/docs/tutorials/muster-react-tutorial.html) to find out more.

## Muster on the server

If you're planning to run a Graph Server, you'll want to install `Muster-Server` into your node application.

```bash
npm i @dws/muster-server
# or
yarn add @dws/muster-server
```

You can then add the `Muster-Server` Socket or XHR Middleware to an Express server and configure your graph for remote access.

```js
import muster from '@dws/muster';
import { musterExpress } from '@dws/muster-server';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

const musterApp = muster({
  greeting: 'Hello, server world!',
});

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use('/', musterExpress(musterApp));
app.listen(8080);
``` 

> Take a look at [Muster on the Server](/muster/docs/tutorials/muster-server.html) for more information.
