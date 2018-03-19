const path = require('path');

module.exports = {
  mode: 'development',
  entry: [
    './src/index.js',
    'react-hot-loader/patch',
  ],
  devtool: 'source-map',
  output: {
    path: path.resolve('dist'),
    filename: 'index.js',
  },
  devServer: {
    contentBase: './',
    port: 9001,
    publicPath: '/dist/',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
};
