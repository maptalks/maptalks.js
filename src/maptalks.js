"use strict";
"version:1.0.0-alpha";

// Z is the root namespace used internally, and will be exported later as maptalks.
/**
 * @namespace
 * @alias maptalks
 */
var Z = {};

/**
 * @property {boolean} node - whether running in nodejs.
 */
Z.node=(function(){
    return (typeof module !== 'undefined' && module.exports)?true:false;
})();
