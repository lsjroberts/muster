import { Provider } from '@dws/muster-react';
import * as React from 'react';
import { App } from './components/app';
import router from './muster/router';

import 'bootstrap/dist/css/bootstrap-reboot.min.css';
import './buttons.css';

export default () => {
  return (
    <Provider muster={router()}>
      <App />
    </Provider>
  );
};
