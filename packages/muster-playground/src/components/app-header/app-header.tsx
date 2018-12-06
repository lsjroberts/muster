import classnames from 'classnames';
import * as React from 'react';

import './app-header.css';

declare const VERSION: string;

export interface AppHeaderProps {
  className?: string;
  title: string;
}

export default ({ className = undefined, title }: AppHeaderProps) => {
  return (
    <header className={classnames('AppHeader', className)}>
      <div className="AppHeader__logo">{VERSION}</div>
      <div className="AppHeader__title">
        <div className="AppHeader__title__title">Muster</div>
        <div className="AppHeader__title__subtitle">{title}</div>
      </div>
    </header>
  );
};
