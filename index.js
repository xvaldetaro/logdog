// content of index.js
const http = require('http')
const opn = require('opn')
const WebSocketServer = require('websocket').server;
const logcat = require('adbkit-logcat')
const {spawn} = require('child_process')
const logpipe = require('./logpipe.js');

const fs = require('fs')
const port = 3000

// Connect logcat to the stream
let wsServer;

fs.readFile('./index.html', function(err, html) {
  const server = http.createServer(function(request, response) {
    response.writeHeader(200, {"Content-Type": "text/html"});
    response.write(html);
    response.end();
  })

  server.listen(port, (err) => {
    if (err) {
      return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
    opn('http://localhost:3000')
  })

  wsServer = new WebSocketServer({httpServer: server})

  wsServer.on('request', function(request) {
    const connection = request.accept(null, request.origin)

    const out = {buffer: []};

    spawn('adb', ['logcat', '-c']).on('close', () => {
      const logProcess = spawn('adb', ['logcat', '-B']);
      const reader = logcat.readStream(logProcess.stdout)

      reader.on('entry', entry => {
        if (entry.tag.search('nyc') === -1) {
          return;
        }
        try {
          const messageJson = JSON.parse(entry.message);
          entry.stack = messageJson.stack;
          entry.message = messageJson.text;
        } catch (e) {
          // Message is not json, so move along
        }

        out.buffer.push(entry);
      })

      reader.on('finish', () => {
        console.log('finish');
      })
      reader.on('close', () => {
        console.log('closed');
      })
    })

    const push = () => {
      if (out.buffer.length) {
        const buffer = out.buffer;
        out.buffer = [];
        connection.sendUTF(JSON.stringify(buffer));
      }

      setTimeout(() => {
        push();
      }, 1000);
    }

    push();
  })
})
