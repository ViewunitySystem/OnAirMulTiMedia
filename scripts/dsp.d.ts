declare module 'dsp.js' {
  export class FFT {
    constructor(bufferSize: number, sampleRate: number);
    forward(buffer: Float32Array): Float32Array;
    inverse(buffer: Float32Array): Float32Array;
  }
}
