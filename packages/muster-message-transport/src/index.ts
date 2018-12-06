import { GraphOperation, NodeDefinition } from '@dws/muster';

export * from './message-listener-decorator';
export * from './message-transport-middleware';
export * from './messages';

export interface Message<T extends string> {
  name: T;
}

export type MessageCallback = (message: Message<any>) => void;
export type DisposeListener = () => void;

export interface TransportOptions {
  listen: (callback: MessageCallback) => DisposeListener;
  send: (message: Message<any>) => void;
  sanitize?: (value: NodeDefinition | GraphOperation) => any;
}
