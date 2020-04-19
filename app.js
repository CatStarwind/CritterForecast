var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var favicon = require('serve-favicon')
var rfs = require('rotating-file-stream');

var app = express();
var fishRouter = require('./routes/fish');
var insectRouter = require('./routes/insect');

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');

// Create Rotating Log
var appLogStream = rfs.createStream('critterforecast.log',{
  interval: '1d',
  path: "/data/log"
});
logger.token('remote-addr', function (req, res) { return req.headers['x-real-ip']; });
app.use(logger(':remote-addr [:date[iso]] :status :res[content-length] ":method :url HTTP/:http-version" ":referrer" ":user-agent"', { stream: appLogStream }));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use('/fish', fishRouter);
app.use('/insect', insectRouter);

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
*/
module.exports = app;