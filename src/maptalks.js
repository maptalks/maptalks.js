
/**
 * @namespace
 * @alias maptalks
 */
var Z = {};
// Z is the root namespace used internally, and will be exported as maptalks.

/**
 * From https://github.com/abhirathore2006/detect-is-node/
 *
 * @property {boolean} node - whether running in nodejs.
 * @global
 * @name node
 * @static
 */
Z.node = (function () {
    return new Function('try { return this === global; } catch(e) { return false; }')();
})();
