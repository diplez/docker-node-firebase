/** 
var http = require('http');
var express = require('express');
const functions = require('firebase-functions');
var server = http.createServer();
function control(petic, resp) {
resp.writeHead(200, {'content-type': 'text/plain'});
resp.write('Hola, Mundo NUEVO MUNDO!');
resp.end();
}
server.on('request', control);
console.log("SERVIDOR EJECUTANOSE EN PUERTO 3000 ...")
server.listen(3000);
**/

var express = require('express');
var app = express();


app.get('/', function (req, res) {
  res.send('Hello World! diego lopez');
});

app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});


app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/functions'));