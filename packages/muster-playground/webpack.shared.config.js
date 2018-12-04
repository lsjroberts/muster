const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const template = require('html-webpack-template');
const path = require('path');
const webpack = require('webpack');
const version = require('@dws/muster-version');

const REACT_URL = {
  production: 'https://cdnjs.cloudflare.com/ajax/libs/react/16.4.2/umd/react.production.min.js',
};
const REACT_DOM_URL = {
  production:
    'https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.4.2/umd/react-dom.production.min.js',
};
const BABEL_STANDALONE_URL = {
  production: 'https://unpkg.com/babel-standalone/babel.min.js'
};
const MONACO_URL = {
  production: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.14.3/min/',
};

function _generateBaseWebpackConfiguration(isProduction) {
  const htmlTemplateOptions = {
    appMountId: 'app',
    favicon: false,
    lang: 'en',
    title: 'Muster Playground',
    cache: true,
    chunks: true,
    chunksSortMode: 'auto',
    inject: false,
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
    template,
    window: {},
    excludeChunks: ['embed'],
    scripts: isProduction ? [
      REACT_URL.production,
      REACT_DOM_URL.production,
      BABEL_STANDALONE_URL.production,
      `${MONACO_URL.production}vs/loader.js`,
    ] : [`${MONACO_URL.production}vs/loader.js`],
  };

  const embedOptions = {
    ...htmlTemplateOptions,
    filename: 'embed/index.html',
    excludeChunks: ['main'],
  };

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      main: './src/index.tsx',
      embed: './src/embed.tsx',
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
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
                configFile: 'tsconfig.json',
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
    },
    externals: isProduction ? {
      react: 'React',
      'react-dom': 'ReactDOM',
      'babel-standalone': 'Babel',
      'monaco-editor': 'monacoEditor'
    } : {},
    plugins: [
      new HtmlWebpackPlugin(htmlTemplateOptions),
      new HtmlWebpackPlugin(embedOptions),
      new webpack.DefinePlugin({
        DEBUG: !isProduction,
        MONACO_URL: JSON.stringify(MONACO_URL.production),
        VERSION: JSON.stringify(version),
      })
    ],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      plugins: [new TsconfigPathsPlugin()],
    },
  };
}

module.exports.generateBuildWebpackConfiguration = function(env) {
  return _generateBaseWebpackConfiguration((env || {}).production);
};

module.exports.generateDevWebpackConfiguration = function() {
  return _generateBaseWebpackConfiguration(false);
};
