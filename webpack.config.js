
var webpack = require('webpack');
module.exports = {
  'entry': {
    'index': './src/index.js',
    'rxjs': './src/rxjs.js',
    'csp': './src/csp.js',
    'vector': './src/vector.js',
  },
  'watch':true,
  'devtool': "eval-source-map",
   output: {
    filename: '[name].js',
    path: __dirname + '/public'
  },
  'mode': 'development',
  'optimization': {
    'minimize': false
    }
};
