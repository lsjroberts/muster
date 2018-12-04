import classnames from 'classnames';
import * as React from 'react';
import AppHeader from '../app-header';
import QueryEditor from '../query-editor';

import './app.css';

export interface AppProps {
  className?: string;
  title: string;
}

export const AppView = ({ className = undefined, title }: AppProps) => {
  return (
    <div className={classnames('App', className)}>
      <div className="App__header">
        <AppHeader title={title} />
      </div>
      <div className="App__main">
        <QueryEditor />
      </div>
    </div>
  );
};
