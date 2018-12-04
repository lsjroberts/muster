module.exports = {
  mode: 'production',
  devtool: 'source-map',
  stats: 'errors-only',
  output: {
    // path: path.resolve(__dirname, '_bundles'),
    filename: '[name].js',
    libraryTarget: 'umd',
    // library: 'muster',
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
            },
          },
          {
            loader: 'ts-loader',
            options: {
              // context: __dirname,
              configFile: 'tsconfig.json',
              compilerOptions: { composite: false },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
};
