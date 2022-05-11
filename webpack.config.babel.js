const path = require('path')//import path from "path";

/** @type {import('webpack').Configuration} */
const webpackConfig = {
  devServer: {
    static: path.join(__dirname, "public"),
    allowedHosts: 'all',
    // publicPath: '/buddhabrot/dist',
  },
  devtool: 'source-map',
  entry: {
    index: path.join(__dirname, 'src', 'mainBrowser.js'),
  },
  output: {
    filename: '[name].min.js',
    path: path.join(__dirname, 'public/buddhabrot/dist'),
    publicPath: '/',
    clean: true,
  },
};

export default webpackConfig;
