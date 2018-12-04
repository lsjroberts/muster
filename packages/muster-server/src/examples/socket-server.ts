import { default as muster, fromStream, value } from '@dws/muster';
import { BehaviorSubject } from '@dws/muster-observable';

import * as http from 'http';
import WebSocket, { AddressInfo } from 'ws';

import { socketConnect } from '../muster-sockets';

let age = 1;
const subject = new BehaviorSubject(value(`Geoff is ${age}`));
setInterval(() => {
  // tslint:disable-next-line:no-increment-decrement
  subject.next(value(`Geoff is ${age++}`));
}, 5000);

const graph = muster({
  name: 'Test name',
  ageStream: fromStream(subject),
});

const server = http.createServer();
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws: WebSocket) => {
  socketConnect(graph, ws, { enableRequestLogging: true });
});

server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`);
});
