import { MusterEvent, MusterEventName, MusterEventPayload } from '../types/graph';

export default function createEvent(
  type: MusterEventName,
  payload: MusterEventPayload,
): MusterEvent {
  return { type, payload };
}
