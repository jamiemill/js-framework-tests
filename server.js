var express = require('express');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var app = express();
var fs = require('fs');

app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

app.use(express.static(__dirname));
app.use(bodyParser());
app.use(cookieSession({
    keys: ['12345']
}));

app.use(function initSession(req, res, next) {
    req.session.data = req.session.data || emptySession();
    next();
});


function emptySession() {
    return { authenticated: false };
}

function requireAuth(next) {
   return function(req, res) {
       if (req.session.data.authenticated) {
            next(req, res);
       } else {
           res.send(401);
       }
   }
}


var stocks = {
    5: {
        "id": 5,
        "symbol": "TWTR US",
        "name": "Twitter Inc"
    },
    6: {
        "id": 6,
        "symbol": "GOOG US",
        "name": "Google Inc"
    },
    7: {
        "id": 7,
        "symbol": "AAPL US",
        "name": "Apple Inc"
    }
};

app.get('/watchlist.json', requireAuth(function(req, res) {
    res.send([
        stocks[5],
        stocks[6],
        stocks[7]
    ]);
}));

app.get('/stocks/:stockId.json', requireAuth(function(req, res) {
    res.send(stocks[req.params.stockId] || 404);
}));


app.get('/sessions.json', function(req, res) {
    res.send(req.session.data);
});

app.post('/sessions.json', function(req, res){
    if (req.body.password === 'password') {
        req.session.data = {
            id: 12345,
            authenticated: true,
            user: {
                username: req.body.username
            }
        };
    } else {
        req.session.data = emptySession();
    }
    res.send(201, req.session.data);
});

app.delete('/sessions.json', function(req, res) {
    req.session.data = emptySession();
    res.send(200, req.session.data);
});


// Client-side routes
app.get('/stock/5', function(req, res){
   res.sendfile('index.html');
});
app.get('/login', function(req, res){
   res.sendfile('index.html');
});


var port = 3000;
app.listen(port);
console.log('server listening on port ' + port);

