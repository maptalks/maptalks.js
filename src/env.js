/**
 * From https://github.com/abhirathore2006/detect-is-node/
 *
 * @property {boolean} isNode - whether running in nodejs.
 * @global
 * @name isNode
 */
export const isNode = (function () {
    return new Function('try { return this === global; } catch(e) { return false; }')();
})();
