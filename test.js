// content of index.js
const logcat = require('adbkit-logcat')
const {spawn} = require('child_process')
const readline = require('readline');

const logProcess = spawn('adb', ['logcat']);

const rl = readline.createInterface({
  input: logProcess.stdout,
  output: process.stdout,
  terminal: false,
});

function processLine(line) {
  const regex = /^\s*(\d\d-\d\d)\s+(\d\d:\d\d:\d\d\.\d\d\d)\s+(\d+)\s+(\d+)\s\w\s+(\S+)\s+(.+)\s*$/g
  const result = regex.exec(line);
  if (!result) {
    console.log('bad line:', line);
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

  try {
    const messageJson = JSON.parse(entry.message);
    entry.stack = messageJson.stack;
    entry.message = messageJson.text;
  } catch (e) {
    // Most Messages are not json, so move along
  }

  return entry;
}

rl.on('line', (line) => {
  console.log(line, '>>>>>><<<<<<<', processLine(line));
});
