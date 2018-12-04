import * as muster from '@dws/muster';

export default function injectMuster(context: any): any {
  Object.keys(muster).forEach((keyName) => {
    if (keyName === 'default') return;
    Object.defineProperty(context, keyName, {
      configurable: false,
      enumerable: true,
      value: (muster as any)[keyName],
    });
  });
  Object.defineProperty(context, 'muster', {
    configurable: false,
    enumerable: true,
    value: muster.default,
  });
  return context;
}
