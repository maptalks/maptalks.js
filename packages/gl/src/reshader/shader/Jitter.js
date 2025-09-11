import { vec2 } from 'gl-matrix';

const SAMPLES = [
    [.263385, -.0252475],
    [-.38545, .054485],
    [-.139795, -.5379925],
    [-.2793775, .6875475],
    [.7139025, .4710925],
    [.90044, -.16422],
    [.4481775, -.82799],
    [-.9253375, -.2910625],
    [.3468025, 1.02292],
    [-1.13742, .33522],
    [-.7676225, -.9123175],
    [-.2005775, -1.1774125],
    [-.926525, .96876],
    [1.12909, -.7500325],
    [.9603, 1.14625]
];

const SAMPLE_COUNT = SAMPLES.length;

const AVG = [0, 0];
for (let i = 0; i < SAMPLES.length; i++) {
    AVG[0] += SAMPLES[i][0];
    AVG[1] += SAMPLES[i][1];
}
AVG[0] /= SAMPLE_COUNT;
AVG[1] /= SAMPLE_COUNT;

class Jitter {
    constructor(ratio) {
        this._frameNum = 0;
        // this._ratio = 0.05;
        this._ratio = ratio || 0.05;
        this._avg = [AVG[0] * this._ratio, AVG[1] * this._ratio];
    }

    getRatio() {
        return this._ratio;
    }

    setRatio(ratio) {
        if (this._ratio !== ratio) {
            this._ratio = ratio;
            this.reset();
        }
        this._avg = [AVG[0] * this._ratio, AVG[1] * this._ratio];
    }

    getAverage() {
        return this._avg;
    }

    reset() {
        this._frameNum = 0;
    }

    getJitter(out) {
        const t = this._frameNum % SAMPLE_COUNT;
        const r = this._ratio;
        vec2.set(out, SAMPLES[t][0] * r, SAMPLES[t][1] * r);
        // out[0] = out[1] = 0;
        return out;
    }

    frame() {
        this._frameNum++;
        if (this._frameNum % SAMPLE_COUNT === 0) {
            this._frameNum = 0;
        }
    }

    getSampleCount() {
        return SAMPLE_COUNT;
    }
}

export default Jitter;


////jitter generation from:
////https://github.com/playdeadgames/temporal/blob/4795aa0007d464371abe60b7b28a1cf893a4e349/Assets/Scripts/FrustumJitter.cs
// function transformPattern(seq, theta, scale) {
//     const cs = Math.cos(theta);
//     const sn = Math.sin(theta);
//     const n = seq.length;
//     for (let i = 0, j = 1; i !== n; i += 2, j += 2) {
//         const x = scale * seq[i];
//         const y = scale * seq[j];
//         seq[i] = x * cs - y * sn;
//         seq[j] = x * sn + y * cs;
//     }
// }

// function initializeHalton_2_3(seq) {
//     for (let i = 0, n = seq.length / 2; i !== n; i++) {
//         const u = haltonSeq(2, i + 1) - 0.5;
//         const v = haltonSeq(3, i + 1) - 0.5;
//         seq[2 * i + 0] = u;
//         seq[2 * i + 1] = v;
//     }
// }

// function haltonSeq(prime, index = 1/* NOT! zero-based */) {
//     let r = 0.0;
//     let f = 1.0;
//     let i = index;
//     while (i > 0) {
//         f /= prime;
//         r += f * (i % prime);
//         i = Math.floor(i / prime);
//     }
//     return r;
// }

// const POINTS_PENTAGRAM = [
//     0.000000 * 0.5,  0.525731 * 0.5, // head
//     -0.309017 * 0.5, -0.425325 * 0.5, // lleg
//     0.500000 * 0.5,  0.162460 * 0.5, // rarm
//     -0.500000 * 0.5,  0.162460 * 0.5, // larm
//     0.309017 * 0.5, -0.425325 * 0.5, // rleg
// ];

// function jitter() {
//     const vh = [POINTS_PENTAGRAM[0] - POINTS_PENTAGRAM[2], POINTS_PENTAGRAM[1] - POINTS_PENTAGRAM[3]];
//     const vu = [0.0, 1.0];
//     const angle = vec2.angle(vu, vh);
//     transformPattern(POINTS_PENTAGRAM, 0.5 * angle, 1);

//     const points_Halton_2_3_x8 = new Array(8 * 2);
//     const points_Halton_2_3_x16 = new Array(16 * 2);
//     const points_Halton_2_3_x32 = new Array(32 * 2);
//     const points_Halton_2_3_x256 = new Array(256 * 2);
//     // points_Halton_2_3_xN
//     initializeHalton_2_3(points_Halton_2_3_x8);
//     initializeHalton_2_3(points_Halton_2_3_x16);
//     // initializeHalton_2_3(points_Halton_2_3_x32);
//     // initializeHalton_2_3(points_Halton_2_3_x256);

//     console.log(points_Halton_2_3_x8);
//     console.log(points_Halton_2_3_x16);
//     // console.log(points_Halton_2_3_x32);
//     // console.log(points_Halton_2_3_x256);
// }
