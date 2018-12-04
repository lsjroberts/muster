import { default as muster, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { toBase64 } from './to-base64';

const ENCODED_STR = 'RmFuY3kgdGV4dCBtZXNzYWdl';

describe('toBase64', () => {
  runScenario({
    description: 'GIVEN a muster graph number and strings',
    graph: () =>
      muster({
        nil: nil(),
        emptyString: value(''),
        someString: value('Fancy text message'),
        num: value(10),
      }),
    operations: [
      operation({
        description: 'WHEN toBase64 is called to encode a string value',
        input: toBase64(ref('someString')),
        expected: value(ENCODED_STR),
      }),
      operation({
        description: 'WHEN toBase64 is called to encode a nil string',
        input: toBase64(ref('nil')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN toBase64 is called to encode an empty string',
        input: toBase64(ref('emptyString')),
        expected: value(''),
      }),
    ],
  });
});
