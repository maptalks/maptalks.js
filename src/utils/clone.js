/**
*   @author }{yellow
*   @date 2017/4/18
*   @desc 复制对象
*   @param {Object} elem 待复制对象
*   @returns {Object} 返回对象
*/
export function clone(elem) {
    const t = elem.constructor.name;
    let ans;
    if (t === 'Object') {
        ans = {};
        for (const p in elem) {
            ans[p] = clone(elem[p]);
        }
    } else if (t === 'Array') {
        ans = [];
        for (let i = 0, l = elem.length; i < l; i++) {
            ans[i] = clone(elem[i]);
        }
    } else {
        ans = elem;
    }
    return ans;
}