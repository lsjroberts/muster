import { SerializedNodeDefinition } from '@dws/muster';
import { Message } from '..';

export const SubscribeMessageName = 'muster-message-transport-subscribe';

export interface SubscribeMessage extends Message<'muster-message-transport-subscribe'> {
  query: SerializedNodeDefinition;
  requestId: string;
}

export function subscribe(requestId: string, query: SerializedNodeDefinition): SubscribeMessage {
  return { name: SubscribeMessageName, requestId, query };
}
