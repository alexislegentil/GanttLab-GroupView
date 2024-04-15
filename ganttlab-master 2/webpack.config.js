// webpack.config.js
module.exports = {
    // Autres configurations Webpack...
    module: {
      rules: [
        // Autres règles de chargement...
        {
          test: '/\.css$/',
          exclude: '/node_modules\/dhtmlx-gantt\/codebase/',
          use: [
            // Autres loaders...
            'postcss-loader'
          ]
        }
      ]
    }
  };
  