import muster, { ref } from '@dws/muster';
import { remote } from '@dws/muster-remote';

const port = process.env.PORT || '8999';
const clientApp = muster({
  server: remote(`http://localhost:${port}/`, { useSockets: true }),
});

clientApp.resolve(ref('server', 'ageStream')).subscribe((value) => {
  console.log(value);
});
