/**
*   @author }{yellow
*   @date 2017/4/18
*   @desc  初始化加载，判断是否是node、浏览器环境
*/

export const isNode =
    typeof process === 'object' && String(process) === '[object process]' && !process.browser;

export const isBroswer = !isNode;

export default isBroswer;
