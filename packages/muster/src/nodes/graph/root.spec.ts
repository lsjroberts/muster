import muster, { isRootNodeDefinition, ref, root, tree, value } from '../..';
import { operation, runScenario } from '../../test';

describe('root', () => {
  describe('RootNodeType', () => {
    describe('WHEN calling `.is`', () => {
      describe('AND it is valid', () => {
        it('SHOULD return true', () => {
          expect(isRootNodeDefinition(root())).toBe(true);
        });
      });

      describe('AND it is not valid', () => {
        it('SHOULD return false', () => {
          expect(isRootNodeDefinition({} as any)).toBe(false);
        });
      });
    });
  });

  describe('integration', () => {
    runScenario(() => {
      const graphRoot = value('foo');

      return {
        description: 'GIVEN a graph with a root() node at the root',
        graph: () => muster(graphRoot),
        operations: [
          operation({
            description: 'SHOULD return the root of the graph',
            input: root(),
            expected: graphRoot,
          }),
        ],
      };
    });

    runScenario(() => {
      const graphRoot = tree({
        foo: root(),
      });

      return {
        description: 'GIVEN a graph with a root() node under a `foo` branch',
        graph: () => muster(graphRoot),
        operations: [
          operation({
            description: 'SHOULD return the root of the graph',
            input: ref('foo'),
            expected: graphRoot,
          }),
        ],
      };
    });
  });
});
