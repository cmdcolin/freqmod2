var blessed = require('blessed');
var Speaker = require('speaker');
var Readable = require('stream').Readable;

var rs = new Readable;

// Create the Speaker instance
var speaker = new Speaker({
  channels: 2,          // 2 channels
  bitDepth: 16,         // 16-bit samples
  sampleRate: 44100     // 44,100 Hz sample rate
});


// Create a screen object.
var screen = blessed.screen({
    smartCSR: true
});

screen.title = 'freqmod2';

// Create a box perfectly centered horizontally and vertically.
var box = blessed.box({
    content: 'freqmod2',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        border: {
            fg: '#f0f0f0'
        }
    }
});

// Append our box to the screen.
screen.append(box);

// If box is focused, handle `enter`/`return` and give us some more content.
screen.key('q', function(ch, key) { freq *= 2; });
screen.key('w', function(ch, key) { freq /= 2; });

screen.key('p', function(ch) {
    rs.pipe(speaker);
});

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

// Focus our element.
box.focus();

// Render the screen.
screen.render();

function fillBuf(i) {
    var buflen = 1024;
    var A = 2000;

    var buf = new Uint16Array(buflen);
    for(var j = 0; j < buflen; j++) {
        buf[j] = Math.sin((i+j)/40)*A;
    }
    rs.push(buf.toString());
    setTimeout(fillBuf, 10, i+j);
}

fillBuf(0);

