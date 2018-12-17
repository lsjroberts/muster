import { Provider } from '@dws/muster-react';
import React from 'react';
import { createGraph } from '../muster';
import { Footer } from './footer';
import { Navigation } from './navigation';
import { Router } from './router';

export function App() {
  return (
    <React.Fragment>
      <Provider muster={createGraph()}>
        <Navigation />
        <Router />
        <Footer />
      </Provider>
    </React.Fragment>
  );
}
