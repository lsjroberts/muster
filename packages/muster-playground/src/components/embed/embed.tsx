import classnames from 'classnames';
import * as React from 'react';
import QueryEditor from '../query-editor';

import './embed.css';

export interface EmbedProps {
  className?: string;
}

export const EmbedView = ({ className = undefined }: EmbedProps) => {
  return (
    <div className={classnames('App', className)}>
      <div className="App__main">
        <QueryEditor />
      </div>
    </div>
  );
};
