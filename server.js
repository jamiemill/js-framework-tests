var express = require('express');
var app = express();
var fs = require('fs');

app.use(express.static(__dirname));

app.get('/stock/5', function(req, res){
   res.sendfile('index.html');
});

app.listen(3000);
