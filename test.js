// content of index.js
const logcat = require('adbkit-logcat')
const {spawn} = require('child_process')

const logProcess = spawn('adb', ['logcat', '-B']);

const reader = logcat.readStream(logProcess.stdout);

reader.on('entry', entry => {
  console.log(entry);
})
