import 'babel-polyfill';
import 'react-hot-loader/patch';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import EntryComponent from './embed-main';

function render(Component: () => JSX.Element) {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('app'),
  );
}

render(EntryComponent);

if ((module as any).hot) {
  (module as any).hot.accept('./main', () => {
    render(EntryComponent);
  });
}
