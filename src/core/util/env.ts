/**
 * from detect-node
 * https://github.com/iliakan/detect-node
 *
 * @property {boolean} IS_NODE - whether running in nodejs but not on electron,node-webkit
 * @global
 * @name IS_NODE
 */
export const IS_NODE = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]' && !process.versions['electron'] && !process.versions['nw'] && !process.versions['node-webkit'];

export function getGlobalThis() {
    return typeof globalThis !== 'undefined' ? globalThis : global || self;
}