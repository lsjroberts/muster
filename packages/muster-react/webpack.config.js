const path = require('path');
const merge = require('lodash/merge');

const baseConfig = require('../webpack.shared.config');

const config = merge(baseConfig, {
  entry: {
    'muster-react.umd.min': './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, '_bundles'),
    library: 'muster-react',
  },
});
// ts-loader context
config.module.rules[0].use[1].options.context = __dirname;

module.exports = config;
