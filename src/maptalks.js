
/**
 * @namespace
 */
var maptalks = {};

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
