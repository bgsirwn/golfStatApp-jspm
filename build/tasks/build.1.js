var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var to5 = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');
var htmlmin = require('gulp-htmlmin');

var dest = 'www/';

gulp.task('copy-config', () => {
    return gulp.src('config.js')
        .pipe(gulp.dest(dest))
});

gulp.task('copy-src', () => {
    return gulp.src('src/**/*')
           .pipe(changed(dest+paths.output))
           .pipe(gulp.dest(dest+paths.output))
});

gulp.task('copy-jspm', () => {
    return gulp.src('jspm_packages/**/*', { base: 'jspm_packages/' })
        .pipe(gulp.dest(dest + 'jspm_packages/'))
});

gulp.task('watch', () => {
    gulp.watch(['config.js'], ['copy-config']);
    gulp.watch(['jspm_packages/**/*'], ['copy-jspm']);
    gulp.watch(['src/**/*'], ['copy-src']);
});

// transpiles changed es6 files to SystemJS format
// the plumber() call prevents 'pipe breaking' caused
// by errors from other gulp plugins
// https://www.npmjs.com/package/gulp-plumber
gulp.task('build-system', function() {
  return gulp.src(paths.source)
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(changed(paths.output, {extension: '.js'}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(to5(assign({}, compilerOptions.system())))
    .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: '/src'}))
    .pipe(gulp.dest(paths.output));
});

// copies changed html files to the output directory
gulp.task('build-html', function() {
  return gulp.src(paths.html)
    .pipe(changed(paths.output, {extension: '.html'}))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.output));
});

// copies changed css files to the output directory
gulp.task('build-css', function() {
  return gulp.src(paths.css)
    .pipe(changed(paths.output, {extension: '.css'}))
    .pipe(gulp.dest(paths.output))
    .pipe(browserSync.stream());
});

// copies changed png files to the output directory
gulp.task('build-img-png', function() {
  return gulp.src(paths.img_png)
    .pipe(changed(paths.output, {extension: '.png'}))
    .pipe(gulp.dest(paths.output))
    .pipe(browserSync.stream());
});

// copies changed png files to the output directory
gulp.task('build-img-svg', function() {
  return gulp.src(paths.img_svg)
    .pipe(changed(paths.output, {extension: '.svg'}))
    .pipe(gulp.dest(paths.output))
    .pipe(browserSync.stream());
});

// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    ['build-system', 'build-html', 'build-css', 'build-img-png', 'build-img-svg'],
    callback
  );
});
