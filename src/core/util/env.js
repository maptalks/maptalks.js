/**
 * From https://github.com/abhirathore2006/detect-is-node/
 *
 * @property {boolean} IS_NODE - whether running in nodejs.
 * @global
 * @name IS_NODE
 */
export const IS_NODE = (function () {
    return new Function('try { return this === global; } catch(e) { return false; }')();
})();
