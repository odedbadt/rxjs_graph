
var webpack = require('webpack');

module.exports = {
  entry: {
    vector: './src/vector.ts',
    csp: './src/csp.ts',
    index: './src/index.ts',
    sprites: './src/sprites.ts'
  },
  module: {
    rules: [
      {
        test: /.*\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },  
  resolve: {
    extensions: ['.ts'],
  },
  watch: true,
  devtool: "eval-source-map",
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
  },
  mode: 'development',
  optimization: {
    minimize: false
    }
};
