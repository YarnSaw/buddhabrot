const path = require('path')//import path from "path";

/** @type {import('webpack').Configuration} */
const webpackConfig = {
  devServer: {
    contentBase: path.join(__dirname, "public"),
    disableHostCheck: true,
    publicPath: '/dist',
    watchContentBase: true,
  },
  devtool: 'source-map',
  entry: {
    index: path.join(__dirname, 'src', 'mainBrowser.js'),
  },
  output: {
    filename: '[name].min.js',
    path: path.join(__dirname, 'public/dist'),
    publicPath: '/',
    clean: true,
  },
};

export default webpackConfig;
