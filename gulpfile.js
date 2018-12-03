var exec = require("child_process").exec,
  // Gulp Functionality Related
  gulp = require("gulp"),
  del = require("del"),
  plumber = require("gulp-plumber"),
  // CSS
  less = require("gulp-less"),
  postcss = require("gulp-postcss"),
  postcssPresetEnv = require("postcss-preset-env"),
  autoprefixer = require("autoprefixer"),
  lost = require("lost"),
  lessLists = require("less-plugin-lists"),
  // JS
  eslint = require("gulp-eslint"),
  preprocess = require("gulp-preprocess"),
  // Other
  browsersync = require("browser-sync").create(),
  notify = require("gulp-notify"),
  // Image
  imagemin = require("gulp-imagemin"),
  newer = require("gulp-newer");

function browserSync() {
  browsersync.init({
    server: {
      baseDir: "./public/"
    },
    port: 3000
  });
}

// BrowserSync Reload (callback)
// function browserSyncReload(done) {
//   browsersync.reload();
//   done();
// }

var paths = {
  src: {
    css: "./_build/less/styles.less",
    js: "./_build/js/scripts.js",
    images: "./_build/images/**/*",
    html: [
      "public/**/*.html",
      "!public/js/**/*",
      "!public/css/**/*",
      "!public/files/**/*",
      "!public/fonts/**/*",
      "!public/images/**/*"
    ]
  },
  dest: {
    css: "./public/",
    js: "./public/js/",
    html: "./public/",
    images: "./public/images/"
  },
  del: {
    css: "./public/",
    js: "./public/js/",
    images: "./public/images/",
    html: "public"
  },
  watch: {
    css: "./_build/less/**/*",
    js: "./_build/js/**/*",
    images: "./_build/images/**/*",
    html: ["./layouts/**/*", "./content/**/*"]
  }
};

function clean() {
  return del([paths.del.css, paths.del.js, paths.del.images, paths.del.html]);
}

function css() {
  var postcssPlugins = [
    lost,
    autoprefixer({
      enabled: true,
      options: {
        remove: false,
        browsers: [browsersYearsBack(8), "not dead"]
      }
    }),
    postcssPresetEnv()
  ];

  return gulp
    .src(paths.src.css)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      less({
        plugins: [new lessLists()]
      })
    )
    .pipe(postcss(postcssPlugins))
    .pipe(gulp.dest(paths.dest.css))
    .pipe(browsersync.stream());
}

function jsESlint() {
  return gulp
    .src(paths.src.js)
    .pipe(plumber())
    .pipe(eslint({ configFile: "eslintrc.json" }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function js() {
  return gulp
    .src(paths.src.js)
    .pipe(preprocess())
    .pipe(plumber())
    .pipe(gulp.dest(paths.dest.js))
    .pipe(browsersync.stream());
}

function html() {
  return gulp
    .src(paths.src.html)
    .pipe(gulp.dest(paths.dest.html))
    .pipe(browsersync.stream());
}

// Optimize Images
function images() {
  return gulp
    .src(paths.src.images)
    .pipe(newer(paths.dest.images))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }]
      })
    )
    .pipe(gulp.dest(paths.dest.images));
}

function hugo(cb) {
  exec("hugo", function(err, stdout, stderr) {
    console.log("\n-------- Hugo output--------\n");
    console.log(stdout);
    console.log("----------------------------\n");
    html();
    cb(err);
  });
}

function watch() {
  gulp.watch(paths.watch.css, css);
  gulp.watch(paths.watch.js, js);
  gulp.watch(paths.watch.images, images);
  gulp.watch(paths.watch.html, hugo);
}

gulp.task("hugo", gulp.series(hugo));
gulp.task("clean", clean);
gulp.task("css", css);
gulp.task("images", images);
gulp.task(
  "js",
  gulp.series(jsESlint, js, function(done) {
    done();
  })
);
gulp.task("build", gulp.series(clean, gulp.parallel(css, js, images, hugo)));
gulp.task("watch", gulp.series("build", gulp.parallel(watch, browserSync)));
gulp.task(
  "default",
  gulp.series("watch", function(done) {
    done();
  })
);

// =============================================================================
// Functions Addons
// =============================================================================

function browsersYearsBack(years) {
  return "since " + (new Date().getFullYear() - years || "2010");
}
