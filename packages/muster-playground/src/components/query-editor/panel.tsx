import classnames from 'classnames';
import * as React from 'react';
import './panel.css';

export interface PanelProps {
  id: string;
  header?: string;
  scrollable?: boolean;
  children: JSX.Element;
}

export default ({ scrollable, header = 'Header', children }: PanelProps) => {
  return (
    <div
      className={classnames('QueryEditor__panel', {
        'QueryEditor__panel--scrollable': scrollable,
      })}
    >
      <h3 className="QueryEditor__panel__header">{header}</h3>
      <div className="QueryEditor__panel__content">{children}</div>
    </div>
  );
};
