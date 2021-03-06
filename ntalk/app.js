
/**
 * Module dependencies.
 */

var express = require('express')
, app = express()
, load = require('express-load')
, error = require('./middleware/error')
, server = require('http').createServer(app)
, io = require('socket.io').listen(server)
, mongoose = require('mongoose');

global.db = mongoose.connect('mongodb://localhost/ntalk');

const KEY = 'ntalk.sid', SECRET = 'ntalk';
var cookie =  express.cookieParser(SECRET)
, store = new express.session.MemoryStore()
, sessOpts = {secret: SECRET, key: KEY, store: store}
, session = express.session(sessOpts);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookie);
app.use(session);
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));

io.set('authorization', function(data, accept) {
  cookie(data, {}, function(err) {
    var sessionID = data.signedCookies[KEY];
    store.get(sessionID, function(err, session) {
      if (err || !session) {
        accept(null, false);
      } else {
        data.session = session;
        accept(null, true);
      }
    });
  });
});

load('models', {verbose: true})
  .then('controllers')
  .then('routes')
  .into(app);

load('sockets', {verbose: true})
  .into(io);

app.use(error.noFound);
app.use(error.serverError);

server.listen(3000, function(){
  console.log("Ntalk no ar.");
});