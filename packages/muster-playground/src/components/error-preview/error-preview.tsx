import classnames from 'classnames';
import * as React from 'react';

import './error-preview.css';

export interface ErrorPreviewProps {
  className?: string;
  message: string;
  path?: string | Array<string>;
}

export default ({ className = undefined, message, path = undefined }: ErrorPreviewProps) => {
  return (
    <div className={classnames('ErrorPreview', className)}>
      <div className="ErrorPreview__message">
        {path ? (
          <strong>
            {// eslint-disable-next-line no-nested-ternary
            typeof path === 'string' ? (
              <span>Error in {path}: </span>
            ) : path.length === 0 ? (
              <span>Error at root path:</span>
            ) : (
              <span>
                Error at path <code>{JSON.stringify(path)}</code>:{' '}
              </span>
            )}
          </strong>
        ) : (
          <strong>Error: </strong>
        )}
        <pre>
          <code>{message}</code>
        </pre>
      </div>
    </div>
  );
};
