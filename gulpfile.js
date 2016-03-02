var gulp = require('gulp');
var runSequence = require('run-sequence');
var cache = require('gulp-cached');
var colors = require('colors');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var size = require('gulp-size');


// DEFINE PATHS
// ----------------------------------------------------------------------------
  var basePath = {
      src: 'src',
      dist: 'dist',
      tmp: '.tmp'
  };

  var assetsPath = {
    stylesSrc: basePath.src + '/scss',
    stylesDist: basePath.dist + '/css',

    imgSrc: basePath.src + '/images',
    imgDist: basePath.dist + '/img',

    scriptsSrc: basePath.src + '/js',
    scriptsDist: basePath.dist + '/js',

    spriteSrc: basePath.src + '/images/sprite',
    spriteDist: basePath.dist + '/img/sprite',
    spritePngDist: basePath.dist + '/img/sprite/pngicons',

  };


// ERROR HANDLER
// ----------------------------------------------------------------------------
  var beep = require('beepbeep');

  var onError = function(err) {
    beep([200, 200]);
    console.log(
      '\n\n******************************************\n'.bold.gray +
      ' ***********'.bold.gray +
      ' \(╯°□°)╯'.bold.red + ' ︵ '.bold.gray +'ɹoɹɹǝ '.bold.blue +
      '***********'.bold.gray +
      '\n******************************************\n\n'.bold.gray +
      String(err) +
      '\n\n******************************************\n\n'.bold.gray );
    this.emit('end');
  };


// CLEAN
// ----------------------------------------------------------------------------
  var del = require('del');

  gulp.task('clean', function(callback) {
    return del([ basePath.dist ]).then(paths => {
      console.log('Deleted files and folders:\n'.bold.green, paths.join('\n'));
    });
  });


// HTML
// ----------------------------------------------------------------------------
  var htmlhint = require('gulp-htmlhint');

  gulp.task('html', function() {
    return gulp.src( basePath.src + '/**/*.html' )
      .pipe(plumber( {errorHandler: onError} ))
      .pipe(htmlhint())
      .pipe(htmlhint.failReporter())
      .pipe(gulp.dest( basePath.dist ));
  });


// STYLES
// ----------------------------------------------------------------------------
  var scsslint = require('gulp-scss-lint');
  var sourcemaps = require('gulp-sourcemaps');
  var sass = require('gulp-sass');
  var postcss = require('gulp-postcss');
  var autoprefixer = require('autoprefixer');
  var cssnano = require('cssnano');

  gulp.task('scss-lint', function() {
    return gulp.src([
        assetsPath.stylesSrc + '/**/*.scss',
        '!' + assetsPath.stylesSrc + '/vendor/**/*.scss'
      ])
      .pipe(cache('scss-lint'))
      .pipe(scsslint({
        'config': './.scss-lint.yml',
      }));
  });

  gulp.task('css', ['scss-lint'], function() {
    return gulp.src( assetsPath.stylesSrc + '/**/*.scss' )
      .pipe(plumber( {errorHandler: onError} ))
      .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(postcss([
          autoprefixer({
            browsers: [
              'last 2 versions',
              '> 1%'
            ]
          })
        ]))
        .pipe(gulp.dest( assetsPath.stylesDist ))
        .pipe(postcss([
          cssnano({
            'zindex': false
          })
        ]))
        .pipe(rename({ suffix: ".min"}))
        .pipe(size({title: 'styles'}))
      .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest( assetsPath.stylesDist ));
  });


// SCRIPTS
// ----------------------------------------------------------------------------
  var eslint = require('gulp-eslint');
  var babel = require('gulp-babel');
  var concat = require('gulp-concat');
  var uglify = require('gulp-uglify');

  gulp.task('js-lint', function() {
    return gulp.src([
      assetsPath.scriptsSrc + '/**/*.js',
      '!' + assetsPath.scriptsSrc + '/pollyfills/*.js',
    ])
    .pipe(eslint())
    .pipe(eslint.format());
  });

  gulp.task('js', ['js-lint'], function() {
    return gulp.src([
      '!' + assetsPath.scriptsSrc + '/pollyfills/*.js',
      assetsPath.scriptsSrc + '/components/*.js'
    ])
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(sourcemaps.init())
      .pipe(babel({
        presets: ['es2015']
      }))
      .pipe(concat('scripts.js'))
      .pipe(gulp.dest( assetsPath.scriptsDist ))
      .pipe(uglify({
        compress: {
          drop_console: true
        }
      }))
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(size({title: 'scripts'}))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest(assetsPath.scriptsDist));
  });

  gulp.task('pollyfills', function() {
    return gulp.src([
      assetsPath.scriptsSrc + '/pollyfills/loadJS.js',
      assetsPath.scriptsSrc + '/pollyfills/pollyfills-list.js',
    ])
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(concat('pollyfills.min.js'))
    .pipe(gulp.dest( assetsPath.scriptsDist ));
  });

  gulp.task('copy-pollyfills', ['pollyfills'], function() {
    return gulp.src([
      assetsPath.scriptsSrc + '/pollyfills/*.js',
      '!' + assetsPath.scriptsSrc + '/pollyfills/loadJS.js',
      '!' + assetsPath.scriptsSrc + '/pollyfills/pollyfills-list.js',
    ])
    .pipe(gulp.dest( assetsPath.scriptsDist + '/pollyfills' ));
  });


