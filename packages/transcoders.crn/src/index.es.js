import transcoder from '../dist/transcoder.js';
import transcoders from '@maptalks/gl/dist/transcoders.js';

transcoders.registerTranscoder('crn', transcoder);

export default transcoder;
