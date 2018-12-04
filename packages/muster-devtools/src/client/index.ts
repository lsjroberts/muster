import { getCurrentBrowser } from '../utils/get-current-browser';

window.addEventListener('message', (event) => {
  // Only accept messages from same frame
  if (event.source !== window) return;
  const msg = event.data;
  // Only accept messages from the Muster Client
  if (typeof msg !== 'object' || msg === null || msg.source !== 'muster-client') {
    return;
  }
  getCurrentBrowser().runtime.sendMessage(msg);
});

getCurrentBrowser().runtime.onMessage.addListener((request: any) => {
  if (request.source !== 'muster-devtools') return;
  window.postMessage(request, '*');
});
