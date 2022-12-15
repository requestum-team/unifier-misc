const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function generateHtmlPlugins(root, inject) {
  const templateDir = './src/templates/views';
  const templateFiles = fs.readdirSync(path.resolve(root, templateDir));
  return templateFiles
    .map(item => item.split('.'))
    .filter(([, extension]) => Boolean(extension))
    .map(([name, extension]) => {
      return new HtmlWebpackPlugin({
        filename: `${name}.html`,
        inject,
        minify: false,
        template: path.resolve(root, `${templateDir}/${name}.${extension}`),
        templateParameters: require(path.resolve(root, './src/templates/data.json'))
      });
    });
}
