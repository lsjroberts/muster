const { generateDevWebpackConfiguration } = require('./webpack.shared.config');

const webpackConfiguration = generateDevWebpackConfiguration();

module.exports = webpackConfiguration;
