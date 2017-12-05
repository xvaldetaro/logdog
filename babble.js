var metrics = [
  "aaaa",
  "bbbb",
  "ccccc",
  "dddd",
  "asdf",
  "vcccc"
]

function randomStr(maxLength) {
    var possible = "ABCDEFGHIJK             LMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var length = Math.ceil(Math.random() * maxLength);
    var text = "";
    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function randomPick(array) {
  var i = Math.floor(Math.random() * array.length);
  return array[i];
}

function makeLogLine() {
  var text;
  if (Math.random() > 0.8) {
    text = randomStr(10) + "qm(" + randomPick(metrics) + ","+ (Math.random() * 50) +")" + randomStr(5);
  } else {
    text = randomStr(200)
  }

  return ">>>" + text;
}

function makeChunk() {
    var nLines = Math.ceil(Math.random() * 5);
    var out = "";
    for (var i = 0; i < nLines; i++) {
      out += makeLogLine() + "\n";
    }
    out += makeLogLine();
    return out;
}

function printNext() {
  process.stdout.write(makeChunk());
  setTimeout(function() {
    printNext();
  }, 10);
}

printNext();
