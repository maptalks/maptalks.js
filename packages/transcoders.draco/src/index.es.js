import transcoder from '../dist/transcoder.js';
import transcoders from '@maptalks/gl/dist/transcoders.js';

transcoders.registerTranscoder('draco', transcoder);

export default transcoder;
