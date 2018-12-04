import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './components';

window.addEventListener('load', () => {
  ReactDOM.render(<App />, document.getElementsByTagName('main')[0]);
});
