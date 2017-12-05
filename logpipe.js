let pipeOut;
let lastIndex = 0;
var metrics = {};

function onData(chunk) {
  if (typeof chunk !== 'string') {
    return;
  }
  if (!pipeOut) {
    return;
  }
  const newLastIndex = chunk.lastIndexOf('\n');

  const data = chunk.substr(lastIndex, newLastIndex);
  lastIndex = newLastIndex + 1;

  const lines = data.split('\n');
  for (var i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.search('asdfr') > -1) {
      pipeOut(parseLine(line));
    }
  }
}

function parseLine(data) {
  const regEx = /^([\S]+)[\s]+([\S]+)[\s]+([\S]+)[\s]+([\S]+)[\s]+([\S]+)[\s]+([\S]+)[\s]+(.+)$/g;
  const reg = regEx.exec(data);
  if (reg == null) {
    console.log('daf:>>> ', data);
    return null;
  }
  return {
    data: data,
    day: reg[1],
    time: reg[2],
    tag: reg[6],
    body: reg[7],
  }
}

function setPipeOutput(cb) {
  pipeOut = cb;
}

module.exports = {
  onData: onData,
  setPipeOutput: setPipeOutput,
}
