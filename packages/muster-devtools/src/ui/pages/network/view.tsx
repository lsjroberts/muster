import classnames from 'classnames';
import * as React from 'react';
import { NetworkRequests } from '../../components';

import './style.css';

export interface MiddlewareProxy {
  id: string;
  path: Array<any>;
}

export interface NetworkProps {
  isInstanceSelected: boolean;
  proxies: Array<MiddlewareProxy>;
  selectedProxyId: string | undefined;
  setSelectedProxyId: (value: string | undefined) => void;
}

export class NetworkView extends React.PureComponent<NetworkProps> {
  constructor(props: NetworkProps) {
    super(props);
    if (props.selectedProxyId === undefined && props.proxies.length > 0) {
      props.setSelectedProxyId(props.proxies[0].id);
    }
  }

  render() {
    const { isInstanceSelected, proxies, selectedProxyId, setSelectedProxyId } = this.props;
    if (!isInstanceSelected) {
      return <h1 className="centered-heading">Select Muster instance to begin</h1>;
    }
    return (
      <>
        {selectedProxyId === undefined && (
          <h1 className="centered-heading">Select Proxy instance to begin</h1>
        )}
        <div className="container-fluid">
          <div className="row">
            <div className="col">
              <ul className="nav nav-tabs">
                {proxies.map((proxy) => (
                  <li className="nav-item" key={proxy.id}>
                    <a
                      className={classnames('nav-link', { active: selectedProxyId === proxy.id })}
                      href="#"
                      onClick={() => setSelectedProxyId(proxy.id)}
                    >
                      Path: {proxy.path.join('.')}
                    </a>
                  </li>
                ))}
              </ul>
              {selectedProxyId !== undefined && <NetworkRequests proxyId={selectedProxyId} />}
            </div>
          </div>
        </div>
      </>
    );
  }
}
