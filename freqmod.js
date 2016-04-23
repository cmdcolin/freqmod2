// Usage node freqmod.js|play -c 1 -r 44100 -b 16 -q -t raw -e signed-integer -

var buflen = 200000;
var buf = new Uint16Array(buflen);

for(var i=0;i<buflen;i++) {
    buf[i]=Math.sin(i/20)*1000;
}

process.stdout.write(new Buffer(buf.buffer),'binary');
