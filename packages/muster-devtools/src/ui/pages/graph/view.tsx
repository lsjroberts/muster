import * as React from 'react';
import { GraphExplorer, Watches } from '../../components';

import './style.css';

export interface GraphProps {
  isInstanceSelected: boolean;
}

export const GraphView = (props: GraphProps) => {
  if (!props.isInstanceSelected) {
    return <h1 className="centered-heading">Select Muster instance to begin</h1>;
  }
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-8">
          <GraphExplorer />
        </div>
        <div className="col">
          <Watches />
        </div>
      </div>
    </div>
  );
};
