import { GraphOperation, NodeType, OperationType } from '@dws/muster';
import { GlobalRootNodeType } from './global-root';
import { InjectedNodeType } from './injected';
import { PropNodeType } from './prop';

export {
  globalRoot,
  GlobalRootNode,
  GlobalRootNodeDefinition,
  GlobalRootNodeProperties,
  GlobalRootNodeType,
  isGlobalRootNodeDefinition,
} from './global-root';
export {
  injected,
  InjectedNode,
  InjectedNodeDefinition,
  InjectedNodeProperties,
  InjectedNodeType,
  isInjectedNodeDefinition,
} from './injected';
export {
  isPropNodeDefinition,
  prop,
  PropNode,
  PropNodeDefinition,
  PropNodeProperties,
  PropNodeType,
} from './prop';

export default [GlobalRootNodeType, InjectedNodeType, PropNodeType] as Array<
  NodeType<string, {}, any, any, {}, OperationType['name'], GraphOperation<OperationType['name']>>
>;
