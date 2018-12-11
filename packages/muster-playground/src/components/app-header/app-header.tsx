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
      <div className="AppHeader__examples">
        Examples
        <select
          className="AppHeader__examples__select"
          onChange={(e) => {
            switch (e.target.value) {
              case 'basic':
                window.location.href =
                  '/muster/?graph=IntcbiAgZ3JlZXRpbmc6ICdIZWxsbycsXG4gIHVzZXI6ICd3b3JsZCcsXG4gIHdlbGNvbWU6IGZvcm1hdCgnJHtzYWx1dGF0aW9ufSwgJHtuYW1lfSEnLCB7XG4gICAgc2FsdXRhdGlvbjogcmVmKCdncmVldGluZycpLFxuICAgIG5hbWU6IHJlZigndXNlcicpLFxuICB9KSxcbn0i&toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjp0cnVlLCJzaG93VmlldyI6dHJ1ZSwic2hvd1ZpZXdSZXN1bHQiOnRydWV9#basic';
                break;
              case 'recursion':
                window.location.href =
                  '/muster/?graph=IntcbiAgW21hdGNoKHR5cGVzLmludGVnZXIsICdpJyldOiB7XG4gICAgZmlib25hY2NpOiBjb21wdXRlZChcbiAgICAgIFtwYXJhbSgnaScpXSxcbiAgICAgIChpKSA9PiAoXG4gICAgICAgIGkgPCAyXG4gICAgICAgICAgPyBpXG4gICAgICAgICAgOiBhZGQocmVmKGkgLSAxLCAnZmlib25hY2NpJyksIHJlZihpIC0gMiwgJ2ZpYm9uYWNjaScpKVxuICAgICAgKVxuICAgIClcbiAgfVxufSI%3D&toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjpmYWxzZSwic2hvd1ZpZXciOmZhbHNlLCJzaG93Vmlld1Jlc3VsdCI6ZmFsc2V9&query=InJlZigxMCwgJ2ZpYm9uYWNjaScpIg%3D%3D#recursion';
                break;
              case 'fetch':
                window.location.href =
                  '/muster/?graph=IntcbiAgZ3JlZXRpbmc6ICdIZWxsbycsXG4gIHVzZXI6IGZyb21Qcm9taXNlKCgpID0%2BXG4gICAgZmV0Y2goJ2h0dHBzOi8vanNvbnBsYWNlaG9sZGVyLnR5cGljb2RlLmNvbS91c2Vycy8xJylcbiAgICAgIC50aGVuKHJlcyA9PiByZXMuanNvbigpKVxuICAgICAgLnRoZW4odXNlciA9PiB1c2VyLm5hbWUpXG4gICksXG4gIHdlbGNvbWU6IGZvcm1hdCgnJHtzYWx1dGF0aW9ufSwgJHtuYW1lfSEnLCB7XG4gICAgc2FsdXRhdGlvbjogcmVmKCdncmVldGluZycpLFxuICAgIG5hbWU6IHJlZigndXNlcicpLFxuICB9KSxcbn0i&toggles=eyJzaG93R3JhcGgiOnRydWUsInNob3dRdWVyeSI6dHJ1ZSwic2hvd1F1ZXJ5UmVzdWx0Ijp0cnVlLCJzaG93Q29udGFpbmVyIjp0cnVlLCJzaG93VmlldyI6dHJ1ZSwic2hvd1ZpZXdSZXN1bHQiOnRydWV9#fetch';
                break;
            }
          }}
        >
          <option value="basic" selected={window.location.hash === '#basic'}>
            Basic
          </option>
          <option value="recursion" selected={window.location.hash === '#recursion'}>
            Recursion
          </option>
          <option value="fetch" selected={window.location.hash === '#fetch'}>
            Fetching APIs
          </option>
        </select>
      </div>
      <div className="AppHeader__title">
        <div className="AppHeader__title__title">Muster</div>
        <div className="AppHeader__title__subtitle">{title}</div>
      </div>
      <div className="AppHeader__version">{VERSION}</div>
    </header>
  );
};
