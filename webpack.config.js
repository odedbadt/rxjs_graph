
var webpack = require('webpack');
module.exports = {
  'entry': './src/index.js',
  'watch':true,
  'devtool': "eval-source-map",
   output: {
    filename: 'main.js',
    path: __dirname + '/public'
  },
  'mode': 'development',
  'optimization': {
    'minimize': false
    }
};
