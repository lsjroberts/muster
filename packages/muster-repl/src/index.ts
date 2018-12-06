#!/usr/bin/env node
import * as muster from '@dws/muster';
import identity from 'lodash/identity';
const repl = require('repl');
import runReplCommand from './run-repl-command';
import injectMuster from './utils/inject-muster';
import showReplInformation from './utils/show-repl-information';

showReplInformation();

const musterRepl = repl.start({
  prompt: '> ',
  eval: runReplCommand,
  writer: identity,
});

injectMuster(musterRepl.context);
musterRepl.context.app = muster.default({});
