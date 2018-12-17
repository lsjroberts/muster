import {
  action,
  container,
  global,
  propTypes,
  push,
  ref,
  toNode,
  types,
  variable,
} from '@dws/muster-react';
import getNextTodoId from '../../utils/get-next-todo-id';

export default container({
  graph: {
    addItem: action(function*(item) {
      if (!item || item === '') return;
      const nextId = getNextTodoId();
      yield push(
        ref(global('itemList')),
        toNode({
          id: nextId,
          label: variable(item),
          completed: variable(false),
          editing: variable(false),
          temp: variable(''),
        }),
      );
    }),
  },
  props: {
    addItem: propTypes.caller([types.string]),
  },
});
