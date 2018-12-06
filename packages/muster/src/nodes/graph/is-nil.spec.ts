import identity from 'lodash/identity';
import muster, { computed, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { isNil } from './is-nil';

describe('isNil()', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        value: value('test'),
        nil: nil(),
      }),
    operations: [
      operation({
        description: 'WHEN called with a value node',
        input: isNil(value(true)),
        expected: value(false),
      }),
      operation({
        description: 'WHEN called with a nil node',
        input: isNil(nil()),
        expected: value(true),
      }),
      operation({
        description: 'WHEN called with a computed that resolves to a value',
        input: isNil(computed([value(true)], identity)),
        expected: value(false),
      }),
      operation({
        description: 'WHEN called with a computed that resolves to a nil',
        input: isNil(computed([value(true)], () => nil())),
        expected: value(true),
      }),
      operation({
        description: 'WHEN called with a ref to a value',
        input: isNil(ref('value')),
        expected: value(false),
      }),
      operation({
        description: 'WHEN called with a ref to a nil',
        input: isNil(ref('nil')),
        expected: value(true),
      }),
    ],
  });
});
