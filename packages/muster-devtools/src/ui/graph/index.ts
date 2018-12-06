import muster, {
  action,
  arrayList,
  computed,
  entries,
  error,
  ifElse,
  match,
  param,
  proxy,
  push,
  query,
  ref,
  removeItemAt,
  reset,
  set,
  some,
  types,
  variable,
} from '@dws/muster';
import { MusterClientName, withDevTools } from '@dws/muster-devtools-client';
import { Message, messageTransportMiddleware } from '@dws/muster-message-transport';
import { connection, connectToClient, sendMessageWithTabId } from '../client';
import { navigation } from './navigation';

export function createGraph() {
  const instance = withDevTools(
    'Muster DevTools',
    muster({
      navigation,
      client: {
        [match(types.string, 'instanceId')]: computed([param('instanceId')], (instanceId) =>
          ifElse({
            if: some(ref('instancesIds'), instanceId),
            then: proxy([
              messageTransportMiddleware({
                listen(callback) {
                  connection.onMessage.addListener(onMessage);
                  return () => {
                    connection.onMessage.removeListener(onMessage);
                  };

                  function onMessage(message: any) {
                    // Check the source and instance ID of the message
                    if (message.source !== MusterClientName || message.instanceId !== instanceId) {
                      return;
                    }
                    callback(message);
                  }
                },
                send(message) {
                  sendMessageWithTabId({
                    ...message,
                    instanceId,
                  } as Message<any>);
                },
              }),
            ]),
            else: error(`Instance ${instanceId} does not exist.`),
          }),
        ),
      },
      instancesIds: arrayList([]),
      selectedInstanceId: variable(undefined),
      addInstance: action(function*(instanceId: string) {
        yield push(ref('instancesIds'), instanceId);
      }),
      removeInstanceById: action(function*(instanceId) {
        const existingIds: Array<string> = yield query(ref('instancesIds'), entries());
        const instanceIndex = existingIds.indexOf(instanceId);
        if (instanceIndex === -1) return;
        const selectedInstanceId = yield ref('selectedInstanceId');
        if (selectedInstanceId === instanceId) {
          yield set('selectedInstanceId', undefined);
        }
        yield removeItemAt(ref('instancesIds'), instanceIndex);
        yield reset(ref('graphMetadata', instanceId));
      }),
    }),
  );
  connectToClient(instance);
  return instance;
}
