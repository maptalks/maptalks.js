/**
 * @namespace
 */
const maptalks = {};

/**
 * From https://github.com/abhirathore2006/detect-is-node/
 *
 * @property {boolean} node - whether running in nodejs.
 * @global
 * @name node
 * @static
 */
maptalks.node = (function () {
    return new Function('try { return this === global; } catch(e) { return false; }')();
})();

import Ajax from './utils/Ajax';
import Canvas from './utils/Canvas';
import Matrix from './utils/Matrix';
import Promise from './utils/Promise';

maptalks.Ajax = Ajax;
maptalks.Canvas = Canvas;
maptalks.Matrix = Matrix;
maptalks.Promise = Promise;
