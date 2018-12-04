# Muster Remote

## Introduction 

Nodes for connecting to remote Muster instances running Muster-Server, using WebSockets to maintain the connection.

## Usage

```js
import {
  remote
} from '@dws/muster-remote';

const graph = {
  server: remote('ws://server:8999', { useSockets: true })
};
// ...
```

## Install

With [npm](https://npmjs.org/) installed, run

```bash
$ npm install @dws/muster-remote
```

## License

MIT
