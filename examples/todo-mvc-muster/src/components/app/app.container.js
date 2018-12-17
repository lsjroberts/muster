import {
  action,
  container,
  entries,
  fn,
  get,
  global,
  map,
  not,
  propTypes,
  query,
  ref,
  set,
  some,
  types,
  withTransforms,
} from '@dws/muster-react';

export default container({
  graph: {
    itemCount: ref(global('itemCount')),
    remainingCount: ref(global('remainingCount')),
    toggleAll: action(function*() {
      const isAnyCompleted = yield some(
        ref(global('itemList')),
        fn((item) => not(get(item, 'completed'))),
      );
      yield query(
        // If some of itemList do not have completed: true, targetValue=true
        ref(global('itemList')),
        withTransforms([map((item) => set(get(item, 'completed'), isAnyCompleted))], entries()),
      );
    }),
  },
  props: {
    itemCount: types.number,
    remainingCount: types.number,
    toggleAll: propTypes.caller(),
  },
});
