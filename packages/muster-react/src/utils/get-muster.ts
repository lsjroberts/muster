import { Muster } from '@dws/muster';

export interface MusterProps {
  muster?: Muster;
}

export default function getMuster(
  componentName: string,
  props: MusterProps,
  context?: any,
): Muster {
  const muster = (props && props.muster) || (context && (context.muster as Muster));
  if (!muster) {
    throw new Error(
      [
        `A muster-react component "${componentName}" must be wrapped in a Provider with a valid Muster instance:`,
        '  <Provider muster={<<valid_muster_instance>>}>',
        `    <${componentName} ... />`,
        '  </Provider>',
      ].join('\n'),
    );
  }
  return muster;
}
