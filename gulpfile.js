var gulp = require('gulp');
var vulcanize = require('gulp-vulcanize');
var crisper = require('gulp-crisper');
var runSequence = require('run-sequence');

gulp.task('default', function () {
    return runSequence('vulcanize', 'copy-js');
});

gulp.task('vulcanize', function () {
    return gulp.src('src/index.html')
        .pipe(vulcanize({
            abspath: '',
            excludes: [],
            stripExcludes: false,
            inlineScripts: false
        }))
        .pipe(crisper({
            scriptInHead: false, // true is default 
            onlySplit: false
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('copy-js', function() {
    return gulp.src('src/js/*')
        .pipe(gulp.dest('dist'));
});
