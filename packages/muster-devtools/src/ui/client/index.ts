import { Muster } from '@dws/muster';
import {
  CommandRunnerState,
  createCommandRunner,
  findInstances,
  MusterClientName,
} from '@dws/muster-devtools-client';
import { Message } from '@dws/muster-message-transport';
import { getCurrentBrowser } from '../../utils/get-current-browser';
import { AddMusterInstanceCommand } from './commands/add-muster-instance';
import { RemoveMusterInstanceCommand } from './commands/remove-muster-instance';

export interface DevToolsConfig {}

export interface DevToolsState extends CommandRunnerState {}

export const connection = getCurrentBrowser().runtime.connect({ name: 'muster-devtools' });
// Send message to the `background` script to register this tab
connection.postMessage({
  name: 'init',
  tabId: getCurrentBrowser().devtools.inspectedWindow.tabId,
});

const commands = [AddMusterInstanceCommand, RemoveMusterInstanceCommand];

export function connectToClient(muster: Muster) {
  const config: DevToolsConfig = {};
  const state: DevToolsState = {};
  const commandRunner = createCommandRunner(commands, muster, sendMessageWithTabId, config, state);
  connection.onMessage.addListener((message) => {
    if (message.source !== MusterClientName) return;
    commandRunner.runCommand(message);
  });
  commandRunner.sendMessage(findInstances());
}

export function sendMessageWithTabId(message: Message<any>) {
  if (message && typeof (message as any).tabId !== 'undefined') {
    console.warn('Message cannot contain `tabId` name as it is a reserved keyword.');
  }
  connection.postMessage({
    ...message,
    tabId: getCurrentBrowser().devtools.inspectedWindow.tabId,
  });
}
