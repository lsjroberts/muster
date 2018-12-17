import React from 'react';

export function ErrorList({ errors }: { errors: Array<string> | undefined }) {
  return (
    <React.Fragment>
      {errors && errors.length > 0 && <ul className="error-messages">
        {errors.map((error) =>
          <li key={error}>{error}</li>
        )}
      </ul>}
    </React.Fragment>
  )
}
