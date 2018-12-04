import { getCurrentBrowser } from '../utils/get-current-browser';
import Port = chrome.runtime.Port;

const connections: { [key: string]: Port } = {};

getCurrentBrowser().runtime.onMessage.addListener((request: any, sender: any) => {
  if (!sender.tab) {
    console.log('sender.tab not defined.');
    return true;
  }
  const tabId = `${sender.tab.id}`;
  if (tabId in connections) {
    connections[tabId].postMessage(request);
  } else {
    console.log('Tab not found in connection list.');
  }
  return true;
});

getCurrentBrowser().runtime.onConnect.addListener((port: Port) => {
  const extensionListener = (request: any, port: Port) => {
    // Register initial connection
    if (request.name === 'init') {
      connections[request.tabId] = port;
      port.onDisconnect.addListener(() => {
        delete connections[request.tabId];
      });
      return;
    }
    // Otherwise, broadcast to the tab
    getCurrentBrowser().tabs.sendMessage(request.tabId, {
      ...request,
      source: 'muster-devtools',
    });
  };
  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);
  // Make sure to dispose the listener when the connection drops
  port.onDisconnect.addListener((port) => {
    port.onMessage.removeListener(extensionListener);
    const connectionKey = Object.keys(connections).find((key) => connections[key] === port);
    if (connectionKey) {
      delete connections[connectionKey];
    }
  });
});
