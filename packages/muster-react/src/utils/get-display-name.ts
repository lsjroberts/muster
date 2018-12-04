import { ComponentClass, StatelessComponent } from 'react';

export default function getDisplayName(
  component: ComponentClass<any> | StatelessComponent<any>,
): string {
  return component.displayName || component.name || 'Component';
}
