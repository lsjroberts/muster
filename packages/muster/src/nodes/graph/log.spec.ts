import muster, { add, nil, value } from '../..';
import { operation, runScenario } from '../../test';
import getType from '../../utils/get-type';
import { log } from './log';

describe('log', () => {
  const console = window.console;
  let mockConsole: Console | undefined = undefined;

  beforeAll(() => {
    mockConsole = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    Object.assign(window, { console: mockConsole });
  });

  afterAll(() => {
    Object.assign(window, { console });
  });

  runScenario({
    description: 'GIVEN an empty graph',
    graph: () => muster(nil()),
    before: () => {
      jest.clearAllMocks();
    },
    operations: [
      operation({
        description: 'AND a static node is logged',
        input: log(value('foo')),
        expected: value('foo'),
        assert: () => {
          expect(window.console.log).toHaveBeenCalledTimes(1);
          expect(window.console.log).toHaveBeenCalledWith({
            input: getType(value('foo')),
            output: getType(value('foo')),
          });
        },
      }),
      operation({
        description: 'AND a dynamic node is logged',
        input: log(add(value(1), value(2))),
        expected: value(3),
        assert: () => {
          expect(window.console.log).toHaveBeenCalledTimes(1);
          expect(window.console.log).toHaveBeenCalledWith({
            input: getType(add(value(1), value(2))),
            output: getType(value(3)),
          });
        },
      }),
    ],
  });
});
