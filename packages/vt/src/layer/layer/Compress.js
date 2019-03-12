import deepEqual from 'fast-deep-equal';
import { extend } from '../../common/Util';

//merge renderPlugin definitions
export function compress(json) {
    const compressed = [];
    const pluginDefs = [];
    for (let i = 0; i < json.length; i++) {
        const style = json[i];
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
        compressed.push(target);
    }
    return {
        plugins: pluginDefs,
        styles: compressed
    };
}

export function uncompress(json) {
    if (!json.plugins) {
        return json;
    }
    const { plugins, styles } = json;
    const targets = new Array(styles.length);
    for (let i = 0; i < styles.length; i++) {
        targets[i] = extend({}, styles[i]);
        targets[i].renderPlugin = plugins[styles[i].renderPlugin];
    }
    return targets;
}
