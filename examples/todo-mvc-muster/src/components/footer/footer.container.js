import {
  action,
  choose,
  container,
  eq,
  get,
  global,
  otherwise,
  propTypes,
  ref,
  removeItems,
  types,
  when,
} from '@dws/muster-react';

export default container({
  graph: {
    clearCompleted: action(function*() {
      // Removes multiple nodes based on condition
      yield removeItems(ref(global('itemList')), (item) => get(item, 'completed'));
    }),
    footerClasses: {
      // Depending on url path, decide which tab to select
      allClass: choose([when(eq(ref(global('nav', 'path')), '/'), 'selected'), otherwise('')]),
      activeClass: choose([
        when(eq(ref(global('nav', 'path')), '/active'), 'selected'),
        otherwise(''),
      ]),
      completedClass: choose([
        when(eq(ref(global('nav', 'path')), '/completed'), 'selected'),
        otherwise(''),
      ]),
    },
    itemCount: ref(global('itemCount')),
    remainingCount: ref(global('remainingCount')),
  },
  props: {
    clearCompleted: propTypes.caller(),
    footerClasses: propTypes.defer({
      allClass: types.string,
      activeClass: types.string,
      completedClass: types.string,
    }),
    itemCount: types.number,
    remainingCount: types.number,
  },
});
