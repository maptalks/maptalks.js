/**
 * reference:
 * https://github.com/uber/luma.gl/blob/master/src/utils/is-browser.js
 */
const isNode = typeof process === 'object' && String(process) === '[object process]' && !process.browser;

module.exports = isNode;