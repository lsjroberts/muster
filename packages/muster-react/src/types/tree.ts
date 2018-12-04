import { createMatcher, getInvalidTypeError, isMatcher, Matcher, types } from '@dws/muster';
import mapValues from 'lodash/mapValues';
import { sanitizeMatcher } from '../utils/sanitize-matcher';

export type TreeFields<T> = { [key in keyof T]: Matcher<T[key], any> };

export type TreeProps<T> = { [key in keyof T]: Matcher<T[key], any> | boolean };

export type TreeMatcher<T> = Matcher<T, TreeFields<T>>;

/**
 * Creates a matcher used as part of the `props` section of the [[container]] and [[simpleContainer]].
 * This matcher informs Muster that a given prop is a tree, and that Muster should get some children from it.
 * The [[tree]] matcher is implicitly created by Muster React when defining props as a nested JS object:
 * ```js
 * import { container } from '@dws/muster-react';
 *
 * container({
 *   graph: {
 *     user: {
 *       firstName: 'Bob',
 *       lastName: 'Smith',
 *     },
 *   },
 *   props: {
 *     user: {
 *       firstName: true,
 *       lastName: true,
 *     },
 *   },
 * });
 * ```
 * is equivalent to:
 * ```js
 * import { container, propTypes, types } from '@dws/muster-react';
 *
 * container({
 *   graph: {
 *     user: {
 *       firstName: 'Bob',
 *       lastName: 'Smith',
 *     },
 *   },
 *   props: {
 *     user: propTypes.tree({
 *       firstName: propTypes.getter(types.any),
 *       lastName: propTypes.getter(types.any),
 *     }),
 *   },
 * });
 * ```
 * As you see the first syntax is much shorter, while still expressing the same set of props.
 * The [[tree]] prop can also be nested to access some deeply nested properties:
 * ```js
 * import { container } from '@dws/muster-react';
 *
 * container({
 *   graph: {
 *     applicationData: {
 *       user: {
 *         firstName: 'Bob',
 *         lastName: 'Smith',
 *       },
 *     }
 *   },
 *   props: {
 *     applicationData: {
 *       user: {
 *         firstName: true,
 *         lastName: true,
 *       },
 *     }
 *   },
 * });
 * ```
 */
export function tree<T>(shape: TreeProps<T>): TreeMatcher<T> {
  const shapeKeys = Object.keys(shape);
  const fields = mapValues(shape, (field) => {
    if (
      !field ||
      field === null ||
      (!isMatcher(field) && (typeof field !== 'boolean' || field !== true))
    ) {
      throw getInvalidTypeError('Invalid container prop type.', {
        expected: [
          'Matcher<any>',
          'getter()',
          'setter()',
          'caller()',
          'list()',
          'tree()',
          'defer()',
          'isLoading()',
          'true',
        ],
        received: field,
      });
    }
    return sanitizeMatcher(field === true ? types.any : field);
  }) as TreeFields<T>;
  const matcher = createMatcher(
    'tree',
    (value: any) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      return (
        Object.keys(value).every((key: string) => Boolean((fields as any)[key])) &&
        shapeKeys.every((key: string) => (fields as any)[key](value[key]))
      );
    },
    fields,
  );
  matcher.metadata.type = tree;
  return matcher;
}

export function isTreeMatcher(value: any): value is TreeMatcher<any> {
  return isMatcher(value) && value.metadata.type === tree;
}
