import { isMatcher } from '@dws/muster';
import { Props } from '../container-types';

export function isProps(value: any): value is Props<any> {
  if (!value || typeof value !== 'object' || value === null) return false;
  return Object.keys(value).every((key) => {
    const keyValue = value[key];
    return isMatcher(keyValue) || isProps(keyValue) || keyValue === true;
  });
}
