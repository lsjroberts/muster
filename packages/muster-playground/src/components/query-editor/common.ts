export const filterKeys = (
  predicate: (key: string) => boolean,
  object: any,
): { [key: string]: any } =>
  Object.keys(object)
    .filter(predicate)
    .reduce((acc, key) => Object.assign(acc, { [key]: object[key] }), {});

export const getLibraryExports = (lib: any, defaultName: string) => {
  const libExports = filterKeys((key) => /^[a-z]/.test(key) && key !== 'default', lib);
  if (lib.default) libExports[defaultName] = lib.default;
  return libExports;
};
