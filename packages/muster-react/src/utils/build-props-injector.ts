import fromPairs from 'lodash/fromPairs';
import get from 'lodash/get';
import identity from 'lodash/identity';
import toPairs from 'lodash/toPairs';
import { InjectedMatcher, isInjectedMatcher } from '../types/injected';
import { isTreeMatcher, TreeMatcher } from '../types/tree';

export type PropsInjector = (props: any, injectedProps: any) => any;

export function buildPropsInjector(
  propsTree: TreeMatcher<any>,
  requiredPropsTree: TreeMatcher<any> | undefined,
): PropsInjector {
  return buildPropsInjectorForPath(propsTree, requiredPropsTree, []);
}

function buildPropsInjectorForPath(
  propsTree: TreeMatcher<any>,
  requiredPropsTree: TreeMatcher<any> | undefined,
  propsTreePath: Array<string>,
): PropsInjector {
  const fieldsWithKeys = toPairs(propsTree.metadata.options);
  const propsMappers: Array<[string, PropsInjector]> = fieldsWithKeys.map(
    ([name, field]): [string, PropsInjector] => {
      if (isTreeMatcher(field)) {
        return [
          name,
          buildPropsInjectorForPath(field, requiredPropsTree, [...propsTreePath, name]),
        ];
      }
      if (isInjectedMatcher(field)) {
        const fieldPath = [...propsTreePath, name];
        const injectedPath = field.metadata.options.path || fieldPath;
        if (!requiredPropsTree) {
          throw new Error(`Component must declare requirements in order to use injected props.`);
        }
        if (!isValidInjectedPath(requiredPropsTree, injectedPath)) {
          throw new Error(`Invalid path to the injected prop: ${fieldPath.join(',')}`);
        }
        return [name, (props, injectedProps) => get(injectedProps, injectedPath)];
      }
      return [name, identity];
    },
  );
  return (props, injectedProps) =>
    fromPairs(
      propsMappers.map(([name, mapper]) => [name, props && mapper(props[name], injectedProps)]),
    );
}

function isValidInjectedPath(
  requiredPropsTree: TreeMatcher<any>,
  injectedPath: Array<string>,
): boolean {
  const [name, ...path] = injectedPath;
  const field = requiredPropsTree.metadata.options[name];
  if (!field) return false;
  if (path.length === 0) return true;
  if (path.length > 0 && !isTreeMatcher(field)) return false;
  return isValidInjectedPath(field, path);
}

export function buildTopLevelPropsInjector(
  matcher: InjectedMatcher,
  requiredPropsTree: TreeMatcher<any> | undefined,
): PropsInjector {
  if (!requiredPropsTree) {
    throw new Error(`Component must declare requirements in order to use injected props.`);
  }
  const injectedPath = matcher.metadata.options.path;
  if (injectedPath && !isValidInjectedPath(requiredPropsTree, injectedPath)) {
    throw new Error(`Invalid path to the injected prop: ${injectedPath.join(',')}`);
  }
  return (props, injectedProps) =>
    injectedPath ? get(injectedProps, injectedPath) : injectedProps;
}
