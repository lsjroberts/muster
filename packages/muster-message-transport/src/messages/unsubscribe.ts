import { Message } from '..';

export const UnsubscribeMessageName = 'muster-message-transport-unsubscribe';

export interface UnsubscribeMessage extends Message<'muster-message-transport-unsubscribe'> {
  requestId: string;
}

export function unsubscribe(requestId: string): UnsubscribeMessage {
  return { name: UnsubscribeMessageName, requestId };
}
