import { location, toNode } from '@dws/muster';

export const navigation = toNode({
  location: location({ hash: 'hashbang' }),
});
