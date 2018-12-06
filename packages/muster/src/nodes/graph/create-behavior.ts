import {
  GraphOperation,
  NodeDefinition,
  OperationProperties,
  Params,
  StatelessGraphNode,
  StatelessNodeType,
} from '../../types/graph';
import { getInvalidTypeError, WILDCARD_OPERATION } from '../../utils';
import createNodeDefinition from '../../utils/create-node-definition';
import { createNodeType } from '../../utils/create-node-type';
import * as types from '../../utils/types';
import { error } from './error';
import { getParams } from './tree';

/**
 * An instance of the [[createBehavior]] node.
 * See the [[createBehavior]] documentation to find out more.
 */
export interface CreateBehaviorNode
  extends StatelessGraphNode<'createBehavior', CreateBehaviorNodeProperties> {}

/**
 * A definition of the [[createBehavior]] node.
 * See the [[createBehavior]] documentation to find out more.
 */
export interface CreateBehaviorNodeDefinition
  extends NodeDefinition<'createBehavior', CreateBehaviorNodeProperties> {}

export type OperationFactory = (
  params: Params,
  operationProperties: OperationProperties,
) => NodeDefinition;

export interface CreateBehaviorNodeProperties {
  operations: { [name: string]: OperationFactory };
}

/**
 * Implementation of the [[createBehavior]].
 * See the [[createBehavior]] documentation for more information.
 */
export const CreateBehaviorNodeType: StatelessNodeType<
  'createBehavior',
  CreateBehaviorNodeProperties
> = createNodeType<'createBehavior', CreateBehaviorNodeProperties>('createBehavior', {
  serialize: false,
  deserialize: false,
  shape: {
    operations: types.objectOf(types.saveHash(types.func)),
  },
  operations: {
    [WILDCARD_OPERATION]: {
      run(node: CreateBehaviorNode, operation: GraphOperation): NodeDefinition {
        const operationHandler = node.definition.properties.operations[operation.type.name];
        if (!operationHandler) {
          return error(
            getInvalidTypeError(
              `This createBehavior node does not implement the '${operation.type.name}' operation.`,
              {
                expected: Object.keys(node.definition.properties.operations),
                received: operation.type.name,
              },
            ),
          );
        }
        return operationHandler(getParams(node.context), operation.properties);
      },
    },
  },
});

export function createBehavior(operations: {
  [name: string]: OperationFactory;
}): CreateBehaviorNodeDefinition {
  return createNodeDefinition(CreateBehaviorNodeType, {
    operations,
  });
}

export function isCreateBehaviorNodeDefinition(
  value: NodeDefinition,
): value is CreateBehaviorNodeDefinition {
  return value.type === CreateBehaviorNodeType;
}
