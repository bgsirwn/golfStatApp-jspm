var appRoot = 'src/';
var outputRoot = 'www/';
var exportSrvRoot = 'export/';

module.exports = {
  root: appRoot,
  allSources : appRoot + "**/*.*",
  source: appRoot + '**/*.js',
  html: appRoot + '**/*.html',
  css: appRoot + '**/*.css',
  img_png: appRoot + '**/*.png',
  img_svg: appRoot + '**/*.svg',
  output: outputRoot,
  exportSrv: exportSrvRoot,
  doc: './doc',
  e2eSpecsSrc: 'test/e2e/src/**/*.js',
  e2eSpecsDist: 'test/e2e/dist/'
};
