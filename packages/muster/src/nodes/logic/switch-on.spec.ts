import { computed, lte, otherwise, pattern, value, when } from '../..';
import { operation, runScenario } from '../../test';
import { switchOn } from './switch-on';

describe('switchOn()', () => {
  describe('WHEN a switchOn() node has no otherwise() case specified', () => {
    let fn: () => any;
    beforeEach(() => {
      fn = () => switchOn(value(true), [when(value(true), value('foo'))]);
    });
    it('SHOULD throw an error', () => {
      expect(fn).toThrowError(
        [
          'Missing otherwise() node in switchOn() node',
          ' Received:',
          '  [when({pattern: value(true), value: value("foo")})]',
        ].join('\n'),
      );
    });
  });

  describe('WHEN a switchOn() node has multiple otherwise() cases specified', () => {
    let fn: () => any;
    beforeEach(() => {
      fn = () =>
        switchOn(value(true), [
          when(value(true), value('foo')),
          otherwise(value('bar')),
          otherwise(value('baz')),
        ]);
    });
    it('SHOULD throw an error', () => {
      expect(fn).toThrowError(
        [
          'Multiple otherwise() nodes in switchOn() node',
          ' Received:',
          '  [when({pattern: value(true), value: value("foo")}), otherwise({value: value("bar")}), otherwise({value: value("baz")})]',
        ].join('\n'),
      );
    });
  });

  runScenario({
    description: 'WHEN a switchOn() contains no when() cases',
    operations: [
      operation({
        description: 'SHOULD return the fallback value',
        input: switchOn(value(true), [otherwise(value('fallback'))]),
        expected: value('fallback'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a switchOn() contains no matching when() cases',
    operations: [
      operation({
        description: 'SHOULD return the fallback value',
        input: switchOn(value(true), [
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
    description: 'WHEN a switchOn() contains matching when() cases',
    operations: [
      operation({
        description: 'SHOULD return the first matching value',
        input: switchOn(value('three'), [
          when(value('one'), value('foo')),
          when(value('two'), value('bar')),
          when(value('three'), value('baz')),
          when(value('four'), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('baz'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a switchOn() contains dynamic when() values',
    operations: [
      operation({
        description: 'SHOULD return the matching value',
        input: switchOn(value('three'), [
          when(computed([value('one')], (result) => result), value('foo')),
          when(computed([value('two')], (result) => result), value('bar')),
          when(computed([value('three')], (result) => result), value('baz')),
          when(computed([value('four')], (result) => result), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('baz'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a switchOn() contains dynamic when() pattern match expressions',
    operations: [
      operation({
        description: 'SHOULD return the matching value',
        input: switchOn(value(3), [
          when(pattern((_) => lte(_, 1)), value('foo')),
          when(pattern((_) => lte(_, 2)), value('bar')),
          when(pattern((_) => lte(_, 3)), value('baz')),
          when(pattern((_) => lte(_, 4)), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('baz'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a switchOn() contains matching static and dynamic when() patterns',
    operations: [
      operation({
        description: 'SHOULD return the first matching value',
        input: switchOn(value(3), [
          when(pattern((_) => lte(_, 1)), value('foo')),
          when(pattern((_) => lte(_, 2)), value('bar')),
          when(pattern((_) => lte(_, 3)), value('baz')),
          when(value(3), value('uh-oh')),
          when(pattern((_) => lte(_, 4)), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('baz'),
      }),
    ],
  });

  runScenario({
    description: 'WHEN a switchOn() contains no matching dynamic when() patterns',
    operations: [
      operation({
        description: 'SHOULD return the fallback value',
        input: switchOn(value(5), [
          when(pattern((_) => lte(_, 1)), value('foo')),
          when(pattern((_) => lte(_, 2)), value('bar')),
          when(pattern((_) => lte(_, 3)), value('baz')),
          when(pattern((_) => lte(_, 4)), value('qux')),
          otherwise(value('fallback')),
        ]),
        expected: value('fallback'),
      }),
    ],
  });
});
