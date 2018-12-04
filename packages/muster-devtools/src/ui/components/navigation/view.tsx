import classnames from 'classnames';
import * as React from 'react';

export interface NavigationProps {
  instancesIds: Array<number>;
  path: string;
  selectInstance: (id: number | undefined) => void;
  selectedInstanceId: number | undefined;
  setPath: (path: string) => void;
}

export const NavigationView = ({
  instancesIds,
  path,
  selectInstance,
  selectedInstanceId,
}: NavigationProps) => {
  const selectInstanceClasses = classnames('btn', 'dropdown-toggle', {
    'btn-secondary': !selectedInstanceId,
    'btn-success': !!selectedInstanceId,
  });
  return (
    <nav className="navbar navbar-expand-sm navbar-light bg-light">
      <a className="navbar-brand" href="#">
        Muster DevTools
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarText"
        aria-controls="navbarText"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        {!!selectedInstanceId && (
          <ul className="navbar-nav">
            <li className={classnames('nav-item', { active: path === '/' })}>
              <a className="nav-link" href="#/">
                Graph
              </a>
            </li>
            <li className={classnames('nav-item', { active: path === '/network' })}>
              <a className="nav-link" href="#/network">
                Network
              </a>
            </li>
          </ul>
        )}
      </div>
      <form className="form-inline">
        {(() => {
          if (instancesIds.length === 0) {
            return <p>No Muster instances detected.</p>;
          }
          return (
            <div className="dropdown">
              <button
                className={selectInstanceClasses}
                type="button"
                id="dropdownMenuButton"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {selectedInstanceId ? selectedInstanceId : 'Select muster instance'}
              </button>
              <div
                className="dropdown-menu dropdown-menu-right"
                aria-labelledby="dropdownMenuButton"
              >
                <a className="dropdown-item" href="#" onClick={() => selectInstance(undefined)}>
                  Clear
                </a>
                {instancesIds.map((id) => (
                  <a className="dropdown-item" href="#" onClick={() => selectInstance(id)} key={id}>
                    {id}
                  </a>
                ))}
              </div>
            </div>
          );
        })()}
      </form>
    </nav>
  );
};
