const inlineCSS = require('inline-css');

exports.default = class InlineCSSPlugin {
  static name = 'InlineCSSPlugin';
  #styleTags = [];
  #options = {};
  #defaultOptions = {
    url: ' ',
    removeStyleTags: false,
    removeLinkTags: false,
    applyLinkTags: true,
    applyStyleTags: true
  };

  constructor(options) {
    this.#options = { ...this.#defaultOptions, ...options };
  }

  apply(compiler) {
    const pluginName = InlineCSSPlugin.name;
    const { webpack } = compiler;
    const { Compilation } = webpack;

    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE
        },
        this.#collectStyleTags.bind(this, compilation)
      );

      compilation.hooks.processAssets.tapPromise(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
        },
        assets => this.#updateAllAssets(compilation, assets).then(this.#afterAssetsUpdate.bind(this))
      );
    });
  }

  #updateAllAssets(compilation, assets) {
    return Promise.all(
      Object.keys(assets)
        .filter(filename => /\.html$/gi.test(filename))
        .map(this.#updateOneAsset.bind(this, compilation, assets))
    );
  }

  #updateOneAsset(compilation, assets, filename) {
    const { webpack } = compilation.compiler;
    const { RawSource } = webpack.sources;
    let content = assets[filename]?.source();

    if (this.#styleTags) {
      content = content.replace('</head>', `${this.#styleTags.join('\n')}</head>`);
    }

    return inlineCSS(content, this.#options).then(content => {
      compilation.updateAsset(filename, new RawSource(content));
    });
  }

  #collectStyleTags(compilation, assets) {
    Object.keys(assets)
      .filter(filename => /\.css$/gi.test(filename))
      .forEach(filename => {
        this.#styleTags.push(`  <style>\n    ${assets[filename]?.source()}  </style>\n`);
        compilation.deleteAsset(filename);
      });
  }

  #afterAssetsUpdate() {
    this.#styleTags.length = 0;
  }
};
