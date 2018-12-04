import { computed, otherwise, value, when } from '../..';
import { operation, runScenario } from '../../test';
import { choose } from './choose';

describe('choose()', () => {
  describe('WHEN a choose() node has no otherwise() case specified', () => {
    let fn: () => any;
    beforeEach(() => {
      fn = () => choose([when(value(true), value('foo'))]);
    });
    it('SHOULD throw an error', () => {
      expect(fn).toThrowError(
        [
          'Missing otherwise() node in choose() node',
          ' Received:',
          '  [when({pattern: value(true), value: value("foo")})]',
        ].join('\n'),
      );
    });
  });

  describe('WHEN a choose() node has multiple otherwise() cases specified', () => {
    let fn: () => any;
    beforeEach(() => {
      fn = () =>
        choose([when(value(true), value('foo')), otherwise(value('bar')), otherwise(value('baz'))]);
    });
    it('SHOULD throw an error', () => {
      expect(fn).toThrowError(
        [
          'Multiple otherwise() nodes in choose() node',
          ' Received:',
          '  [when({pattern: value(true), value: value("foo")}), otherwise({value: value("bar")}), otherwise({value: value("baz")})]',
        ].join('\n'),
      );
    });
  });

  runScenario({
    description: 'WHEN a choose() contains no when() cases',
    operations: [
      operation({
        description: 'SHOULD return the fallback value',
        input: choose([otherwise(value('fallback'))]),
        expected: value('fallback'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a choose() contains no matching when() cases',
    operations: [
      operation({
        description: 'SHOULD return the fallback value',
        input: choose([
          when(value(false), value('foo')),
          when(value(false), value('bar')),
          when(value(false), value('baz')),
          when(value(false), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('fallback'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a choose() contains matching when() cases',
    operations: [
      operation({
        description: 'SHOULD return the first matching value',
        input: choose([
          when(value(false), value('foo')),
          when(value(false), value('bar')),
          when(value(true), value('baz')),
          when(value(true), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('baz'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a choose() contains dynamic when() patterns',
    operations: [
      operation({
        description: 'SHOULD return the matching value',
        input: choose([
          when(computed([value(false)], (result) => result), value('foo')),
          when(computed([value(false)], (result) => result), value('bar')),
          when(computed([value(true)], (result) => result), value('baz')),
          when(computed([value(true)], (result) => result), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('baz'),
      }),
    ],
  });
});
