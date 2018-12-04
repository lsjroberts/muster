import * as muster from '@dws/muster';
import difference from 'lodash/difference';
const Module = require('module');
const fs = require('mz/fs');
const untildify = require('untildify');
const vm = require('vm');
import { Command, CommandOutput, ReplState } from '../types';
import { formatString } from '../utils/formats';
import injectMuster from '../utils/inject-muster';

function getLoadRegex() {
  return /^load\s+(.*)$/gi;
}

async function loadModule(sourcePath: string): Promise<muster.Muster | undefined> {
  const cachedModules = Object.keys(require.cache);
  const scopedModule = Object.assign(new Module(sourcePath), { filename: sourcePath });
  const sourceCode = await fs.readFile(sourcePath, 'utf8');
  const context: any = injectMuster(vm.createContext());
  Object.defineProperty(context, 'require', {
    configurable: false,
    enumerable: true,
    value: (name: string) => {
      if (name === '@dws/muster') return muster;
      return scopedModule.require(name);
    },
  });
  context.module = {
    exports: {},
  };
  vm.runInContext(sourceCode, context, { filename: sourcePath });
  const cachedKeysToRemove = difference(Object.keys(require.cache), cachedModules);
  cachedKeysToRemove.forEach((key) => {
    delete require.cache[key];
  });
  const exports = context.module.exports;
  if (!exports) return undefined;
  if (exports.default instanceof muster.Muster) return exports.default;
  if (exports instanceof muster.Muster) return exports;
  return undefined;
}

const loadCommand: Command = {
  isMatch(input: string): boolean {
    return getLoadRegex().test(input);
  },
  async evaluate(input: string, context: any, state: ReplState): Promise<CommandOutput> {
    const filePath = getLoadRegex().exec(input)![1];
    const absoluteFilePath = untildify(filePath);
    if (!(await fs.exists(absoluteFilePath))) {
      return {
        error: `Cannot load muster graph: File "${absoluteFilePath}" does not exist.`,
      };
    }
    let musterApp: muster.Muster | undefined;
    try {
      musterApp = await loadModule(absoluteFilePath);
    } catch (ex) {
      return {
        error: ex,
      };
    }
    if (!musterApp) {
      return {
        error: `Cannot load muster graph: File "${absoluteFilePath}" does not export muster graph.`,
      };
    }
    context.app = musterApp;
    return {
      result: formatString('Loaded muster instance.'),
      state: {
        ...state,
        subscriptions: [],
      },
    };
  },
};

export default loadCommand;
