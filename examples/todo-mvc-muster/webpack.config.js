const HtmlWebpackPlugin = require('html-webpack-plugin');
const template = require('html-webpack-template');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'TodoMVC Muster',
      inject: false,
      template,
      appMountId: 'root',
    }),
  ],
};
