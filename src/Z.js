"use strict";

//package internally used
/**
 * @ignore
 */
var Z = {};

Z.runningInNode=(function(){
    return (typeof module !== 'undefined' && module.exports)?true:false;
})();
