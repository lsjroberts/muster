module.exports = {
  name: 'Muster',
  mode: 'modules',
  json: 'docs/api/docs.json',
  theme: 'default',
  ignoreCompilerErrors: true,
  preserveConstEnums: true,
  exclude: ['**/*.spec.ts*', '**/muster-playground/**/*', '**/muster-devtools*/**/*'],
  'external-modulemap': '.*packages/(muster[^/]*)/src/.*',
  stripInternal: true,
  excludeExternals: true,
  excludeProtected: true,
  excludePrivate: true,
  target: 'es6',
  hideGenerator: true
};
