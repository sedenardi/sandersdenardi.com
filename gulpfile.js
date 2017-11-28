const gulp = require('gulp');
const htmlreplace = require('gulp-html-replace');
const htmlmin = require('gulp-htmlmin');
const concat = require('gulp-concat');
const postcss = require('gulp-postcss');
const uncss = require('postcss-uncss');
const cssnano = require('cssnano');
const del = require('del');

const processHtml = () => {
  return gulp.src('public/**/*.html')
    .pipe(htmlreplace({
      'js': 'https://www.sandersdenardi.com/css/site.css'
    }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      conservativeCollapse: true
    }))
    .pipe(gulp.dest('public'));
};

const concatStyles = () => {
  return gulp.src([
    'public/css/poole.css',
    'public/css/hyde.css',
    'public/css/poole-overrides.css',
    'public/css/hyde-overrides.css',
    'public/css/hyde-x.css',
    'public/css/highlight/solarized_dark.css'
  ]).pipe(concat('site.css'))
    .pipe(gulp.dest('public/css'));
};

const styles = () => {
  const plugins = [
    uncss({ html: [
      'public/**/*.html'
    ]}),
    cssnano({ preset: 'default' })
  ];
  return gulp.src('public/css/site.css')
    .pipe(postcss(plugins))
    .pipe(gulp.dest('public/css'));
};

const cleanStyles = () => {
  return del([
    'public/css/**/*.css',
    '!public/css/site.css'
  ]);
};

gulp.task('processHtml', processHtml);
gulp.task('concatStyles', concatStyles);
gulp.task('styles', styles);
gulp.task('cleanStyles', cleanStyles);

gulp.task('default', gulp.series(
  gulp.parallel(
    processHtml,
    concatStyles
  ),
  styles
));
