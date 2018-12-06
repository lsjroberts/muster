import { BehaviorSubject } from '@dws/muster-observable';
import muster, { match, NodeDefinition, ref, tree, types, value } from '../..';
import { operation, runScenario } from '../../test';
import { fromStream } from './from-stream';

describe('fromStream()', () => {
  let subject: BehaviorSubject<any>;

  runScenario({
    description: 'GIVEN a graph containing a fromStream node that emits a string',
    before() {
      subject = new BehaviorSubject<string>('initial');
    },
    graph: () =>
      muster({
        name: fromStream(subject),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the name for the first time',
        input: ref('name'),
        expected: value('initial'),
        operations: (subscriber) => [
          operation({
            description: 'AND the subject emits a string',
            before() {
              jest.clearAllMocks();
              subject.next('updated');
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('updated'));
            },
          }),
        ],
      }),
    ],
  });

  runScenario({
    description: 'GIVEN a graph containing a fromStream node that emits a tree',
    before() {
      subject = new BehaviorSubject<NodeDefinition>(
        tree({
          name: value('Bob'),
        }),
      );
    },
    graph: () =>
      muster({
        user: fromStream(subject),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the name of the user',
        input: ref('user', 'name'),
        expected: value('Bob'),
        operations: (subscriber) => [
          operation({
            description: 'AND the subject emits a new tree',
            before() {
              jest.clearAllMocks();
              subject.next(
                tree({
                  name: value('Jane'),
                }),
              );
            },
            assert() {
              expect(subscriber().next).toHaveBeenCalledTimes(1);
              expect(subscriber().next).toHaveBeenCalledWith(value('Jane'));
            },
          }),
        ],
      }),
    ],
  });

  let subjectsMap: { [key: string]: BehaviorSubject<string> };
  runScenario({
    description: 'GIVEN a graph containing a fromStream node that emits a string (factory)',
    before() {
      subjectsMap = {};
    },
    graph: () =>
      muster({
        [match(types.string, 'name')]: fromStream(({ name }) => {
          const subject = new BehaviorSubject<string>(name);
          subjectsMap[name] = subject;
          return subject;
        }),
      }),
    operations: [
      operation({
        description: 'WHEN requesting the value of "Jane"',
        input: ref('Jane'),
        expected: value('Jane'),
        operations: (subscriberJane) => [
          operation({
            description: 'AND then the value of "Josh"',
            input: ref('Josh'),
            expected: value('Josh'),
            operations: (subscriberJosh) => [
              operation({
                description: 'AND the "Jane" emits a new value',
                before() {
                  jest.clearAllMocks();
                  subjectsMap['Jane'].next('Amy');
                },
                assert() {
                  expect(subscriberJane().next).toHaveBeenCalledTimes(1);
                  expect(subscriberJane().next).toHaveBeenCalledWith(value('Amy'));
                  expect(subscriberJosh().next).not.toHaveBeenCalled();
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });
});
