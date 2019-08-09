var express = require('express');
var app = express();

const path = require('path');

var cors = require('cors');
app.use(cors);

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static('http://localhost:4200')); // connect to the Angular project. this is the Node project. this is so confusing so I'll note it down


var http = require('http').Server(app);
var server = http.listen(3000, function(){
    console.log("Server listening on port 3000");
});

app.post('/api/login', require('./api/login'));