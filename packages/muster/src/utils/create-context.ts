import { CONTEXT, Context, ContextValues } from '../types/graph';
import * as graphTypes from './graph-types';
import { empty as hashEmpty, objectOf as hashObjectOf, string as hashString } from './hash';

const hashContextValues = hashObjectOf(graphTypes.graphNode);

export function createRootContext(values: ContextValues = {}): Context {
  const context: Context = {
    [CONTEXT]: true,
    id: `${hashEmpty(undefined)}:${hashString(hashContextValues(values))}`,
    root: (undefined as any) as Context,
    parent: undefined,
    values,
  };
  return Object.assign(context, { root: context });
}

export function createContext(parent: Context, values: ContextValues): Context {
  return {
    [CONTEXT]: true,
    id: `${parent.id}:${hashString(hashContextValues(values))}`,
    root: parent.root,
    parent,
    values: {
      ...parent.values,
      ...values,
    },
  } as Context;
}
