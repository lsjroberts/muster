import { Provider } from '@dws/muster-react';
import * as React from 'react';

import { Embed } from './components/embed';
import router from './muster/router';

import 'bootstrap/dist/css/bootstrap-reboot.min.css';

export default () => {
  return (
    <Provider muster={router()}>
      <Embed />
    </Provider>
  );
};
