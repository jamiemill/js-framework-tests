var express = require('express');
var app = express();

app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

app.use(express.static(__dirname));

app.post('/sessions.json', function(req, res){
  res.send(201, {
    user: {
      username:'username'
    }
  });
});
var port = 3000;
app.listen(port);
console.log('server listening on port ' + port);
