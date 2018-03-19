const gulp = require('gulp');

const hugo = require('./hugo');

const htmlreplace = require('gulp-html-replace');
const htmlmin = require('gulp-htmlmin');
const concat = require('gulp-concat');
const postcss = require('gulp-postcss');
const uncss = require('postcss-uncss');
const cssnano = require('cssnano');
const del = require('del');

const config = require('./config');
const s3 = require('gulp-s3-upload')(config.AWS);
const cloudfront = require('gulp-cloudfront-invalidate');

gulp.task('hugo', () => {
  return hugo();
});

gulp.task('processHtml', () => {
  return gulp.src('public/**/*.html')
    .pipe(htmlreplace({
      'js': '/css/site.css'
    }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      conservativeCollapse: true
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('concatStyles', () => {
  return gulp.src([
    'public/css/poole.css',
    'public/css/hyde.css',
    'public/css/poole-overrides.css',
    'public/css/hyde-overrides.css',
    'public/css/hyde-x.css',
    'public/css/highlight/solarized_dark.css'
  ]).pipe(concat('site.css'))
    .pipe(gulp.dest('public/css'));
});

gulp.task('styles', () => {
  const plugins = [
    uncss({ html: [
      'public/**/*.html'
    ]}),
    cssnano({ preset: 'default' })
  ];
  return gulp.src('public/css/site.css')
    .pipe(postcss(plugins))
    .pipe(gulp.dest('public/css'));
});

gulp.task('cleanStyles', () => {
  return del([
    'public/css/**/*.css',
    '!public/css/site.css'
  ]);
});

gulp.task('build', gulp.series(
  'hugo',
  gulp.parallel(
    'processHtml',
    'concatStyles'
  ),
  'styles',
  'cleanStyles'
));

gulp.task('s3Copy', () => {
  return gulp.src('public/**/*')
    .pipe(s3({
      Bucket: config.S3.Bucket,
      ACL: config.S3.ACL
    }));
});

gulp.task('invalidate', () => {
  return gulp.src('*')
    .pipe(cloudfront({
      distribution: config.CloudFront.distribution,
      paths: ['/*'],
      accessKeyId: config.AWS.accessKeyId,
      secretAccessKey: config.AWS.secretAccessKey,
      wait: true
    }));
});

gulp.task('deploy', gulp.series(
  's3Copy',
  'invalidate'
));

gulp.task('default', gulp.series(
  'build',
  'deploy'
));
