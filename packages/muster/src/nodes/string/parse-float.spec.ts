import muster, { nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { parseFloat } from './parse-float';

describe('parseInt', () => {
  runScenario({
    description: 'GIVEN a muster graph containing strings',
    graph: () =>
      muster({
        nil: nil(),
        someString: value('Fancy text message'),
        fourString: value('4'),
        threeAndAHalf: value('3.5'),
      }),
    operations: [
      operation({
        description: 'WHEN parseInt is requested for 4',
        input: parseFloat(ref('fourString')),
        expected: value(4),
      }),
      operation({
        description: 'WHEN parseInt is called for "3.5"',
        input: parseFloat(ref('threeAndAHalf')),
        expected: value(3.5),
      }),
      operation({
        description: 'WHEN parseInt is requested for a non numeric string',
        input: parseFloat(ref('someString')),
        expected: value(NaN),
      }),
      operation({
        description: 'WHEN parseInt is requested for nil node',
        input: parseFloat(ref('nil')),
        expected: value(undefined),
      }),
    ],
  });
});
