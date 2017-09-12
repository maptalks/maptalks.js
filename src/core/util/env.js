/**
 * from detect-node
 * https://github.com/iliakan/detect-node
 *
 * @property {boolean} IS_NODE - whether running in nodejs but not on electron
 * @global
 * @name IS_NODE
 */
export const IS_NODE = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]' && !process.versions['electron'];
