import mapKeys from 'lodash/mapKeys';
import mapValues from 'lodash/mapValues';
import uniqueId from 'lodash/uniqueId';
import { context } from '../nodes/graph/context';
import { scope, ScopeNodeDefinition } from '../nodes/graph/scope';
import { MusterEvent, NodeLike } from '../types/graph';

export type Type = true;
export type ModuleRequirements = { [name: string]: Type };
export type ModuleDependencies = { [name: string]: NodeLike };
export type ModuleFactory = ((dependencies?: ModuleDependencies) => ScopeNodeDefinition);

function generateUniqueContextVariableName(name: string): string {
  return uniqueId(`$$scope:${name}:`);
}

/**
 * A helper function used when creating a self-contained module. The module can declare its
 * requirements, which will have to be satisfied at the time of the module instantiation.
 * This function returns a module factory function. The factory function expects an object, that
 * fulfils all of the declared module requirements.
 *
 * The module has no access to the graph outside of the module. It can only access its own contents
 * and the declared dependencies. It behaves very similar to the [[scope]] (it is based on
 * that node).
 * @param {ModuleRequirements} requirements
 * @param {(dependencies: ModuleDependencies) => GraphNode} factory
 * @param {(event: EventData) => (EventData | undefined)} redispatch
 * @returns {ModuleFactory}
 *
 *
 * @example **Simple module**
 * ```js
 * import muster, { createModule, ref } from '@dws/muster';
 *
 * // No requirements, just the module
 * const userModule = createModule({}, () => ({
 *   name: 'Bob',
 *   age: 29,
 * }));
 *
 * const app = muster({
 *   user: userModule({}),
 * });
 *
 * await app.resolve(ref('user', 'name'));
 * // === 'Bob'
 *
 * await app.resolve(ref('user', 'age'));
 * // === 29
 * ```
 * This example shows how to create a very basic module with no requirements. Such module, when
 * added to the muster graph, can be addressed just like any other graph node.
 *
 *
 * @example **Injecting dependencies**
 * ```js
 * import muster, { computed, createModule, ref } from '@dws/muster';
 *
 * const userModule = createModule({
 *   userId: true,
 * }, ({ userId }) => ({
 *   firstName: computed([userId], (resolvedUserId) => `First name ${resolvedUserId}`),
 *   lastName: computed([userId], (resolvedUserId) => `Last name ${resolvedUserId}`),
 * }));
 *
 * const app = muster({
 *   currentUserId: 1,
 *   user: userModule({
 *     userId: ref('currentUserId'),
 *   }),
 * });
 *
 * await app.resolve(ref('user', 'firstName'));
 * // === 'First name 1'
 *
 * await app.resolve(ref('user', 'lastName'));
 * // === 'Last name 1'
 * ```
 * This example shows how to create a module that has a requirement. This requirement is then
 * satisfied using a ref to a `currentUserId`.
 */
export default function createModule(
  requirements: ModuleRequirements,
  factory: (dependencies: ModuleDependencies) => NodeLike,
  redispatch?: (event: MusterEvent) => MusterEvent | undefined,
): ModuleFactory {
  return (dependencies: ModuleDependencies = {}) => {
    Object.keys(requirements).forEach((dependencyId) => {
      if (!(dependencyId in dependencies)) {
        throw new Error(`Missing module dependency: ${JSON.stringify(dependencyId)}`);
      }
    });
    Object.keys(dependencies).forEach((dependencyId) => {
      if (!(dependencyId in requirements)) {
        throw new Error(`Unexpected module dependency: ${JSON.stringify(dependencyId)}`);
      }
    });
    const contextNames = mapValues(dependencies, (node: NodeLike, dependencyId: string) =>
      generateUniqueContextVariableName(dependencyId),
    );
    const contextNodes = mapValues(contextNames, (contextName: string) => context(contextName));
    return scope(
      factory(contextNodes),
      mapKeys(dependencies, (node: NodeLike, name: string) => contextNames[name]),
      redispatch,
    );
  };
}
