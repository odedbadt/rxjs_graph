
var webpack = require('webpack');

module.exports = {
  entry: {
    vector: './src/vector.ts',
    pubsub: './src/pubsub.ts',
    index: './src/index.ts',
    sprites: './src/sprites.ts',
    struct: './src/struct.ts',
  },
  target: 'es8',
  module: {
    rules: [
      {
        test: /.*\.tsx?$/,
        use: 'ts-loader',
        exclude: ['/node_modules/','/dist', '/node_modules']
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
  target: 'web',
  optimization: {
    minimize: false
    }
};
