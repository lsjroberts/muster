import * as m from '@dws/muster';
import * as MusterReact from '@dws/muster-react';
import { transform } from 'babel-standalone';
import * as React from 'react';
import ErrorBoundary from '../error-boundary';
import { getLibraryExports } from './common';

const babelOptions = {
  presets: ['react', ['es2015', { modules: false, loose: true }], ['stage-2']],
};

const stripTrailingSemicolon = (code: string) => code.slice(0, -1);

function extractContainerDefinition(source: string): string {
  const result = /(createContainer|container|simpleContainer)\(((?:.|\n)*)\)/.exec(source);
  if (!result) return source;
  if (result[1] === 'simpleContainer') {
    return `{ props: ${result[2]} }`;
  }
  return result[2];
}

const parseMusterReactExpression = (
  helpers: { [key: string]: any },
  source: string,
  viewDefinition: string,
) => {
  const helperNames = Object.keys(helpers);
  const helperValues = helperNames.map((name) => helpers[name]);
  const input = `
    const iife = ((helperValues, React) => ((${helperNames.join(',')}) => {
      const Container = container({
        renderError: (errors) => (
          <div>
            <h2>Component errors:</h2>
            <ul>{errors.map((error) => <li key={error}>{error.toString()}</li>)}</ul>          
          </div>
        ),
        renderLoading: () => (
          <div>
            <p>Waiting for result...</p>
          </div>
        ),
        ...${extractContainerDefinition(source)}
      });
      const Component = ${viewDefinition};
      const Content = Container(Component);
      return (Content);
    })(...helperValues, React))
  `;
  const code = stripTrailingSemicolon(transform(input, babelOptions).code || '');
  // tslint:disable-next-line:no-function-constructor-with-string-args
  const func = new Function('React', `${code}; return iife;`)();
  return func(helperValues, React);
};

const render = (muster: m.Muster, Component: React.ComponentClass) => (
  <ErrorBoundary>
    <MusterReact.Provider muster={muster}>
      <Component />
    </MusterReact.Provider>
  </ErrorBoundary>
);

export default (muster: m.Muster, source: string, viewDefinition: string) => {
  try {
    const Container = parseMusterReactExpression(
      { ...getLibraryExports(m, 'muster'), ...getLibraryExports(MusterReact, 'musterReact') },
      source,
      viewDefinition,
    );
    return render(muster, Container);
  } catch (e) {
    return (
      <div>
        <h2>Syntax errors:</h2>
        <p>{e.toString()}</p>
      </div>
    );
  }
};
