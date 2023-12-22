
/**
 * get fetch default options
 * how to use?
 * 1. import {getFetchDefaultOptions} from '[path]/Fetch'
 * 2. worker 写个全局函数,需要的地方self.getFetchDefaultOptions
 * 3. 注意要和用户自定义的options进行合并Object.assign({},getFetchDefaultOptions(),options);
 * @example
 * fetch(url,Object.assign((),getFetchDefaultOptions(),options));
 * @returns
 * @private
 */
export function getFetchDefaultOptions() {
    let userAgent = '', host = '', referer = '', origin = '';
    let protocol = '';
    const BLOB_PROTOCOL = 'blob:';
    if (typeof navigator !== 'undefined') {
        userAgent = navigator.userAgent;
    }
    let context;
    if (typeof window !== 'undefined') {
        context = window;
    } else if (typeof self !== 'undefined') {
        context = self;
    }
    if (context) {
        host = context.location.host;
        referer = context.location.href;
        origin = context.location.origin;
        protocol = context.location.protocol;
    }
    if (protocol === BLOB_PROTOCOL) {
        if (!host) {
            host = origin.substring(origin.indexOf('//') + 2, Infinity);
        }
        referer = referer.replace(BLOB_PROTOCOL, '');
        referer = referer.substring(0, referer.lastIndexOf('/'));
    }

    return {
        headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
            'Connection': 'keep-alive',
            'Host': host,
            'Origin': origin,
            'Referer': referer,
            'User-Agent': userAgent
        },
        referrer: referer
    };
}
