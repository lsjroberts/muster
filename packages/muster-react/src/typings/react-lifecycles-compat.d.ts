// until @types/react-lifecycles-compat is published
declare module 'react-lifecycles-compat' {
  import * as React from 'react';

  function polyfill(defaultValue: React.ComponentClass): React.ComponentClass;
}
