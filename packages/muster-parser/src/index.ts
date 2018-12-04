import * as muster from '@dws/muster';

export interface LibraryExports {
  [key: string]: any;
}

export function parseNodeDefinition(source: string): muster.NodeDefinition {
  try {
    return parseNodeExpression(getLibraryExports(muster, 'muster'), source.trim());
  } catch (e) {
    return muster.error(e);
  }
}

function parseNodeExpression(library: LibraryExports, source: string): muster.NodeDefinition {
  const libraryExportNames = Object.keys(library);
  const libraryExports = libraryExportNames.map((name) => library[name]);
  // tslint:disable-next-line:no-function-constructor-with-string-args
  return muster.toNode(new Function(...libraryExportNames, `return ${source}`)(...libraryExports));
}

function getLibraryExports(lib: any, defaultName: string): LibraryExports {
  const libExports = Object.keys(lib)
    .filter((key) => /^[a-z]/.test(key) && key !== 'default')
    .reduce((acc, key) => Object.assign(acc, { [key]: lib[key] }), {} as LibraryExports);
  if (lib.default) {
    libExports[defaultName] = lib.default;
  }
  return libExports;
}
