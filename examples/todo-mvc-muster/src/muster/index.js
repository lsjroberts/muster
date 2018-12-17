import muster, {
  applyTransforms,
  arrayList,
  count,
  eq,
  filter,
  get,
  head,
  length,
  location,
  ref,
  variable,
} from '@dws/muster-react';
import 'todomvc-app-css/index.css';
import loadItems from '../utils/load-items';

export default function createGraph() {
  return muster({
    itemCount: ref('itemList', length()),
    itemList: arrayList(
      loadItems().map((item) => ({
        id: item.id,
        label: variable(item.label),
        completed: variable(item.completed),
        editing: variable(false),
        temp: variable(''),
      })),
    ),
    remainingCount: head(
      applyTransforms(ref('itemList'), [
        filter((item) => eq(get(item, 'completed'), false)),
        count(),
      ]),
    ),
    nav: location({ hash: 'slash' }),
  });
}
