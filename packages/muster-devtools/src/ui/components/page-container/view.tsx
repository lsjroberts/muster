import * as React from 'react';
import { Graph, Network } from '../../pages';

export interface PageContainerProps {
  path: string;
}

export const PageContainerView = ({ path }: PageContainerProps) => {
  if (path === '/') return <Graph />;
  if (path === '/network') return <Network />;
  return <p>Unknown page {path}</p>;
};
