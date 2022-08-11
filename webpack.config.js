
var webpack = require('webpack');

module.exports = {
  entry: {
    vector: './src/vector.ts',
    csp: './src/csp.ts',
    index: './src/index.ts',
    sprites: './src/sprites.ts',
    console: './src/console.ts',
    struct: './src/struct.ts',
  },
  target: 'es8',
  module: {
    rules: [
      {
        test: /.*\.tsx?$/,
        use: 'ts-loader',
        exclude: ['/node_modules/','/dist']
      },
    ],
  },
  externals: {
    lodash: ['https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js', '_'],
  }, 
  resolve: {
    extensions: ['.tsx', '.ts'],
  },
  watch: true,
  devtool: "source-map",
  output: {
    filename: '[name].js',
    path: __dirname + '/public/dist'
  },
  mode: 'development',
  optimization: {
    minimize: false
    }
};
