//PACKAGES
import webpack from 'webpack-stream'; //This is mostly for module bundling JS files
import named from 'vinyl-named'; //webpack-stream provides a couple of solutions for creating multiple entry points.

import { src, dest, watch, series, parallel } from 'gulp'; //What does this do? and the below imports. //series, parallel: compose tasks
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';

//What does this do?
import postcss from 'gulp-postcss'; //is depenacie for autoprefixer. might be revered though?
import sourcemaps from 'gulp-sourcemaps'; //instead of seeing bundle.js, it shows the actual path the selector relates to
import autoprefixer from 'autoprefixer';

import imagemin from 'gulp-imagemin'; //Compress images in src then moves to dist

import del from 'del'; //Responsible for deleting the dist folder.

import browserSync from "browser-sync"; //Plugin that refreshes the browser each time tasks finish running

//What does this do?
const PRODUCTION = yargs.argv.prod;


export const scripts = () => {
  return src(['src/js/bundle.js', 'src/js/admin.js']) //entry points
  .pipe(named()) //pipe named plugin before webpack: allows us to use [name] placeholder. We will get two bundles in dist/js
  .pipe(webpack({ //pipe the webpack plugin and specify options for it.
    module: {
      rules: [ //the rules field in the module options lets webpack know what loaders to use to transform our files. transform JS files using babel-loader
        {
          test: '/\.js$',
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    mode: PRODUCTION ? 'production' : 'development',
    devtool: !PRODUCTION ? 'inline-source-map' : false, //devtool option will add source maps but not in prod
    output: {
      filename: '[name].js'
    },
  }))
  .pipe(dest('dist/js'))
}


//TASK: Serve. This starts the Browsersync server
//pointed to our local WordPress server using the proxy option.
const server = browserSync.create();
export const serve = done => { 
  server.init({
    proxy: 'http://clientsite.local/'
  });
  done();
};

export const reload = done => {
  server.reload()
  done()
}

//TASK - What does it do?
export const styles = () => {
    return src(['src/scss/bundle.scss', 'src/scss/admin.scss'])
      .pipe(gulpif(!PRODUCTION, sourcemaps.init())) //if prod = false, initalise source map
      .pipe(sass().on('error', sass.logError)) //log error
      .pipe(gulpif(PRODUCTION, postcss([ autoprefixer ]))) //if prod = true, run postcss, minify?
      .pipe(gulpif(PRODUCTION, cleanCss({compatibility:'ie8'})))
      .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
      .pipe(dest('dist/css'))
      .pipe(server.stream());
  }

//This task watches for changes in the below directory. you have the path and the task it calls when a change is detected.
export const watchForChanges = () => {
  watch('src/scss/**/*.scss', styles);
  watch('src/images/**/*.{jpg,jpeg,png,svg,gif}', series(images, reload));
  watch(['src/**/*','!src/{images,js,scss}','!src/{images,js,scss}/**/*'], series(copy, reload));
  watch('src/js/**/*.js', series(scripts, reload));
  watch('**/*.php', reload);
}

//TASK what does it do?
export const images = () => {
  return src('src/images/**/*.{jpg,jpeg,png,svg,gif}') //give src() a function a glob that matches all .jpg exts
    .pipe(gulpif(PRODUCTION, imagemin())) //if in PRODUCTION mode, run imagemin() plugin
    .pipe(dest('dist/images')) //move images to destination folder 'dist/images'
}
//Now any images that we drop into src/images will be copied when we run gulp images. However, running gulp images --prod, will both compress and copy the image over.

//TASK: Copy any files apart from js & SASS
export const copy = () => {
  return src(['src/**/*', '!src/{images,js,scss}', '!src{/images,js,scss}/**/*']) //We are telling Gulp to match all files and folders inside src (src/**/*), EXCEPT the images, js and scss folders
    .pipe(dest('dist'));
}
//Try adding any file or folder to the src directory and it should be copied over to the the /dist directory

//TASK: That will delete the dist folder
export const clean = () => del(['dist']) //del returns a promise, thus we dont have to call cb() func

//Compsing Tasks
export const dev = series(clean, parallel(styles,images,copy, scripts), serve, watchForChanges) //Series: Runs tasks one after the other //Parallel: Runs tasks simutanously
export const build = series(clean, parallel(styles,images,copy, scripts)) //Do I need phpfix and lint here?
export default dev //export default dev means if we run 'GULP' it will automaticly use the dev task.















