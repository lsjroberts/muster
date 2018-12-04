const typescript = require('typescript');
const path = require('path');
const { getExample, isExampleFile } = require('./find-examples');

const checkForCoreModules = (moduleName) => moduleName === '@dws/muster';

const createCompilerHost = (examples, options, moduleSearchLocations) => {
  const fileExists = (fileName) => (
    isExampleFile(fileName)
      ? true
      : typescript.sys.fileExists(fileName)
  );
  const readFile = (fileName) => {
    if (!isExampleFile(fileName)) {
      return typescript.sys.readFile(fileName);
    }
    return getExample(fileName, examples).code;
  };

  const getSourceFile = (fileName, languageVersion, onError) => {
    const sourceText = readFile(fileName);
    return typescript.createSourceFile(fileName, sourceText, languageVersion);
  };

  const resolveModuleNames = (moduleNames, containingFile) => (
    moduleNames.reduce((acc, moduleName) => {
      if(checkForCoreModules(moduleName)) {
        moduleName = `${process.cwd()}/node_modules/${moduleName}`;
      }
      const result = typescript.resolveModuleName(moduleName, containingFile, options, {fileExists, readFile});
      if (result.resolvedModule) {
        return [...acc, result.resolvedModule];
      }
      return [
        ...acc,
        ...moduleSearchLocations.map((location) => {
          const modulePath = path.join(location, moduleName + '.d.ts');
          return fileExists(modulePath)
            ? { resolvedFileName: modulePath }
            : null;
        })
      ];
    }, [])
    .filter(Boolean)
  );

  return {
    getSourceFile,
    getDefaultLibFileName: (options) => typescript.getDefaultLibFilePath(options),
    writeFile: (fileName, content) => {},
    getCurrentDirectory: () => typescript.sys.getCurrentDirectory(),
    getDirectories: (path) => typescript.sys.getDirectories(path),
    getCanonicalFileName: fileName => typescript.sys.useCaseSensitiveFileNames
      ? fileName
      : fileName.toLowerCase(),
    getNewLine: () => typescript.sys.newLine,
    useCaseSensitiveFileNames: () => typescript.sys.useCaseSensitiveFileNames,
    fileExists,
    readFile,
    resolveModuleNames,
  };
};

module.exports = createCompilerHost;
