import muster, { ref } from '@dws/muster';
import { worker } from '../worker-host';

const clientApp = muster({
  worker: worker('./app.worker.js', { log: true }),
});

// no `dom` typings around as they clash with `webworker`
declare const document: any;

clientApp.resolve(ref('worker', 'nameStream')).subscribe((value) => {
  console.log(value);
  document.querySelector('#app').innerHTML = value;
});
