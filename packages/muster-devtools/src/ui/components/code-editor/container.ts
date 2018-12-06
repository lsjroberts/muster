import { container, propTypes, types, variable } from '@dws/muster-react';

export const CodeEditorContainer = container({
  graph: {
    value: variable(''),
  },
  props: {
    setValue: propTypes.setter('value', types.string),
    value: types.string,
  },
});
