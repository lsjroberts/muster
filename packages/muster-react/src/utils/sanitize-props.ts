import { getInvalidTypeError, isMatcher } from '@dws/muster';
import mapValues from 'lodash/mapValues';
import { Props } from '../container-types';
import { tree, TreeFields, TreeMatcher } from '../types/tree';

export function sanitizeProps<T>(props: Props<T>): TreeMatcher<T> {
  const fields = mapValues(props, (prop) => {
    if (
      !prop ||
      prop === null ||
      (typeof prop !== 'object' && (typeof prop !== 'boolean' || prop !== true) && !isMatcher(prop))
    ) {
      throw getInvalidTypeError('Invalid container prop type.', {
        expected: [
          'Matcher',
          'getter()',
          'setter()',
          'caller()',
          'list()',
          'tree()',
          'defer()',
          'isLoading()',
          'catchError()',
          'true',
        ],
        received: prop,
      });
    }
    return isMatcher(prop) || typeof prop === 'boolean' ? prop : sanitizeProps(prop);
  }) as TreeFields<T>;
  return tree(fields);
}
