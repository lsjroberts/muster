import { Context, ContextValues } from '../types/graph';

export default function getContextValues(context: Context): ContextValues {
  return {
    ...(context.parent ? getContextValues(context.parent) : undefined),
    ...context.values,
  };
}
