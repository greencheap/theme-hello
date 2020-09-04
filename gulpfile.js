const { src, dest, series, watch} = require('gulp');
const pkg = require('./package.json');
const composer = require('./composer.json');
const less = require('gulp-less');
const rename = require('gulp-rename');
const cssmin = require('gulp-cssmin');
const header = require('gulp-header');
const fs = require('fs');
const path = require('path');

const banner = ['/**',
' * <%= composer.name %> - <%= composer.description %>',
' * @version v<%= composer.version %>',
' * @link <%= composer.homepage %>',
' * @license <%= composer.license %>',
' */',
''].join('\n');

function lessFiles(){
    return src('./assets/src/less/theme.less')
    .pipe(less())
    .pipe(cssmin())
    .pipe(header(banner , { composer : composer }))
    .pipe(rename(function (path) {
        path.basename = pkg.name;
        path.extname = ".min.css";
    }))
    .pipe(dest('./assets/dist/css'))
}

async function moveImage(cb){
    copyFolderRecursiveSync('./node_modules/uikit/src/images' , './assets')
}

async function copyFolderRecursiveSync( source, target ) {
    var files = [];
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

async function copyFileSync( source, target ) {
    var targetFile = target;
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

exports.compileLess = series(lessFiles , moveImage);
exports.watch = function() {
    watch('./assets/src/less/**/*.less', series(lessFiles , moveImage));
};