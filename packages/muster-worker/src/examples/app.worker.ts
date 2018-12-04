import { default as muster, fromStream, value } from '@dws/muster';
import { BehaviorSubject } from '@dws/muster-observable';

import { workerConnect } from '..';

const ctx = self as DedicatedWorkerGlobalScope;

let age = 1;
const subject = new BehaviorSubject(value(`Geoff is ${age}`));
setInterval(() => {
  // tslint:disable-next-line:no-increment-decrement
  subject.next(value(`Geoff is ${age++}`));
}, 5000);

const graph = muster({
  nameStream: fromStream(subject),
});

workerConnect(graph, ctx, { log: true });
