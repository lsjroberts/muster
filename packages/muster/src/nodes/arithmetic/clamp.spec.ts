import muster, { nil, value } from '../..';
import { operation, runScenario } from '../../test';
import { clamp } from './clamp';

describe('clamp()', () => {
  runScenario({
    description: 'GIVEN an empty muster instance',
    graph: () => muster(nil()),
    operations: [
      operation({
        description: 'WHEN value is within range (integer)',
        input: clamp(7, { min: 2, max: 10 }),
        expected: value(7),
      }),
      operation({
        description: 'WHEN value is equal to the min range (integer)',
        input: clamp(2, { min: 2, max: 10 }),
        expected: value(2),
      }),
      operation({
        description: 'WHEN value is equal to the max range (integer)',
        input: clamp(10, { min: 2, max: 10 }),
        expected: value(10),
      }),
      operation({
        description: 'WHEN value is below the min range (integer)',
        input: clamp(0, { min: 2, max: 10 }),
        expected: value(2),
      }),
      operation({
        description: 'WHEN value is above the max range (integer)',
        input: clamp(11, { min: 2, max: 10 }),
        expected: value(10),
      }),
      operation({
        description: 'WHEN value is within range (float)',
        input: clamp(5.2, { min: 5, max: 6 }),
        expected: value(5.2),
      }),
      operation({
        description: 'WHEN value is equal to the min range (float)',
        input: clamp(5.0, { min: 5, max: 6 }),
        expected: value(5),
      }),
      operation({
        description: 'WHEN value is equal to the max range (float)',
        input: clamp(6.0, { min: 5, max: 6 }),
        expected: value(6),
      }),
      operation({
        description: 'WHEN value is below the min range (float)',
        input: clamp(4.9, { min: 5, max: 6 }),
        expected: value(5),
      }),
      operation({
        description: 'WHEN value is above the max range (float)',
        input: clamp(6.1, { min: 5, max: 6 }),
        expected: value(6),
      }),
    ],
  });
});
