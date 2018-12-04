import { Muster, sanitizeMetadata } from '@dws/muster';
import { Message, messageListenerDecorator } from '@dws/muster-message-transport';
import { findInstances, FindInstancesCommand } from './client-commands';
import { CommandRunnerState, createCommandRunner } from './command-runner';
import { createDevToolsApp } from './dev-tools-app';
import { removeMusterInstance } from './devtools-commands';

export const MusterClientName = 'muster-client';
export const MusterDevToolsName = 'muster-devtools';

export interface DevToolsClientConfig {
  instanceId: string;
}

export interface DevToolsClientState extends CommandRunnerState {}

const commands = [FindInstancesCommand];

export function withDevTools(instanceId: string, app: Muster): Muster {
  const devToolsApp = createDevToolsApp(app);
  const { app: appWithDevTools } = messageListenerDecorator(devToolsApp, {
    sanitize: sanitizeMetadata,
    listen(callback) {
      const listener = createMessageListener(instanceId, callback);
      window.addEventListener('message', listener);
      return () => {
        window.removeEventListener('message', listener);
      };
    },
    send(message: Message<any>) {
      sendMessage({
        ...message,
        instanceId,
      } as Message<any>);
    },
  });
  let isDisposed = false;
  const state: DevToolsClientState = {};
  const config = {
    instanceId,
  };
  const commandRunner = createCommandRunner(commands, appWithDevTools, sendMessage, config, state);
  const commandRunnerListener = createMessageListener(instanceId, commandRunner.runCommand);
  window.addEventListener('message', commandRunnerListener);
  window.addEventListener('beforeunload', dispose);
  commandRunner.runCommand(findInstances());
  appWithDevTools.disposeCallbacks.push(dispose);
  app.disposeCallbacks.push(() => appWithDevTools.dispose());
  return app;

  function dispose() {
    if (isDisposed) return;
    window.removeEventListener('message', commandRunnerListener);
    window.removeEventListener('beforeunload', dispose);
    // Notify the Muster DevTools about this instance being unloaded
    commandRunner.sendMessage(removeMusterInstance(instanceId));
    isDisposed = true;
  }
}

function createMessageListener(instanceId: string, callback: (msg: Message<any>) => void) {
  return (event: WindowEventMap['message']) => {
    // Don't bother with messages from other window
    if (event.source !== window) return;
    const data = event.data;
    // Only accept messages of correct format (our messages)
    if (typeof data !== 'object' || data === null || data.source !== MusterDevToolsName) {
      return;
    }
    // Check if the message is targeted to a specific instance
    // Verify the instance ID if it is
    if (typeof data.instanceId !== 'undefined' && data.instanceId !== instanceId) return;
    callback(data as Message<any>);
  };
}

function sendMessage(data: Message<any>) {
  window.postMessage(
    {
      ...data,
      source: MusterClientName,
    },
    '*',
  );
}