// MODERNIZR
// ----------------------------------------------------------------------------
  var modernizr = require('gulp-modernizr');

  gulp.task('modernizr', ['css', 'js'], function() {
    gulp.src([
      assetsPath.stylesDist + '/*.css',
      assetsPath.scriptsDist + '/scrpts.min.js',
      assetsPath.scriptsSrc + '/pollyfills/pollyfills-list.js',
    ])
    .pipe(modernizr({
      'options': [
        'setClasses',
      ]
    }))
    .pipe(gulp.dest( assetsPath.scriptsDist + '/vendor' ));
  });


// IMAGES
// ----------------------------------------------------------------------------
  var imagemin = require('gulp-imagemin');
  var pngquant = require('imagemin-pngquant');

  gulp.task('images', function() {
    return gulp.src([
      assetsPath.imgSrc + '/*.+(png|jpg|svg|gif)'
    ])
    .pipe(imagemin({
        progressive: true,
        use: [pngquant()]
    }))
    .pipe(gulp.dest(assetsPath.imgDist))
    .pipe(size({ title: 'images' }));
  });


// SPRITE SVG
// ----------------------------------------------------------------------------
  var svgSprite = require('gulp-svg-sprite');
  var svgmin = require('gulp-svgmin');
  var svg2png = require('gulp-svg2png');

  gulp.task('svgSprite', function () {
    return gulp.src( assetsPath.spriteSrc + '/*.svg' )
      .pipe(svgmin({
        plugins: [
          {convertColors: false},
          {removeAttrs: {attrs: ['fill']}}
        ]
      }))
      .pipe(svgSprite({
        dest: assetsPath.spriteDist,
        mode: {
          symbol: {
            dest: './',
            sprite: 'icons',
            transform : [{svgo : {}}]
          }
        }
      }))
      .pipe(gulp.dest(assetsPath.spriteDist));
  });

  gulp.task('svg2png', function () {
    return gulp.src(assetsPath.spriteSrc + '/*.svg' )
      .pipe(svg2png())
      .pipe(gulp.dest(assetsPath.spritePngDist));
  });

  gulp.task('sprite', function(callback) {
    runSequence(
      'svgSprite',
      'svg2png',
      callback);
  });


// WATCH FOR CHANGES
// ----------------------------------------------------------------------------
  var browserSync = require('browser-sync').create();

  gulp.task('serve', ['build'], function() {
    browserSync.init({
      server: basePath.dist,
      port: 8000,
      files: [ assetsPath.stylesDist + '/*.css']
    });

    gulp.watch( basePath.src + '/**/*.html', ['html']);
    gulp.watch( basePath.dist + '/**/*.html').on('change', browserSync.reload);
    gulp.watch( assetsPath.stylesSrc + '/**/*.scss', ['css']);
    gulp.watch( assetsPath.scriptsSrc + '/**/*.js', ['js']);
    gulp.watch( assetsPath.scriptsSrc + '/pollyfills/*.js', ['copy-pollyfills'] );

    gulp.watch( assetsPath.scriptsDist + '/**/*.js').on('change', browserSync.reload);
    gulp.watch( assetsPath.imgSrc + '/*.+(png|jpg|svg|gif)', ['images']);
    gulp.watch( assetsPath.imgDist + '/*.+(png|jpg|svg|gif)').on('change', browserSync.reload);
    gulp.watch( assetsPath.spriteSrc + '/*.svg', ['sprite']);
    gulp.watch( assetsPath.spriteDist + '/*.svg').on('change', browserSync.reload);
  });


// BUILD
// ----------------------------------------------------------------------------
  gulp.task('build', function(callback) {
    runSequence(
      'clean',
      [
        'html',
        'scss-lint',
        'copy-pollyfills',
        'modernizr',
        'images',
        'sprite'
      ],
      callback);
  });

  gulp.task('default', [
    'serve'
  ]);


// DEPLOY
// ----------------------------------------------------------------------------
  var ghPages = require('gulp-gh-pages');

  gulp.task('deploy', ['build'], function() {
    return gulp.src( basePath.dist + '/**/*')
      .pipe(ghPages());
  });
