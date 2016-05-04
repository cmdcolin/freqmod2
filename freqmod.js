var blessed = require('blessed');
var fs = require('fs');
var inherits = require('util').inherits;
var Readable = require('stream').Readable;
var Speaker = require('speaker');


// params
var A = 100; //amplitude




// audio output to speaker
var speaker = new Speaker({
    channels: 1,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 44100     // 44,100 Hz sample rate
});



var screen = blessed.screen(),
    body = blessed.box({
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        tags: true
    });

screen.append(body);

screen.key(['escape', 'q', 'C-c'], function() {
    return process.exit(0);
});

function status(text) {
    body.setLine(0, '{blue-fg}' + text + '{/blue-bg}');
    screen.render();
}
function log(text) {
    body.insertLine(1, text);
    screen.render();
}

function Source(content, options) {
    Readable.call(this, options);
    this.content = content;
}

inherits(Source, Readable);

var i = 0;
Source.prototype._read = function (size) {
    status((new Date()).toISOString()+' '+size);
    log('Writing '+size+' bytes');
    var arr = new Uint16Array(size);
    for(var j = 0; j < size; j++) {
        arr[j] = A*Math.sin((i+j)/40);
    }
    var buf1 = Buffer.from(arr); // copies the buffer
    //console.log(buf1);
    this.push(buf1);
    i+=size; 
};

var myFile = fs.createWriteStream('output.wav');
var rs = new Source();
rs.pipe(speaker);
rs.pipe(myFile);


