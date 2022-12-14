var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');

var dictionary = null;

function getMultipleRandom(arr, num) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, num);
}

var dictionaryHandler = (request, response) => {
    var u = url.parse(request.url);

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (u.pathname == '/readyz') {
        if (dictionary) {
            const randomWordArray = getMultipleRandom(Object.keys(dictionary), 9)

            response.writeHead(200);
            response.end(JSON.stringify({data:randomWordArray}))
        } else {
            response.writeHead(404);
            response.end('Not Loaded');
        }
        return;
    }

    var key = '';
    if (u.pathname.length > 0) {
        key = u.pathname.substr(1).toUpperCase(); 
    }
    var def = dictionary[key];
    if (!def) {
        response.writeHead(404);
        response.end(key + ' was not found');
        return;
    }
    response.writeHead(200);
    response.end(def);
}

var downloadDictionary = (url, file, callback) => {
  var stream = fs.createWriteStream(file);
  var req = https.get(url, function(res) {
    res.pipe(stream);
    stream.on('finish', function() {
      stream.close(callback);
      console.log('dictionary downloaded');
    });
  }).on('error', function(err) {
    fs.unlink(file);
    if (callback) cb(err.message);
  });
};

var loadDictionary = (file, callback) => {
    fs.readFile(file, (err, data) => {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        dictionary = JSON.parse(data);
        console.log('dictionary loaded.');
        callback();
    })
};

downloadDictionary('https://raw.githubusercontent.com/adambom/dictionary/master/dictionary.json', 'dictionary.json', (err) => {
    if (err) {
        console.log(err);
        return;
    }
    loadDictionary('dictionary.json', (err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('ready to serve');
    });
});

const server = http.createServer(dictionaryHandler);

server.listen(process.env.PORT || 8080, (err) => {
  if (err) {
    return console.log('error starting server: ' + err);
  }

  console.log('server is listening on 8080');
});