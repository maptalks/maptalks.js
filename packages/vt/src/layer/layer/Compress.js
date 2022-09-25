import deepEqual from 'fast-deep-equal';
import { extend } from '../../common/Util';

//merge renderPlugin definitions
export function compress(json) {
    if (Array.isArray(json)) {
        json = {
            style: json,
            featureStyle: []
        };
    }
    const compressedStyle = [];
    const compressedFeatureStyle = [];
    const pluginDefs = [];
    visitStyle(json.style, compressedStyle, pluginDefs);
    visitStyle(json.featureStyle, compressedFeatureStyle, pluginDefs);
    const compressed = {
        plugins: pluginDefs,
        styles: {
            style: compressedStyle,
            featureStyle: compressedFeatureStyle
        }
    };
    if (json['$root']) {
        compressed['$root'] = json['$root'];
    }
    // if (json['$iconset']) {
    //     compressed['$iconset'] = json['$iconset'];
    // }
    return compressed;
}

function visitStyle(styles, compressedStyle, pluginDefs) {
    for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        const target = extend({}, style);
        const { renderPlugin } = style;
        const copy = extend({}, renderPlugin);
        if (copy.sceneConfig && !Object.keys(copy.sceneConfig).length) {
            delete copy.sceneConfig;
        }
        let hit = -1;
        for (let ii = pluginDefs.length - 1; ii >= 0; ii--) {
            //一般相同plugin的style会定义在一起，因此倒序以减少循环次数
            if (deepEqual(copy, pluginDefs[ii])) {
                hit = ii;
                break;
            }
        }
        if (hit < 0) {
            hit = pluginDefs.length;
            pluginDefs.push(copy);
        }
        target.renderPlugin = hit;
        compressedStyle.push(target);
    }
}

export function uncompress(json) {
    if (!json.plugins) {
        return json;
    }
    const { plugins, styles } = json;
    let { style, featureStyle } = styles;
    style = style || [];
    featureStyle = featureStyle || [];
    const targetStyle = new Array(style.length);
    for (let i = 0; i < style.length; i++) {
        targetStyle[i] = extend({}, style[i]);
        targetStyle[i].renderPlugin = plugins[style[i].renderPlugin];
    }
    const targetFeatureStyle = new Array(featureStyle.length);
    for (let i = 0; i < featureStyle.length; i++) {
        targetFeatureStyle[i] = extend({}, featureStyle[i]);
        targetFeatureStyle[i].renderPlugin = plugins[featureStyle[i].renderPlugin];
    }
    const target = {
        style: targetStyle,
        featureStyle: targetFeatureStyle
    };
    if (json['$root']) {
        target['$root'] = json['$root'];
    }
    // if (json['$iconset']) {
    //     target['$iconset'] = json['$iconset'];
    // }
    return target;
}
