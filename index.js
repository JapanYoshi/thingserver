var express = require('express');
var app = express();

const path = require('path');
/*
 * cors made this part not fucking work.
 * fuck cors and everyone who came up with it
 * it's been nothing but a fucking nuisance
 * and it's been ruining my code for way longer than
 * they need to ever ruin my code
 */
var cors = require('cors');
app.use(cors());
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static('http://localhost:4200')); // connect to the Angular project. this is the Node project. this is so confusing so I'll note it down

app.get('/', (req, res) => res.send('Hello World!'));

var loginModule = require('./api/login');
app.post('/api/login', loginModule.login);
app.post('/api/list', loginModule.list);
app.post('/api/update', loginModule.update);
app.post('/api/groups', loginModule.groups);

var http = require('http').Server(app);
var server = http.listen(3000, function(){
    console.log("Server listening on port 3000");
});
