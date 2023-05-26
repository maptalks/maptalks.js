import { isFunction } from './util/common';
import { IS_NODE } from './util/env';
type removeDPRListeningFunc = (map) => void;
type checkDevicePixelRatioFunc = () => boolean;
type addDPRListeningFunc = (map) => void;
type BrowserType = {
    edge?: boolean,
    ie?: boolean,
    ielt9?: boolean,
    ie9?: boolean,
    safari?: boolean,
    webkit?: boolean,
    phantomjs?: boolean,
    android?: boolean,
    android23?: boolean,
    chrome?: boolean,
    gecko?: boolean,
    iosWeixin?: boolean,
    mobile?: boolean,
    mobileWebkit?: boolean,
    mobileWebkit3d?: boolean,
    msPointer?: boolean,
    pointer?: boolean,
    ie3d?: boolean,
    webkit3d?: boolean,
    gecko3d?: boolean,
    opera12?: boolean,
    any3d?: boolean,
    imageBitMap?: boolean,
    resizeObserver?: boolean,
    btoa?: boolean,
    proxy?: boolean,
    touch?: boolean,
    retina?: boolean,
    webgl?: boolean,
    language?: string,
    chromeVersion?: string,
    devicePixelRatio: number,
    monitorDPRChange?: boolean,
    supportsPassive?: boolean,
    decodeImageInWorker?: boolean;
    removeDPRListening: removeDPRListeningFunc,
    checkDevicePixelRatio: checkDevicePixelRatioFunc,
    addDPRListening: addDPRListeningFunc,
}
let Browser: BrowserType = {
    devicePixelRatio: 1,
    removeDPRListening: () => {

    },
    checkDevicePixelRatio: () => {

        return false;
    },
    addDPRListening: () => {

    }


};
const maps = {};

function getDevicePixelRatio() {
    //@ts-ignore
    return (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI));
}

