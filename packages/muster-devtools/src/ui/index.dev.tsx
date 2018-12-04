import { hot } from 'react-hot-loader';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App as AppView } from './components';

const App = hot(module)(AppView);

window.addEventListener('load', () => {
  ReactDOM.render(<App />, document.getElementsByTagName('main')[0]);
});
