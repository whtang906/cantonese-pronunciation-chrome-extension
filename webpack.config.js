const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const config = {
      entry: {
        background: './src/background/index.ts',
        popup: './src/popup/index.tsx',
        content_scripts: './src/content_scripts/index.tsx',
        options: './src/options/index.tsx',
        off_screen: './src/off_screen/index.ts',
      },
      output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
      },
      mode: argv.mode,
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
          {
            test: /\.css$/i,
            resourceQuery: /raw/,
            use: 'raw-loader',
          },
          {
            test: /\.css$/,
            resourceQuery: { not: [/raw/] },
            use: ['style-loader', 'css-loader'],
          },
          {
            test: /\.(png|svg|jpg|jpeg|gif)$/i,
            type: 'asset/resource',
          },
        ],
      },
      plugins: [
          new HtmlWebpackPlugin({
              filename: 'popup.html',
              template: 'src/popup/index.html',
              chunks: ['popup'],
          }),
          new HtmlWebpackPlugin({
              filename: 'options.html',
              template: 'src/options/index.html',
              chunks: ['options'],
          }),
          new HtmlWebpackPlugin({
              filename: 'off_screen.html',
              template: 'src/off_screen/index.html',
              chunks: ['off_screen'],
          }),
          new CopyPlugin({
            patterns: [
              {
                from: "src/manifest.json",
                to: "manifest.json",
              },
              {
                from: "images",
                to: "images",
              }
            ],
          }),
      ],
  }

  if (isProduction) {
    config.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    };
  } else {
    config.devtool = 'source-map';
  }

  return config;
};