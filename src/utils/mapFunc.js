/**
 * 解决js不能重载函数问题
 * refernece:
 * http://www.cnblogs.com/yugege/p/5539020.html
 */
/**
 * @func
 * @param {Object} ctx
 * @param {string} funcName,
 * @param {Function} fn
 */
 const mapFunc=(obj,ctx,name,fn)=>{
    let old = obj[name];
    obj[name] = function() {
　　　　if(fn.length === arguments.length) {
　　　　　　return fn.apply(ctx, arguments);
　　　　} else if(typeof old === "function") {
　　　　　　return old.apply(ctx, arguments);
　　　　}
　　}
 }

 module.exports = mapFunc;