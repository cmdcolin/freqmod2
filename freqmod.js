var blessed = require('blessed');
var fs = require('fs');
var inherits = require('util').inherits;
var format = require('util').format;
var Readable = require('stream').Readable;
var Speaker = require('speaker');
var _ = require('lodash');

var p = {
    A: 70,
    f1: 440,
    f2: 440,
    f3: 440,
    I: 100,
    m: 1
};

try {
    p = _.extend(p, JSON.parse( fs.readFileSync('.synthrc', 'utf8') ));
} catch(e) {
    // no error if file not found or other error
}

// audio output to speaker
var speaker = new Speaker({
    channels: 2,          // 2 channels
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

screen.key(['escape', 'C-c'], function() {
    return process.exit(0);
});


screen.key(['q','w','a','s','z','x','j','k'], function(ch) {
    switch(ch) {
    case 'q': p.f1*=2; break;
    case 'w': p.f1/=2; break;
    case 'a': p.f2*=2; break;
    case 's': p.f2/=2; break;
    case 'z': p.f3*=2; break;
    case 'x': p.f3/=2; break;
    case 'j': p.I*=2; break;
    case 'k': p.I/=2; break;
    case 'm': p.m=(p.m+1)%2; break;
    }
});

screen.key(['o'], function() {
    fs.writeFileSync('.synthrc', JSON.stringify(p, null, 2), 'utf8');
});


function status(text) {
    body.setLine(0, '{blue-fg}' + text + '{/blue-fg}');
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
    status(format('%s\tbuf: %d\tfreq: %d/%d/%d\tA: %d\tI(t): %d\tmode: %d', (new Date()).toISOString(),size,p.f1,p.f2,p.f3,p.A,p.I,p.m));
    var arr = new Uint16Array(size);
    for(var j = 0; j < size; j+=2) {
        var pos = (i+j)/(size*2);
        if(p.m == 1) {
            arr[j] = p.A * Math.sin(pos * p.f1 * Math.sin(pos * p.f2));
            arr[j+1] = p.A * Math.sin(pos * p.f1 * Math.sin(pos * p.f2));
        }
        else if(p.m == 2) {
            arr[j] = p.A * Math.sin(pos * p.f1 * Math.sin(pos * p.f2 * Math.sin(pos * p.f3)));
            arr[j+1] = p.A * Math.sin(pos * p.f1 * Math.sin(pos * p.f2 * Math.sin(pos * p.f3)));
        }
    }
    var buf1 = Buffer.from(arr);
    this.push(buf1);
    i+=size; 
};

var myFile = fs.createWriteStream('output.wav');
var rs = new Source();
rs.pipe(speaker);
rs.pipe(myFile);

log('o: save synth settings');
log('m: change modulation mode');
log('j: I(t)*=2\tl: I(t)/=2');
log('z: osc3*=2\tx: osc3/=2');
log('a: osc2*=2\ts: osc2/=2');
log('q: osc1*=2\tw: osc1/=2');
log('keyboard shortcuts:');
