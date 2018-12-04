module.exports = {
  manifest_version: 2,
  name: 'Muster DevTools',
  description:
    'A DevTools extension for inspecting and debugging applications made with the Muster framework',
  version: '0.0.1',
  content_security_policy: 'script-src \'self\' \'unsafe-eval\'; object-src \'self\'',
  permissions: ['<all_urls>'],
  devtools_page: 'index.html',
  background: {
    scripts: ['background.js'],
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['client.js'],
      run_at: 'document_start',
      all_frames: true,
    },
  ],
};
