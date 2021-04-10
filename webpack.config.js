
var webpack = require('webpack');

module.exports = {
  entry: {
    vector: './src/vector.ts',
    csp: './src/csp.ts',
    index: {
        import: './src/index.ts',
    },
    sprites:  {
        import: './src/sprites.ts',
    },
    console: {
        import: './src/console.ts',
    }
  },
  target: 'es8',
  module: {
    rules: [
      {
        test: /.*\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    lodash: ['https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js', '_'],
  }, 
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  watch: true,
  devtool: "source-map",
  output: {
    filename: '[name].js',
    path: __dirname + '/dist'
  },
  mode: 'development',
  optimization: {
    minimize: false
    }
};
