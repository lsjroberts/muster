const codeBlocks = require('gfm-code-blocks');
const flatMap = require('lodash/flatMap');

const EXAMPLE_PREFIX = '$$example-';

function findExamples() {
  const docs = require('../../docs/api/docs.json');
  if (!docs.children) return [];
  return flatMap(docs.children, (pkg) => (
    flatMap(pkg.children, findExamplesInFile)
  )).map((example, index) => ({
    ...example,
    virtualFileName: EXAMPLE_PREFIX + index + '.tsx',
  }));
}

function isExampleFile(fileName) {
  return fileName.startsWith(EXAMPLE_PREFIX);
}

function getExample(fileName, examples) {
  const exampleIndex = parseInt(fileName.substring(EXAMPLE_PREFIX.length));
  return examples[exampleIndex];
}

module.exports = {
  findExamples,
  getExample,
  isExampleFile,
};

function findExamplesInFile(file) {
  if (!file.signatures) return [];
  return flatMap(file.signatures, findExamplesInSignature)
    .map((example, index) => ({
      code: replaceConstWithVar(example),
      originalFileName: file.sources[0].fileName,
      indexInFile: index,
    }));
}

function findExamplesInSignature(signature) {
  if (!signature.comment || !signature.comment.tags) return [];
  const examples = signature.comment.tags
    .filter((tag) => tag.tag === 'example')
    .map((tag) => tag.text);
  return flatMap(examples, extractExampleCode);
}

function extractExampleCode(exampleText) {
  return codeBlocks(exampleText)
    .filter((block) => isSupportedCodeLanguage(block.lang))
    .map((block) => block.code);
}

const supportedLanguages = ['js', 'jsx', 'ts', 'tsx'];
function isSupportedCodeLanguage(lang) {
  return supportedLanguages.includes(lang);
}

function replaceConstWithVar(source) {
  return source.replace(/(^\s*)(const)(\s*)/gm, '$1var$3');
}
