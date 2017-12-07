const readline = require('readline');
const http = require('http');
const opn = require('opn');
const WebSocketServer = require('websocket').server;
const {spawn} = require('child_process');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');

var serve = serveStatic("./");

const out = {buffer: []};
let needRerunLogcat = true;
let wsConn;

spawn('adb', ['logcat', '-c']).on('close', () => {
  const setupLogcat = () => {
    const logProcess = spawn('adb', ['logcat']);

    const rl = readline.createInterface({
      input: logProcess.stdout,
      terminal: false,
    });

    return rl;
  }

  const server = http.createServer((req, res) => {
    const done = finalhandler(req, res);
    serve(req, res, done);
  });

  server.listen(3000, () => {
    opn('http://localhost:3000');
  });

  const wsServer = new WebSocketServer({httpServer: server})
  wsServer.on('request', function(request) {
    console.log('ws connection opened');
    wsConn = request.accept(null, request.origin)

    wsConn.on('close', () => {
      console.log('ws connection closed');
      wsConn = null;
    });
  });

  function processLine(line) {
    const regex = /^\s*(\d\d-\d\d)\s+(\d\d:\d\d:\d\d\.\d\d\d)\s+(\d+)\s+(\d+)\s\w\s+(\S+)\s+(.+)?\s*$/g
    const result = regex.exec(line);
    if (!result) {
      if (line.search('--------- beginning of') === -1) {
        console.log('skipping bad line:', line);
      }
      return;
    }

    const entry = {
      date: result[1],
      time: result[2],
      pid: result[3],
      tid: result[4],
      tag: result[5].slice(0, -1),
      message: result[6],
    };
    const aaa = entry;

    try {
      const messageJson = JSON.parse(entry.message);
      entry.stack = messageJson.stack;
      entry.message = messageJson.text;
    } catch (e) {
      // Most Messages are not json, so move along
    }

    return entry;
  }

  const onLostLogcat = () => {
    needRerunLogcat = true;
  };

  const runLoop = () => {
    if (needRerunLogcat) {
      const rl = setupLogcat();
      rl.on('line', (line) => {
        const entry = processLine(line);
        if (entry) {
          out.buffer.push(entry);
        }
      });

      rl.on('close', onLostLogcat);
      rl.on('finish', onLostLogcat);

      needRerunLogcat = false;
    }

    if (out.buffer.length) {
      const buffer = out.buffer;
      out.buffer = [];
      if (wsConn) {
        wsConn.sendUTF(JSON.stringify(buffer));
      }
    } else {
      // console.log('empty buffer coming out of logcat processor');
    }

    setTimeout(() => {
      runLoop();
    }, 1000);
  }

  runLoop();
});
