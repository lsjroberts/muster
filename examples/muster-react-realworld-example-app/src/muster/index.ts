import muster, { ref } from '@dws/muster';
import { api } from './api';
import { auth } from './auth';
import { navigation } from './navigation';

export function createGraph() {
  return muster({
    api: api({
      jwtToken: ref('auth', 'jwtToken'),
    }),
    auth: auth({
      user: ref('api', 'user'),
    }),
    navigation,
  });
}
