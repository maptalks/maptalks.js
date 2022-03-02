import transcoder from '../dist/transcoder.js';
import transcoders from '@maptalks/gl/dist/transcoders';

transcoders.registerTranscoder('crn', transcoder);
