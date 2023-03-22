import { quat, vec3, vec4 } from 'gl-matrix';
import { defined, lerp, set } from '../common/Util';

const  T = [0, 0, 0], R = [0, 0, 0, 1], S = [1, 1, 1];
const DEFAULT_VALUES = {
    TRANSLATION : [0, 0, 0],
    ROTATION : [0, 0, 0, 1],
    SCALE : [1, 1, 1]
};
const CLIP_PRENEXT = {
    PREVIOUS : null,
    NEXT : null,
    PREINDEX : null,
    NEXTINDEX : null,
    INTERPOLATION : null
};
const AnimationClip = {
    _getTRSW(name, gltf, node, time, translation, rotation, scale, weights) {
        const animations = !defined(name) ? [gltf.animations[0]] : gltf.animations;
        const trsw = {};
        for (let i = 0; i < animations.length; i++) {
            const animation = animations[i];
            const nameInAnimation = animation.name || i;
            if (defined(name) && nameInAnimation !== name) {
                continue;
            }
            const channelsMap = animation.channelsMap;
            const channels = channelsMap[node];
            if (channels) {
                for (let i = 0; i < channels.length; i++) {
                    const channel = channels[i];
                    if (channel.target.path === 'translation') {
                        this._getAnimateData(translation, animation.samplers[channel.sampler], time, 1);
                        trsw.translation = vec3.copy(T, translation);
                    } else if (channel.target.path === 'rotation') {
                        this._getQuaternion(rotation, animation.samplers[channel.sampler], time, 1);
                        trsw.rotation = quat.copy(R, rotation);
                    } else if (channel.target.path === 'scale') {
                        this._getAnimateData(scale, animation.samplers[channel.sampler], time, 1);
                        trsw.scale = vec3.copy(S, scale);
                    } else if (channel.target.path === 'weights' && weights) {
                        this._getAnimateData(weights, animation.samplers[channel.sampler], time, weights.length);
                        trsw.weights = weights;
                    }
                }
            }
        }
        return trsw;
    },

    _getAnimateData(out, sampler, time, stride) {
        switch (sampler.interpolation) {
        case 'LINEAR': {
            const preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 1 * stride);
            if (preNext) {
                out = lerp(out, preNext.PREVIOUS, preNext.NEXT, preNext.INTERPOLATION);
            }
            break;
        }
        case 'STEP': {
            const preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 1 * stride);
            if (preNext) {
                out = set(out, ...preNext.PREVIOUS);
            }
            break;
        }
        case 'CUBICSPLINE': {
            const preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 3 * stride);
            if (preNext) {
                out = this._getCubicSpline(out, preNext, sampler.input.array, 3 * stride);
            }
            break;
        }
        }
        return out;
    },

    _getQuaternion(out, sampler, time) {
        switch (sampler.interpolation) {
        case 'LINEAR': {
            const preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 1);
            if (preNext) {
                quat.slerp(out, preNext.PREVIOUS, preNext.NEXT, preNext.INTERPOLATION);
            }
            break;
        }
        case 'STEP': {
            const preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 1);
            if (preNext) {
                out = vec4.set(out, ...preNext.PREVIOUS);
            }
            break;
        }
        case 'CUBICSPLINE': {
            const preNext = this._getPreNext(CLIP_PRENEXT, sampler, time, 3);
            if (preNext) {
                for (let i = 0; i < preNext.PREVIOUS.length; i++) {
                    preNext.PREVIOUS[i] = Math.acos(preNext.PREVIOUS[i]);
                    preNext.NEXT[i] = Math.acos(preNext.NEXT[i]);
                }
                out = this._getCubicSpline(out, preNext, sampler.input.array, 3);
                for (let j = 0; j < out.length; j++) {
                    out[j] = Math.cos(out[j]);
                }
            }
            break;
        }
        }
        return out;
    },

    _search(array, time) {
        const length = array.length;
        let left = 0;
        let right = length - 1;
        let middle = Math.floor((left + right) / 2);
        let preIndx, nextIndex, interpolation;
        while (left <= length - 1 && right >= 0) {
            if (left === right) {
                return null;
            } else if (array[middle] <= time && time <= array[middle + 1]) {
                const previousTime = array[middle];
                const nextTime = array[middle + 1];
                preIndx = middle;
                nextIndex = middle + 1;
                interpolation = (time - previousTime) / (nextTime - previousTime);
                return { preIndx, nextIndex, interpolation };
            } else if (time < array[middle]) {
                right = middle;
                middle = Math.floor((left + right) / 2);
            } else if (array[middle + 1] < time) {
                left = middle;
                middle = Math.floor((left + right) / 2);
            }
        }
        return null;
    },

    _getPreNext(out, sampler, time, stride) {
        const input = sampler.input.array;
        const output = sampler.output.array;
        const itemSize = sampler.output.itemSize;
        // const interpolation = this._getInterpolation(preNext, input, time);
        if (time < input[0] || time > input[input.length - 1]) {
            time = Math.max(input[0], Math.min(input[input.length - 1], time));
        } if (time === input[input.length - 1]) {
            time = input[0];
        }
        const result = this._search(input, time);
        if (!result || !result.nextIndex) {
            return null;
        }
        const { preIndx, nextIndex, interpolation } = result;
        out.PREINDEX = preIndx;
        out.NEXTINDEX = nextIndex;
        out.INTERPOLATION = interpolation;
        //previous + interpolationValue * (next - previous)
        const width = itemSize * stride;
        out.PREVIOUS = output.subarray(out.PREINDEX * width, (out.PREINDEX + 1) * width);
        out.NEXT = output.subarray(out.NEXTINDEX * width, (out.NEXTINDEX + 1) * width);
        return out;
    },

    _getCubicSpline(out, preNext, input, length) {
        const t = preNext.INTERPOLATION;
        const tk = input[preNext.PREINDEX];
        const tk1 = input[preNext.NEXTINDEX];
        for (let i = 0; i < 3; i++) {
            const p0 = preNext.PREVIOUS[length + i];
            const m0 = (tk1 - tk) * preNext.PREVIOUS[length * 2 + i];
            const p1 = preNext.NEXT[3 + i];
            const m1 = (tk1 - tk) * preNext.NEXT[i];
            const pti = (Math.pow(t, 3) * 2 - Math.pow(t, 2) * 3 + 1) * p0 + (Math.pow(t, 3) - Math.pow(t, 2) * 2 + t) * m0 + (-Math.pow(t, 3) * 2 + Math.pow(t, 2) * 3) * p1 + (Math.pow(t, 3) - Math.pow(t, 2)) * m1;
            out[i] = pti;
        }
        return out;
    },

    getAnimationClip(gltf, node, time, name) {
        const weights = gltf.nodes[node] && gltf.nodes[node].weights;
        //在channel.target.node === node这一条件不满足的时候，直接使用全局T、R、S可能是上一帧的T、R、S值,所以需要重置
        vec3.set(T, ...DEFAULT_VALUES.TRANSLATION);
        vec4.set(R, ...DEFAULT_VALUES.ROTATION);
        vec3.set(S, ...DEFAULT_VALUES.SCALE);
        const animation = this._getTRSW(name, gltf, node, time, T, R, S, weights);
        return animation;
    },

    //https://github.com/BabylonJS/Babylon.js/issues/3548
    //每个node的动画的时间间隔应该对齐到整个scene的时间线上来，且是否loop循环需要交给上层调用来决定
    getTimeSpan(gltf) {
        if (!gltf.animations) {
            return null;
        }
        if (gltf.timeSpan) {
            return gltf.timeSpan;
        }
        const animations = gltf.animations;
        gltf.timeSpan = {};
        animations.forEach((animation, index) => {
            let max = -Infinity, min = Infinity;
            const channels = animation.channels;
            for (let i = 0; i < channels.length; i++) {
                const channel = channels[i];
                const sampler = animation.samplers[channel.sampler];
                const input = sampler.input.array;
                //max.push(input[input.length - 1]);
                //min.push(input[0]);
                if (input[input.length - 1] > max) {
                    max = input[input.length - 1];
                }
                if (input[0] < min) {
                    min = input[0];
                }
            }
            //如果animation.name不存在，用animation的索引代替
            const key = animation.name || index;
            gltf.timeSpan[key] = { max, min };
        });
        return gltf.timeSpan;
    },

    getTimeSpanByName(gltf, name) {
        const timeSpan = this.getTimeSpan(gltf);
        if (!timeSpan) {
            return null;
        }
        if (!defined(name)) {
            //默认返回第一个动画
            return timeSpan[Object.keys(timeSpan)[0]];
        }
        return timeSpan[name];
    }
};

export default  AnimationClip;
