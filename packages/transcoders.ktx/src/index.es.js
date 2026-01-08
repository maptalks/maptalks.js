import transcoder from '../dist/transcoder.js';
import transcoders from '@maptalks/gl/dist/transcoders.js';
import transcodersGPU from '@maptalks/gpu/dist/transcoders.js';

if ((typeof transcoders) !== 'undefined') {
    transcoders.registerTranscoder('ktx2', transcoder);
} else {
    transcodersGPU.registerTranscoder('ktx2', transcoder);
}

export default transcoder;
