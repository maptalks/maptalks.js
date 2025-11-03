import transcoder from '../dist/transcoder.js';
import transcoders from '@maptalks/gl/dist/transcoders.js';
import transcodersGPU from '@maptalks/gpu/dist/transcoders.js';

if ((typeof transcoders) !== 'undefined') {
    transcoders.registerTranscoder('crn', transcoder);
} else {
    transcodersGPU.registerTranscoder('crn', transcoder);
}
