#!/usr/bin/env node
const ts = require('typescript');
const createCompilerHost = require('./create-host');
const { findExamples, getExample, isExampleFile } = require('./find-examples');

// These error codes are false negatives. When we have multiple
// example in one file we will end up having the following error codes,
// but that doesn't mean there is an error in any of the muster packages api.
const IGNORE_ERROR_CODES = {
  '2300': 'Duplicate identifier',
  '2440': 'Import declaration conflicts with local declaration of',
  '1308': 'await expression is only allowed within an async function.',
};

const options = {
  allowSyntheticDefaultImports: true,
  module: ts.ModuleKind.CommonJS,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  target: ts.ScriptTarget.ES2016,
  jsx: 'react',
  types: ['node'],
  forceConsistentCasingInFileNames: true,
  noFallthroughCasesInSwitch: true,
  noImplicitAny: false,
  noImplicitReturns: true,
  noImplicitThis: true,
  noUnusedLocals: false,
  strictNullChecks: true,
  rootDir: `${process.cwd()}`,
};

function getExampleFileName(fileName, examples) {
  if (!isExampleFile(fileName)) return fileName;
  const example = getExample(fileName, examples);
  return example.originalFileName + ', Example #' + (example.indexInFile + 1);
}

function main() {
  const examples = findExamples();
  console.log('Found examples: ', examples.length);
  const moduleSearchLocations = [`${process.cwd()}/packages/`];
  const host = createCompilerHost(examples, options, moduleSearchLocations);
  const program = ts.createProgram(
    [
      `${process.cwd()}/packages/muster/src/definitions.d.ts`,
      ...examples.map((example) => example.virtualFileName)
    ],
    options,
    host,
  );
  const emitResult = program.emit();
  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)
    .filter(d => !IGNORE_ERROR_CODES[d.code]);
  allDiagnostics.forEach(diagnostic => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      console.log(`${getExampleFileName(diagnostic.file.fileName, examples)} (${line + 1},${character + 1}): ${message}`);
    }
    else {
      console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
  });
  const exitCode = allDiagnostics.length > 0 ? 1 : 0;
  console.log(`Process exiting with code '${exitCode}'.`);
  process.exit(exitCode);
}

main();
