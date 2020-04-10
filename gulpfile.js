const { src, dest, parallel , watch } = require('gulp');
const less = require('gulp-less');
const minifyCSS = require('gulp-csso');
const concat = require('gulp-concat');
const pkg = require('./package.json'); 

function css() {
    return src('build/less/package.less')
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(concat(pkg.name+'.min.css'))
    .pipe(dest('dist/css'))
}

watch(['build/less/**/*.less'], {} , parallel(css));

exports.css = css;
exports.default = parallel(css);
          