const CopyWebpackPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const WebpackExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const path = require('path');

const baseManifest = require('./base-manifest.js');
const pkg = require('./package.json');

module.exports = {
  devtool: 'inline-source-map',
  entry: {
    devtools: './src/devtools.ts',
    background: './src/background/index.ts',
    client: './src/client/index.ts',
    ui: './src/ui/index.tsx',
  },
  mode: 'development',
  stats: 'minimal',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              plugins: ['react-hot-loader/babel'],
            },
          },
          {
            loader: 'ts-loader',
            options: {
              context: __dirname,
              configFile: 'tsconfig.dev.json',
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'public' },
      { from: '../../node_modules/bootstrap/dist', to: 'lib/bootstrap' },
      { from: '../../node_modules/jquery/dist', to: 'lib/jquery' },
    ]),
    new WebpackExtensionManifestPlugin({
      config: {
        base: baseManifest,
        extend: { version: pkg.version }
      }
    })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: "./tsconfig.json"
      }),
    ],
  },
};
