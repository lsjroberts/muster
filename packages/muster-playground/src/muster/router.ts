import muster, { Muster, value } from '@dws/muster';
import { withDevTools } from '@dws/muster-devtools-client';

export default (): Muster => {
  return withDevTools(
    'Playground',
    muster({
      ui: {
        title: value('Playground'),
      },
    }),
  );
};
