const CopyWebpackPlugin = require('copy-webpack-plugin');
const baseConfig = require('./webpack.config');

module.exports = {
  ...baseConfig,
  entry: './src/ui/index.dev.tsx',
  output: {
    ...baseConfig.output,
    filename: 'ui.js',
  },
  plugins: [
    new CopyWebpackPlugin([{ from: 'public/panel.html', to: 'index.html' }]),
    ...baseConfig.plugins,
  ],
};
