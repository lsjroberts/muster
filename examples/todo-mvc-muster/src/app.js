/* global localStorage */
import { entries, Provider, query, ref } from '@dws/muster-react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import 'todomvc-app-css/index.css';
import App from './components/app';
import Info from './components/info';
import createGraph from './muster';

function saveItemsToLocalStorage(graph) {
  graph
    .resolve(
      query(
        ref('itemList'),
        entries({
          id: true,
          label: true,
          completed: true,
        }),
      ),
    )
    .subscribe((items) => {
      localStorage.setItem('items', JSON.stringify(items));
    });
  return graph;
}

export default function Main() {
  const graph = saveItemsToLocalStorage(createGraph());
  return (
    <Provider muster={graph}>
      <BrowserRouter>
        <div>
          <App />
          <Info />
        </div>
      </BrowserRouter>
    </Provider>
  );
}
