var blessed = require('blessed');
var fs = require('fs');
var util = require('util');
var stream = require('stream');
var Speaker = require('speaker');
var _ = require('lodash');


// command line
var args = process.argv.slice(2);

var p = {
    A: 70,
    f1: 440,
    f2: 440,
    f3: 440,
    n1: 0,
    n2: 0,
    n3: 0,
    I: 100,
    m: 1,
    l: 100000
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


var file = fs.createReadStream(args[0]);
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


screen.key(['q','w','a','s','z','x','j','k','m','t','g','b'], function(ch) {
    switch(ch) {
    case 'q': p.f1*=2; break;
    case 'w': p.f1/=2; break;
    case 'a': p.f2*=2; break;
    case 's': p.f2/=2; break;
    case 'z': p.f3*=2; break;
    case 'x': p.f3/=2; break;
    case 'j': p.I*=2; break;
    case 'k': p.I/=2; break;
    case 'm': p.m=(p.m+1)%4; break;
    case 't': p.n1=(p.n1+1)%4; break;
    case 'g': p.n2=(p.n2+1)%4; break;
    case 'b': p.n3=(p.n3+1)%4; break;
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


var Transform = stream.Transform;

function ModulateStream(options) {
    // allow use without new
    if (!(this instanceof ModulateStream)) {
        return new ModulateStream(options);
    }

    // init Transform
    Transform.call(this, options);
}
util.inherits(ModulateStream, Transform);



function wave(pos) {
    return Math.cos(pos);
}
function square(pos) {
    return Math.cos(pos)<=0?-1:1;
}
function triangle(pos) {
    return 1-Math.abs((pos%1.0)-0.5)*4;
}
function input(pos,j,arr) {
    return arr[j];
}

var i = 0;
ModulateStream.prototype._transform = function(chunk, encoding, callback) {
    var size = chunk.length;
    var fun = [wave, square, triangle, input];
    var stat = ['osc2->osc1','osc3->osc2->osc1','osc3->osc1<-osc2','osc1'];
    var wtype = ['w','s','t','i'];

    status(util.format('%s\tbuf: %d\tfreq: %d/%d/%d\tA: %d\tI(t): %d\tmode: %s\ttype: %s/%s/%s', (new Date()).toISOString(),size,p.f1,p.f2,p.f3,p.A,p.I,stat[p.m],wtype[p.n1],wtype[p.n2],wtype[p.n3]));
    var arrb = new Uint16Array(chunk,0,size);
    var arr = new Uint16Array(size);
    for(var j = 0; j < size; j+=2) {
        var pos = (i+j)/(size*2);
        if(p.m == 0) {
            arr[j]  = p.A * fun[p.n1](pos * p.f1 * p.I * fun[p.n2](pos * p.f2,j,arrb),j,arrb);
            arr[j+1] = p.A * fun[p.n1](pos * p.f1 * p.I * fun[p.n2](pos * p.f2,j+1,arrb),j+1,arrb);
        }
        else if(p.m == 1) {
            arr[j] = p.A * fun[p.n1](pos * p.f1 * p.I * fun[p.n2](pos * p.f2 * fun[p.n3](pos * p.f3,j,arrb),j,arrb),j,arrb);
            arr[j+1] = p.A * fun[p.n1](pos * p.f1 * p.I * fun[p.n2](pos * p.f2 * fun[p.n3](pos * p.f3,j+1,arrb),j+1,arrb),j+1,arrb);
        }
        else if(p.m == 2) {
            arr[j] = p.A * fun[p.n1](pos * p.f1 * p.I * (fun[p.n2](pos * p.f2,j,arrb) + fun[p.n3](pos * p.f3,j,arrb)),j,arrb);
            arr[j+1] = p.A * fun[p.n1](pos * p.f1 * p.I * (fun[p.n2](pos * p.f2,j+1,arrb) + fun[p.n3](pos * p.f3,j+1,arrb)),j+1,arrb);
        }
        else if(p.m == 3) {
            arr[j] = fun[p.n1](pos,j,arrb);
            arr[j+1] = fun[p.n1](pos,j+1,arrb);
        }
    }
    var buf = Buffer.from(arr);
    this.push(buf);
    i+=size;
    callback();
};



file.once('readable', function () {
    var myFile = fs.createWriteStream('output.wav');
    var rs = new ModulateStream();
    file.pipe(rs);
    rs.pipe(speaker);
    rs.pipe(myFile);
});

log('o: save synth settings');
log('m: change modulation mode');
log('t,g,b: change osc1,2,3');
log('j: I(t)*=2\tl: I(t)/=2');
log('z: osc3*=2\tx: osc3/=2');
log('a: osc2*=2\ts: osc2/=2');
log('q: osc1*=2\tw: osc1/=2');
log('keyboard shortcuts:');
