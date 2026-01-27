import transcoder from '../dist/transcoder.js';
import transcoders from '@maptalks/gl/dist/transcoders.js';

transcoders.registerTranscoder('ktx2', transcoder);

export default transcoder;
