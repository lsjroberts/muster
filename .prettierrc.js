module.exports = {
  arrowParens: 'always',
  printWidth: 100,
  proseWrap: 'preserve',
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 68,
        useTabs: false,
        trailingComma: 'all',
      },
    },
  ],
};
