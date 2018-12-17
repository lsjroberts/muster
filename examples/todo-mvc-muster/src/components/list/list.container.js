import {
  action,
  applyTransforms,
  container,
  eq,
  filter,
  get,
  global,
  head,
  not,
  otherwise,
  propTypes,
  ref,
  removeItem,
  switchOn,
  types,
  when,
} from '@dws/muster-react';

export default container({
  graph: {
    currentPath: ref(global('nav', 'path')),
    filteredItemList: switchOn(ref('currentPath'), [
      when(
        '/active',
        applyTransforms(ref(global('itemList')), [filter((item) => not(get(item, 'completed')))]),
      ),
      when(
        '/completed',
        applyTransforms(ref(global('itemList')), [filter((item) => get(item, 'completed'))]),
      ),
      otherwise(ref(global('itemList'))),
    ]),
    remove: action(function*(itemID) {
      yield removeItem(
        ref(global('itemList')),
        head(
          applyTransforms(ref(global('itemList')), [filter((item) => eq(get(item, 'id'), itemID))]),
        ),
      );
    }),
  },
  props: {
    itemList: propTypes.list('filteredItemList', {
      id: types.number,
      label: types.string,
      completed: types.bool,
      editing: types.bool,
      temp: types.string,
      setCompleted: propTypes.setter('completed'),
      setEditing: propTypes.setter('editing'),
      setLabel: propTypes.setter('label'),
      setTemp: propTypes.setter('temp'),
    }),
    remove: propTypes.caller([types.integer]),
  },
});
