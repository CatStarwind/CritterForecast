var express = require('express');
var path = require('path');
var logger = require('morgan');

var cookieParser = require('cookie-parser');

var favicon = require('serve-favicon');
var rfs = require('rotating-file-stream');

var app = express();
var critterHandler = require('./critters');
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

app.use(cookieParser());
app.use(express.json());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public'), {maxAge: '4h'}));
app.use('/fish', critterHandler('fish'));
app.use('/insect', critterHandler('insect'));

module.exports = app;