import { isGraphNode, NodeDefinition } from '../../../types/graph';
import withScopeFrom from '../../../utils/with-scope-from';
import { done, DoneNode, DoneNodeType } from '../../graph/done';
import { resolve } from '../../graph/resolve';
import { value, ValueNode, ValueNodeDefinition } from '../../graph/value';
import { isValidReducerStepResult } from '../reduce';

export default function withReducerState(state: any, target: NodeDefinition): NodeDefinition {
  return resolve(
    [{ target, until: isValidReducerStepResult }],
    ([innerValue]: [ValueNode<any> | DoneNode]) =>
      withScopeFrom(
        innerValue,
        DoneNodeType.is(innerValue)
          ? done(
              value([
                ((isGraphNode(innerValue.definition.properties.value)
                  ? innerValue.definition.properties.value.definition
                  : innerValue.definition.properties.value) as ValueNodeDefinition<any>).properties
                  .value,
                state,
              ]),
            )
          : value([innerValue.definition.properties.value, state]),
      ),
  );
}
