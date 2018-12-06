import { Matcher } from '@dws/muster';
import get from 'lodash/get';
import { TreeMatcher } from '../types/tree';

export interface RequirementsTree {
  [key: string]: Matcher<any, any>;
}

export function getInjectedProps(
  prefix: string,
  treeMatcher: TreeMatcher<any>,
  props: any,
  path: Array<string>,
): any {
  const source = path.length > 0 ? get(props, path) : props;
  if (!source || typeof source !== 'object' || source === null) return undefined;
  return Object.keys(treeMatcher.metadata.options).reduce(
    (obj, fieldName) => {
      obj[fieldName] = source[`$$required(${prefix}):${fieldName}`];
      return obj;
    },
    {} as any,
  );
}

export function toRequirementsTree(
  prefix: string,
  treeMatcher: TreeMatcher<any>,
): RequirementsTree {
  const fields = treeMatcher.metadata.options;
  return Object.keys(fields).reduce(
    (acc, fieldName) => {
      acc[`$$required(${prefix}):${fieldName}`] = fields[fieldName];
      return acc;
    },
    {} as RequirementsTree,
  );
}