if (!IS_NODE) {
    const ua = navigator.userAgent.toLowerCase(),
        doc = document.documentElement,

        ie = 'ActiveXObject' in window,

        webkit = ua.indexOf('webkit') !== -1,
        phantomjs = ua.indexOf('phantom') !== -1,
        android23 = ua.search('android [23]') !== -1,
        chrome = ua.indexOf('chrome') !== -1,
        //@ts-ignore
        gecko = ua.indexOf('gecko') !== -1 && !webkit && !window.opera && !ie,
        iosWeixin = /iphone/i.test(ua) && /micromessenger/i.test(ua),

        mobile = typeof orientation !== 'undefined' || ua.indexOf('mobile') !== -1,
        //@ts-ignore
        msPointer = !window.PointerEvent && window.MSPointerEvent,
        //@ts-ignore
        pointer = (window.PointerEvent && navigator.pointerEnabled) || msPointer,

        ie3d = ie && ('transition' in doc.style),
        webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
        gecko3d = 'MozPerspective' in doc.style,
        opera12 = 'OTransition' in doc.style,
        any3d = (ie3d || webkit3d || gecko3d) && !opera12 && !phantomjs,
        // https://developer.mozilla.org/zh-CN/docs/Web/API/ImageBitmap
        // this will Improve performance 2-3FPS
        imageBitMap = typeof window !== 'undefined' && isFunction(window.createImageBitmap),
        resizeObserver = typeof window !== 'undefined' && isFunction(window.ResizeObserver),
        btoa = typeof window !== 'undefined' && isFunction(window.btoa),
        proxy = typeof window !== 'undefined' && isFunction(window.Proxy);


    let chromeVersion = 0;
    if (chrome) {
        //@ts-ignore
        chromeVersion = ua.match(/chrome\/([\d.]+)/)[1];
    }

    const touch = !phantomjs && (pointer || 'ontouchstart' in window ||
        //@ts-ignore
        (window.DocumentTouch && document instanceof window.DocumentTouch));

    // let webgl;
    // try {
    //     const canvas = document.createElement('canvas');
    //     const gl = canvas.getContext('webgl') ||
    //         canvas.getContext('experimental-webgl');
    //     webgl = gl && gl instanceof WebGLRenderingContext;
    // } catch (err) {
    //     webgl = false;
    // }
    const webgl = typeof window !== 'undefined' && ('WebGLRenderingContext' in window);

    const devicePixelRatio = getDevicePixelRatio();

    let decodeImageInWorker = false;
    try {
        //@ts-ignore
        const offCanvas = new OffscreenCanvas(2, 2);
        offCanvas.getContext('2d');
        decodeImageInWorker = true;
    } catch (err) {
        decodeImageInWorker = false;
    }
    // https://github.com/Modernizr/Modernizr/issues/1894
    /* Add feature test for passive event listener support */
    let supportsPassive = false;
    try {
        //@ts-ignore
        window.addEventListener('testPassive', () => {
        }, {
            //@ts-ignore
            get passive() {
                supportsPassive = true;
            }
        });
        /*eslint-disable no-empty */
    } catch (e) {
    }

    Browser = {
        ie: ie,
        ielt9: ie && !document.addEventListener,
        edge: 'msLaunchUri' in navigator && !('documentMode' in document),
        webkit: webkit,
        gecko: gecko,
        android: ua.indexOf('android') !== -1,
        android23: android23,
        chrome: chrome,
        //@ts-ignore
        chromeVersion: chromeVersion,
        safari: !chrome && ua.indexOf('safari') !== -1,
        phantomjs: phantomjs,

        ie3d: ie3d,
        webkit3d: webkit3d,
        gecko3d: gecko3d,
        opera12: opera12,
        any3d: any3d,
        iosWeixin,

        mobile: mobile,
        mobileWebkit: mobile && webkit,
        mobileWebkit3d: mobile && webkit3d,
        //@ts-ignore
        mobileOpera: mobile && window.opera,
        mobileGecko: mobile && gecko,

        touch: !!touch,
        msPointer: !!msPointer,
        pointer: !!pointer,

        retina: devicePixelRatio > 1,
        devicePixelRatio,
        //@ts-ignore
        language: navigator.browserLanguage ? navigator.browserLanguage : navigator.language,
        //@ts-ignore
        ie9: (ie && document.documentMode === 9),
        //@ts-ignore
        ie10: (ie && document.documentMode === 10),

        webgl: webgl,
        imageBitMap,
        resizeObserver,
        btoa,
        decodeImageInWorker,
        monitorDPRChange: true,
        supportsPassive,
        proxy,
        removeDPRListening: (map) => {
            if (map) {
                delete maps[map.id];
            }
        },
        checkDevicePixelRatio: () => {
            if (typeof window !== 'undefined' && Browser.monitorDPRChange) {
                const devicePixelRatio = getDevicePixelRatio();
                const changed = devicePixelRatio !== Browser.devicePixelRatio;
                if (changed) {
                    Browser.devicePixelRatio = devicePixelRatio;
                }
                return changed;
            }
            return false;
        },
        addDPRListening: (map) => {
            if (map) {
                maps[map.id] = map;
            }
        }
    };
    //monitor devicePixelRatio change
    if (typeof window !== 'undefined' && window.matchMedia) {
        for (let i = 1; i < 500; i++) {
            const dpi = (i * 0.01).toFixed(2);
            const screen = window.matchMedia(`screen and (resolution: ${dpi}dppx)`);
            if (screen) {
                if (screen.addEventListener) {
                    //@ts-ignore
                    screen.addEventListener('change', Browser.checkDevicePixelRatio);
                } else if (screen.addListener) {
                    //@ts-ignore
                    screen.addListener(Browser.checkDevicePixelRatio);
                }
            }
        }

    }

    if (Browser.devicePixelRatio) {
        let tempDPI = Browser.devicePixelRatio;
        Object.defineProperty(Browser, 'devicePixelRatio', {
            get: () => {
                return tempDPI;
            },
            set: (value) => {
                if (value === tempDPI) {
                    return;
                }
                //when devicePixelRatio change force resize all layers
                tempDPI = value;
                if (!Browser.monitorDPRChange) {
                    return;
                }
                for (const mapId in maps) {
                    const map = maps[mapId];
                    if (!map || !map.options || map.options['devicePixelRatio'] || !map.checkSize || !map.getRenderer) {
                        continue;
                    }
                    const renderer = map.getRenderer();
                    if (renderer) {
                        map.checkSize(true);
                    }
                }
            }
        });
    }
}
export default Browser;
