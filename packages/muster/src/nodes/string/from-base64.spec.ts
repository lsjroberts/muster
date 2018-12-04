import { default as muster, nil, ref, value } from '../..';
import { operation, runScenario } from '../../test';
import { fromBase64 } from './from-base64';

const ORIGINAL_STR = 'Fancy text message';

describe('fromBase64', () => {
  runScenario({
    description: 'GIVEN a muster graph number and strings',
    graph: () =>
      muster({
        nil: nil(),
        emptyString: value(''),
        encodedStr: value('RmFuY3kgdGV4dCBtZXNzYWdl'),
        num: value(10),
      }),
    operations: [
      operation({
        description: 'WHEN fromBase64 is called to decode a string value',
        input: fromBase64(ref('encodedStr')),
        expected: value(ORIGINAL_STR),
      }),
      operation({
        description: 'WHEN fromBase64 is called to decode a nil string',
        input: fromBase64(ref('nil')),
        expected: value(undefined),
      }),
      operation({
        description: 'WHEN fromBase64 is called to decode an empty string',
        input: fromBase64(ref('emptyString')),
        expected: value(''),
      }),
    ],
  });
});
