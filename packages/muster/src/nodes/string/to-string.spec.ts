import { default as muster, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { toString } from './to-string';

describe('toString', () => {
  runScenario({
    description: 'GIVEN a muster graph',
    graph: () =>
      muster({
        helloWorld: value('Hello world!'),
        null: value(null),
        undefined: value(undefined),
        num: value(10),
        obj: value({}),
        nil: nil(),
      }),
    operations: [
      operation({
        description: 'WHEN toString is called with a string value',
        input: toString(ref('helloWorld')),
        expected: value('Hello world!'),
      }),
      operation({
        description: 'WHEN toString is called with a numeric value',
        input: toString(ref('num')),
        expected: value('10'),
      }),
      operation({
        description: 'WHEN toString is called with a null value',
        input: toString(ref('null')),
        expected: value(''),
      }),
      operation({
        description: 'WHEN toString is called with a undefined value',
        input: toString(ref('undefined')),
        expected: value(''),
      }),
      operation({
        description: 'WHEN toString is called with a nil node',
        input: toString(ref('nil')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN toString is called with an obj value',
        input: toString(ref('obj')),
        expected: value('[object Object]'),
      }),
    ],
  });
});
