const { generateBuildWebpackConfiguration } = require('./webpack.shared.config');

module.exports = function(env = { production: true }) {
  return generateBuildWebpackConfiguration(env);
};
