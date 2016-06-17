// Z is the root namespace used internally, and will be exported later as maptalks.
/**
 * @namespace
 * @alias maptalks
 */
var Z = {};

/**
 * @property {boolean} node - whether running in nodejs.
 * @global
 * @name node
 * @static
 */
Z.node = (function () {
    return (typeof module !== 'undefined' && module.exports);
})();
