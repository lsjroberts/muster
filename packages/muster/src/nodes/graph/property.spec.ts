import muster, { root, value } from '../..';
import { operation, runScenario } from '../../test';
import createNodeDefinition from '../../utils/create-node-definition';
import { property, PropertyNodeType } from './property';

describe('prop', () => {
  it('SHOULD create correct graph node', () => {
    expect(property(value('test-val'), ['expected', 'prop', 'path'])).toEqual(
      createNodeDefinition(PropertyNodeType, {
        subject: value('test-val'),
        path: ['expected', 'prop', 'path'],
      }),
    );
  });
});

describe('prop integration', () => {
  const testObject = {
    property: 'test value',
    nested: {
      property: 'nested value',
    },
    'name.with.dots': 'other test value',
  };

  describe('WHEN `prop` node is a root of the graph', () => {
    runScenario({
      description: 'AND the query is for a single property using string syntax',
      graph: () => muster(property(value(testObject), 'property')),
      operations: [
        operation({
          description: 'SHOULD return correct value',
          input: root(),
          expected: value('test value'),
        }),
      ],
    });

    runScenario({
      description: 'AND the query is for a single property using array syntax',
      graph: () => muster(property(value(testObject), ['property'])),
      operations: [
        operation({
          description: 'SHOULD return correct value',
          input: root(),
          expected: value('test value'),
        }),
      ],
    });

    runScenario({
      description: 'AND the query is for a nested property',
      graph: () => muster(property(value(testObject), ['nested', 'property'])),
      operations: [
        operation({
          description: 'SHOULD return correct value',
          input: root(),
          expected: value('nested value'),
        }),
      ],
    });

    runScenario({
      description: 'AND the query is for a property with dots using string syntax',
      graph: () => muster(property(value(testObject), 'name.with.dots')),
      operations: [
        operation({
          description: 'SHOULD return correct value',
          input: root(),
          expected: value('other test value'),
        }),
      ],
    });

    runScenario({
      description: 'AND the query is for a property with dots using array syntax',
      graph: () => muster(property(value(testObject), ['name.with.dots'])),
      operations: [
        operation({
          description: 'SHOULD return correct value',
          input: root(),
          expected: value('other test value'),
        }),
      ],
    });

    runScenario({
      description: 'AND the query attempts to access a nested property using dot syntax',
      graph: () => muster(property(value(testObject), 'nested.property')),
      operations: [
        operation({
          description: 'SHOULD return undefined',
          input: root(),
          expected: value(undefined),
        }),
      ],
    });
  });
});
