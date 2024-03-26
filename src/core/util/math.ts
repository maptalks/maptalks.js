import { subtract, length, normalize, cross } from './vec3';
import { Matrix4InOut, Vector3, Vector4 } from './mat4'
//contains code from THREE.js

export function applyMatrix(out: Matrix4InOut, v: Vector3, e: Matrix4InOut) {
    const x = v[0], y = v[1], z = v[2];
    // const e = in;

    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    out[0] = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    out[1] = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    out[2] = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

    return out;
}

export function applyMatrix4(out: Matrix4InOut, v: Vector4, e: Matrix4InOut) {
    const x = v[0], y = v[1], z = v[2], w = v[3];

    out[0] = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
    out[1] = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
    out[2] = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
    out[3] = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

    return this;

}

export function matrixToQuaternion(out, te) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

    const m11 = te[0], m12 = te[4], m13 = te[8],
        m21 = te[1], m22 = te[5], m23 = te[9],
        m31 = te[2], m32 = te[6], m33 = te[10],

        trace = m11 + m22 + m33;
    let s;

    if (trace > 0) {

        s = 0.5 / Math.sqrt(trace + 1.0);

        out.w = 0.25 / s;
        out.x = (m32 - m23) * s;
        out.y = (m13 - m31) * s;
        out.z = (m21 - m12) * s;

    } else if (m11 > m22 && m11 > m33) {

        s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

        out.w = (m32 - m23) / s;
        out.x = 0.25 * s;
        out.y = (m12 + m21) / s;
        out.z = (m13 + m31) / s;

    } else if (m22 > m33) {

        s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

        out.w = (m13 - m31) / s;
        out.x = (m12 + m21) / s;
        out.y = 0.25 * s;
        out.z = (m23 + m32) / s;

    } else {

        s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

        out.w = (m21 - m12) / s;
        out.x = (m13 + m31) / s;
        out.y = (m23 + m32) / s;
        out.z = 0.25 * s;

    }

    return this;
}

export function quaternionToMatrix(out: Matrix4InOut, q) {
    const te = out;

    const x = q.x, y = q.y, z = q.z, w = q.w;
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    te[0] = 1 - (yy + zz);
    te[4] = xy - wz;
    te[8] = xz + wy;

    te[1] = xy + wz;
    te[5] = 1 - (xx + zz);
    te[9] = yz - wx;

    te[2] = xz - wy;
    te[6] = yz + wx;
    te[10] = 1 - (xx + yy);

    // last column
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;

    // bottom row
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;

    return te;
}

export function setPosition(out: Matrix4InOut, v: Vector3) {
    const te = out;

    te[12] = v[0];
    te[13] = v[1];
    te[14] = v[2];

    return out;
}

export function lookAt(te: Matrix4InOut, eye, target, up) {
    const x: Vector3 = [0, 0, 0];
    const y: Vector3 = [0, 0, 0];
    const z: Vector3 = [0, 0, 0];
    subtract(z, eye, target);

    if (length(z) === 0) {

        // eye and target are in the same position

        z[2] = 1;

    }

    normalize(z, z);
    cross(x, up, z);

    if (length(z) === 0) {

        // up and z are parallel

        if (Math.abs(up[2]) === 1) {

            z[0] += 0.0001;

        } else {

            z[2] += 0.0001;

        }

        normalize(z, z);
        cross(x, up, z);

    }

    normalize(x, x);
    cross(y, z, x);

    te[0] = x[0]; te[4] = y[0]; te[8] = z[0];
    te[1] = x[1]; te[5] = y[1]; te[9] = z[1];
    te[2] = x[2]; te[6] = y[2]; te[10] = z[2];

    return te;
}
