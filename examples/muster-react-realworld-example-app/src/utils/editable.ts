import {
  createBehavior,
  eq,
  get,
  ifElse,
  NodeDefinition,
  not,
  ref,
  relative,
  set,
  SetProperties,
  variable,
} from '@dws/muster';

export function editable(original: NodeDefinition, fieldName: string): any {
  const editableFieldName = `$$editable_${fieldName}`;
  return {
    [editableFieldName]: variable(undefined),
    [fieldName]: createBehavior({
      evaluate: () => ifElse({
        if: not(eq(ref(relative(editableFieldName)), undefined)),
        then: ref(relative(editableFieldName)),
        else: get(original, fieldName),
      }),
      set: (params, operation: SetProperties) => set(relative(editableFieldName), operation.value),
    }),
  };
}
