import { getCurrentBrowser } from './utils/get-current-browser';

// Create Muster DevTools panel
getCurrentBrowser().devtools.panels.create('Muster', 'images/muster.png', 'panel.html');
