# freqmod2


## Usage

Oscillators only

    node freqmod.js

With external sound modulation

    node freqmod.js file.wav

## Features

- Uses blessed library for a terminal "interface" like ncurses
- Uses custom implementation of a NodeJS stream to output audio data to speaker
- Also outputs audio to a raw wave file output.wav
- Re-implementation of the C based freqmod synth
- Save synth settings to .synthrc

## Links

* https://github.com/chjj/blessed
* https://github.com/TooTallNate/node-speaker
* https://github.com/cmdcolin/freqmod
