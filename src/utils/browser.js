/**
 * reference:
 * http://keenwon.com/851.html
 */
const isNode = require('./isNode');
/**
 * 
 */
const sys = {};

if (!isNode) {
    const ua = navigator.userAgent.toLowerCase();
    //store version
    let s;
    (s = ua.match(/rv:([\d.]+)\) like gecko/)) ? sys.ie = s[1] :
        (s = ua.match(/msie ([\d.]+)/)) ? sys.ie = s[1] :
            (s = ua.match(/firefox\/([\d.]+)/)) ? sys.firefox = s[1] :
                (s = ua.match(/chrome\/([\d.]+)/)) ? sys.chrome = s[1] :
                    (s = ua.match(/opera.([\d.]+)/)) ? sys.opera = s[1] :
                        (s = ua.match(/version\/([\d.]+).*safari/)) ? sys.safari = s[1] : 0;
}

module.exports = sys;