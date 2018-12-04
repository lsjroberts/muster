import * as React from 'react';

export function renderPlatformErrors(componentName: string, errors: Array<Error>): JSX.Element {
  errors.forEach(console.error);
  const panelStyle = {
    backgroundColor: 'red',
    color: 'white',
    padding: '1em',
  };
  return (
    <div style={panelStyle}>
      <h1>Component "{}" received errors from muster:</h1>
      <ul>
        {errors.map((error) => (
          <li key={error.toString()}>{error.toString()}</li>
        ))}
      </ul>
    </div>
  );
}
