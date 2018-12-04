import { Provider } from '@dws/muster-react';
import * as React from 'react';
import { Navigation } from '.';
import { createGraph } from '../graph';
import { PageContainer } from './page-container';

import './style.css';

const musterInstance = createGraph();

export interface AppState {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  hasError: boolean;
}

export class App extends React.Component<{}, AppState> {
  state: AppState = {
    hasError: false,
  };

  closeError = () => {
    this.setState({
      error: undefined,
      errorInfo: undefined,
      hasError: false,
    });
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true,
    });
  }

  render() {
    const { error, errorInfo, hasError } = this.state;
    return (
      <Provider muster={musterInstance}>
        <Navigation />
        <PageContainer />
        {hasError && (
          <div className="application-error alert alert-danger" role="alert">
            <button aria-label="Close" className="close" onClick={this.closeError} type="button">
              <span aria-hidden="true">&times;</span>
            </button>
            <h4 className="alert-heading">Error</h4>
            <p>{error && error.toString()}</p>
            <hr />
            <p className="mb-0">{errorInfo && errorInfo.componentStack}</p>
          </div>
        )}
      </Provider>
    );
  }
}
