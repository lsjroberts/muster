import fromPairs from 'lodash/fromPairs';
import {
  context,
  ContextNodeDefinition,
  FnNodeDefinition,
  FnNodeType,
  NamedFnArgs,
} from '../nodes/graph';
import { NodeDefinition } from '../types';
import createNodeDefinition from '../utils/create-node-definition';

export function mockFn(
  factory: ((...args: Array<ContextNodeDefinition>) => NodeDefinition),
): FnNodeDefinition;
export function mockFn(
  argNames: Array<string>,
  factory: ((args: NamedFnArgs) => NodeDefinition),
): FnNodeDefinition;
export function mockFn(
  ...options:
    | [Array<string>, ((args: NamedFnArgs) => NodeDefinition)]
    | [((...args: Array<ContextNodeDefinition>) => NodeDefinition)]
): FnNodeDefinition {
  // fn(factory: ((...args: Array<ContextNodeDefinition>) => NodeDefinition)): FnNodeDefinition;
  if (options.length === 1) {
    const [factory] = options;
    const argIds = Array(factory.length).fill(expect.any(String));
    return createNodeDefinition(FnNodeType, {
      argIds,
      body: factory(...argIds.map(context)),
      hasNamedArgs: false,
    });
  }
  // fn(argNames: Array<string>, factory: ((args: NamedFnArgs) => NodeDefinition)): FnNodeDefinition
  const [argNames, factory] = options;
  const args = fromPairs(argNames.map((name) => [name, context(`$$named-arg:${name}`)]));
  return createNodeDefinition(FnNodeType, {
    argIds: argNames,
    body: factory(args),
    hasNamedArgs: true,
  });
}
